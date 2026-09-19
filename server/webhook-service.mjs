// Serviço independente: recebe os webhooks do "outro site" e guarda os dados
// de cada cliente (conta, carteira, histórico) em SQLite. Roda separado do
// app principal (TanStack Start) pra não depender de nada experimental ali.
//
// Endpoints:
//   GET  /api/account?external_id=X  -> retorna a conta desse cliente (sem o
//                                        parâmetro, retorna a conta padrão,
//                                        dono do site — usada como preview)
//   POST /api/webhooks/wallet        -> recebe eventos e atualiza a carteira do cliente
//   GET  /api/auction/current        -> retorna o leilão atual (status, prazo, lances)
//   POST /api/webhooks/auction       -> recebe eventos do servidor de leilão externo
//
// Variáveis de ambiente:
//   PORT                    (padrão 3021)
//   WEBHOOK_SECRET           obrigatório — o "outro site" precisa mandar esse valor
//                             no header X-Webhook-Secret em toda chamada ao webhook da carteira.
//   AUCTION_WEBHOOK_SECRET   obrigatório — segredo separado pro servidor de leilão,
//                             enviado no header X-Webhook-Secret nas chamadas a /api/webhooks/auction.
//   DB_PATH                  (padrão ./data/privefeet.db)

import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const PORT = Number(process.env.PORT || 3021);
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const AUCTION_WEBHOOK_SECRET = process.env.AUCTION_WEBHOOK_SECRET;
const DB_PATH = process.env.DB_PATH || "./data/privefeet.db";

if (!WEBHOOK_SECRET) {
  console.error("WEBHOOK_SECRET não definido. Configure a variável de ambiente antes de iniciar.");
  process.exit(1);
}
if (!AUCTION_WEBHOOK_SECRET) {
  console.error("AUCTION_WEBHOOK_SECRET não definido. Configure a variável de ambiente antes de iniciar.");
  process.exit(1);
}

