// Serviço independente: recebe os webhooks do "outro site" e guarda os dados
// de cada cliente (conta, carteira, histórico) em SQLite. Roda separado do
// app principal (TanStack Start) pra não depender de nada experimental ali.
//
// Endpoints:
//   GET  /api/account?external_id=X  -> retorna a conta desse cliente (sem o
//                                        parâmetro, retorna a conta padrão,
//                                        dono do site — usada como preview)
//   POST /api/webhooks/wallet        -> recebe eventos e atualiza a carteira do cliente
//
// Variáveis de ambiente:
//   PORT             (padrão 3021)
//   WEBHOOK_SECRET    obrigatório — o "outro site" precisa mandar esse valor
//                      no header X-Webhook-Secret em toda chamada ao webhook.
//   DB_PATH           (padrão ./data/privefeet.db)

import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const PORT = Number(process.env.PORT || 3021);
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const DB_PATH = process.env.DB_PATH || "./data/privefeet.db";

if (!WEBHOOK_SECRET) {
  console.error("WEBHOOK_SECRET não definido. Configure a variável de ambiente antes de iniciar.");
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

  res.writeHead(404);
  res.end(JSON.stringify({ ok: false, error: "not_found" }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[privefeet-webhook] ouvindo em http://127.0.0.1:${PORT}`);
});