mkdirSync(dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    handle TEXT NOT NULL,
    saldo_centavos INTEGER NOT NULL DEFAULT 0,
    mes_centavos INTEGER NOT NULL DEFAULT 0,
    seguidores INTEGER NOT NULL DEFAULT 0,
    publicacoes_centavos INTEGER NOT NULL DEFAULT 0,
    colecoes_centavos INTEGER NOT NULL DEFAULT 0,
    gorjetas_centavos INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS wallet_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    external_event_id TEXT UNIQUE,
    category TEXT NOT NULL,
    amount_centavos INTEGER NOT NULL DEFAULT 0,
    raw_payload TEXT,
    received_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS auctions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'ended'
    ends_at TEXT NOT NULL,
    winner_name TEXT,
    winner_amount_centavos INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS auction_bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auction_id INTEGER NOT NULL REFERENCES auctions(id),
    external_event_id TEXT UNIQUE,
    bidder_name TEXT NOT NULL,
    bidder_flag TEXT,
    amount_centavos INTEGER NOT NULL,
    received_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Conta padrão exibida no painel hoje (dono do site), seedada uma vez com
// os valores que já estavam fixos na tela.
const DEFAULT_EXTERNAL_ID = "owner";
const seedDefault = db.prepare(`
  INSERT OR IGNORE INTO accounts
    (external_id, name, handle, saldo_centavos, mes_centavos, seguidores, publicacoes_centavos, colecoes_centavos, gorjetas_centavos)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
seedDefault.run(DEFAULT_EXTERNAL_ID, "Teodosio Real", "@teodosio", 7500, 124000, 312, 89000, 28000, 7000);

const getAccountByExternalId = db.prepare(`SELECT * FROM accounts WHERE external_id = ?`);
const insertAccount = db.prepare(`
  INSERT INTO accounts (external_id, name, handle) VALUES (?, ?, ?)
`);
const insertEvent = db.prepare(`
  INSERT OR IGNORE INTO wallet_events (account_id, external_event_id, category, amount_centavos, raw_payload)
  VALUES (?, ?, ?, ?, ?)
`);
const bumpSaldo = db.prepare(`UPDATE accounts SET saldo_centavos = saldo_centavos + ?, updated_at = datetime('now') WHERE id = ?`);
const bumpMes = db.prepare(`UPDATE accounts SET mes_centavos = mes_centavos + ?, updated_at = datetime('now') WHERE id = ?`);
const bumpSeguidores = db.prepare(`UPDATE accounts SET seguidores = seguidores + ?, updated_at = datetime('now') WHERE id = ?`);
const bumpCategoria = {
  publicacoes: db.prepare(`UPDATE accounts SET publicacoes_centavos = publicacoes_centavos + ?, updated_at = datetime('now') WHERE id = ?`),
  colecoes: db.prepare(`UPDATE accounts SET colecoes_centavos = colecoes_centavos + ?, updated_at = datetime('now') WHERE id = ?`),
  gorjetas: db.prepare(`UPDATE accounts SET gorjetas_centavos = gorjetas_centavos + ?, updated_at = datetime('now') WHERE id = ?`),
};

const getAuctionByExternalId = db.prepare(`SELECT * FROM auctions WHERE external_id = ?`);
const getLatestAuction = db.prepare(`SELECT * FROM auctions ORDER BY id DESC LIMIT 1`);
const insertAuction = db.prepare(`
  INSERT INTO auctions (external_id, status, ends_at) VALUES (?, 'active', ?)
`);
const updateAuctionEndsAt = db.prepare(`UPDATE auctions SET ends_at = ?, updated_at = datetime('now') WHERE id = ?`);
const endAuction = db.prepare(`
  UPDATE auctions SET status = 'ended', winner_name = ?, winner_amount_centavos = ?, updated_at = datetime('now') WHERE id = ?
`);
const insertBid = db.prepare(`
  INSERT OR IGNORE INTO auction_bids (auction_id, external_event_id, bidder_name, bidder_flag, amount_centavos)
  VALUES (?, ?, ?, ?, ?)
`);
const getBidsForAuction = db.prepare(`
  SELECT bidder_name, bidder_flag, amount_centavos FROM auction_bids
  WHERE auction_id = ? ORDER BY amount_centavos DESC LIMIT 20
`);

function toPublicAuction(row) {
  if (!row) return null;
  const bids = getBidsForAuction.all(row.id).map((b) => ({
    name: b.bidder_name,
    flag: b.bidder_flag || "🏳️",
    amount: b.amount_centavos / 100,
  }));
  return {
    externalId: row.external_id,
    status: row.status,
    endsAt: row.ends_at,
    winnerName: row.winner_name,
    winnerAmount: row.winner_amount_centavos != null ? row.winner_amount_centavos / 100 : null,
    bids,
  };
}

function toPublicAccount(row) {
  return {
    externalId: row.external_id,
    name: row.name,
    handle: row.handle,
    saldo: row.saldo_centavos / 100,
    esteMes: row.mes_centavos / 100,
    seguidores: row.seguidores,
    publicacoes: row.publicacoes_centavos / 100,
    colecoes: row.colecoes_centavos / 100,
    gorjetas: row.gorjetas_centavos / 100,
  };
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) req.destroy(); // limite de 1MB, evita payload abusivo
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("invalid_json"));
      }
    });
    req.on("error", reject);
  });
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  res.setHeader("content-type", "application/json; charset=utf-8");

  if (req.method === "GET" && url.pathname === "/api/account") {
    const requestedId = url.searchParams.get("external_id");
    const row = getAccountByExternalId.get(requestedId || DEFAULT_EXTERNAL_ID);
    if (!row) {
      res.writeHead(404);
      res.end(JSON.stringify({ ok: false, error: "conta não encontrada" }));
      return;
    }
    res.writeHead(200);
    res.end(JSON.stringify(toPublicAccount(row)));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/webhooks/wallet") {
    const providedSecret = req.headers["x-webhook-secret"];
    if (typeof providedSecret !== "string" || !timingSafeEqual(providedSecret, WEBHOOK_SECRET)) {
      res.writeHead(401);
      res.end(JSON.stringify({ ok: false, error: "unauthorized" }));
      return;
    }

    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      res.writeHead(400);
      res.end(JSON.stringify({ ok: false, error: "invalid_json" }));
      return;
    }

    const { external_id, name, handle, event_id, category, amount } = body;
    const validCategories = ["saldo", "publicacoes", "colecoes", "gorjetas", "seguidor"];
    if (typeof external_id !== "string" || !external_id) {
      res.writeHead(400);
      res.end(JSON.stringify({ ok: false, error: "external_id é obrigatório" }));
      return;
    }
    if (!validCategories.includes(category)) {
      res.writeHead(400);
      res.end(JSON.stringify({ ok: false, error: `category deve ser um de: ${validCategories.join(", ")}` }));
      return;
    }
    if (typeof amount !== "number" || !Number.isFinite(amount)) {
      res.writeHead(400);
      res.end(JSON.stringify({ ok: false, error: "amount deve ser numérico" }));
      return;
    }

    let account = getAccountByExternalId.get(external_id);
    if (!account) {
      insertAccount.run(external_id, name || external_id, handle || `@${external_id}`);
      account = getAccountByExternalId.get(external_id);
    }

    const amountCentavos = category === "seguidor" ? amount : Math.round(amount * 100);
    const eventResult = insertEvent.run(
      account.id,
      event_id ?? null,
      category,
      amountCentavos,
      JSON.stringify(body),
    );

    // event_id repetido (já processado antes) -> não aplica o delta de novo
    const isDuplicate = event_id != null && eventResult.changes === 0;
    if (!isDuplicate) {
      if (category === "seguidor") {
        bumpSeguidores.run(amountCentavos, account.id);
      } else if (category === "saldo") {
        bumpSaldo.run(amountCentavos, account.id);
      } else {
        bumpCategoria[category].run(amountCentavos, account.id);
        bumpSaldo.run(amountCentavos, account.id);
        bumpMes.run(amountCentavos, account.id);
      }
    }

    const updated = getAccountByExternalId.get(external_id);
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, duplicate: isDuplicate, account: toPublicAccount(updated) }));
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/auction/current") {
    const row = getLatestAuction.get();
    if (!row) {
      res.writeHead(404);
      res.end(JSON.stringify({ ok: false, error: "nenhum leilão ainda" }));
      return;
    }
    res.writeHead(200);
    res.end(JSON.stringify(toPublicAuction(row)));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/webhooks/auction") {
    const providedSecret = req.headers["x-webhook-secret"];
    if (typeof providedSecret !== "string" || !timingSafeEqual(providedSecret, AUCTION_WEBHOOK_SECRET)) {
      res.writeHead(401);
      res.end(JSON.stringify({ ok: false, error: "unauthorized" }));
      return;
    }

    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      res.writeHead(400);
      res.end(JSON.stringify({ ok: false, error: "invalid_json" }));
      return;
    }

    const { type, external_id, event_id } = body;
    const validTypes = ["start", "bid", "end"];
    if (typeof external_id !== "string" || !external_id) {
      res.writeHead(400);
      res.end(JSON.stringify({ ok: false, error: "external_id é obrigatório" }));
      return;
    }
    if (!validTypes.includes(type)) {
      res.writeHead(400);
      res.end(JSON.stringify({ ok: false, error: `type deve ser um de: ${validTypes.join(", ")}` }));
      return;
    }

    if (type === "start") {
      const { ends_at } = body;
      if (typeof ends_at !== "string" || Number.isNaN(Date.parse(ends_at))) {
        res.writeHead(400);
        res.end(JSON.stringify({ ok: false, error: "ends_at deve ser uma data ISO válida" }));
        return;
      }
      let auction = getAuctionByExternalId.get(external_id);
      if (!auction) {
        insertAuction.run(external_id, ends_at);
      } else {
        updateAuctionEndsAt.run(ends_at, auction.id);
      }
      const saved = getAuctionByExternalId.get(external_id);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, auction: toPublicAuction(saved) }));
      return;
    }

    // "bid" e "end" precisam de um leilão já existente
    const auction = getAuctionByExternalId.get(external_id);
    if (!auction) {
      res.writeHead(404);
      res.end(JSON.stringify({ ok: false, error: `leilão "${external_id}" não encontrado — mande um evento "start" primeiro` }));
      return;
    }

    if (type === "bid") {
      const { bidder_name, bidder_flag, amount } = body;
      if (typeof bidder_name !== "string" || !bidder_name) {
        res.writeHead(400);
        res.end(JSON.stringify({ ok: false, error: "bidder_name é obrigatório" }));
        return;
      }
      if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
        res.writeHead(400);
        res.end(JSON.stringify({ ok: false, error: "amount deve ser numérico e maior que zero" }));
        return;
      }
      insertBid.run(auction.id, event_id ?? null, bidder_name, bidder_flag ?? null, Math.round(amount * 100));
      const saved = getAuctionByExternalId.get(external_id);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, auction: toPublicAuction(saved) }));
      return;
    }

    if (type === "end") {
      const { winner_name, winner_amount } = body;
      const winnerAmountCentavos =
        typeof winner_amount === "number" && Number.isFinite(winner_amount) ? Math.round(winner_amount * 100) : null;
      endAuction.run(winner_name ?? null, winnerAmountCentavos, auction.id);
      const saved = getAuctionByExternalId.get(external_id);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, auction: toPublicAuction(saved) }));
      return;
    }
  }

  res.writeHead(404);
  res.end(JSON.stringify({ ok: false, error: "not_found" }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[privefeet-webhook] ouvindo em http://127.0.0.1:${PORT}`);
});
