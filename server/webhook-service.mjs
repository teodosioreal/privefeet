// Serviço independente: recebe os webhooks do "outro site" e guarda os dados
// de cada cliente (conta, carteira, histórico) em SQLite. Roda separado do
// app principal (TanStack Start) pra não depender de nada experimental ali.
//
// Endpoints:
//   GET  /api/account?external_id=X  -> retorna a conta desse cliente (sem o
//                                        parâmetro, usa a sessão de login se
//                                        houver; senão, a conta padrão do dono)
//   POST /api/webhooks/wallet        -> recebe eventos e atualiza a carteira do cliente
//   GET  /api/auction/current        -> retorna o leilão atual (status, prazo, lances)
//   POST /api/webhooks/auction       -> recebe eventos do servidor de leilão externo
//   POST /api/auth/signup            -> cria conta (email, telefone, login, senha) e já loga
//   POST /api/auth/login             -> autentica por login+senha
//   GET  /api/auth/me                -> retorna a conta da sessão atual (cookie)
//   POST /api/auth/logout            -> encerra a sessão
//   POST /api/webhooks/lead          -> recebe o formulário de recrutamento externo,
//                                        cria/atualiza a conta e devolve um link de acesso único
//   GET  /api/auth/claim?token=X     -> troca o link de uso único por uma sessão de verdade
//   GET  /api/leads/:arquivo         -> serve a foto que ela mandou no formulário (avatar do perfil)
//   POST /api/auction/start-fake     -> inicia um leilão de teste da usuária logada, com lances
//                                        simulados de ~30 compradores fictícios chegando aos poucos
//
// Variáveis de ambiente:
//   PORT                    (padrão 3021)
//   WEBHOOK_SECRET           obrigatório — o "outro site" precisa mandar esse valor
//                             no header X-Webhook-Secret em toda chamada ao webhook da carteira.
//   AUCTION_WEBHOOK_SECRET   obrigatório — segredo separado pro servidor de leilão,
//                             enviado no header X-Webhook-Secret nas chamadas a /api/webhooks/auction.
//   LEAD_WEBHOOK_SECRET      opcional — segredo pro formulário de recrutamento externo,
//                             enviado no header X-Webhook-Token nas chamadas a /api/webhooks/lead.
//                             Se não definido, esse endpoint fica desativado (503), sem derrubar o resto.
//   PUBLIC_SITE_URL          (padrão https://privefeet.pro) — usado pra montar o link de acesso único.
//   DB_PATH                  (padrão ./data/privefeet.db)

import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual as cryptoTimingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);

const PORT = Number(process.env.PORT || 3021);
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const AUCTION_WEBHOOK_SECRET = process.env.AUCTION_WEBHOOK_SECRET;
// Opcional (diferente dos dois acima): se não for definido, o endpoint do
// formulário de recrutamento só responde 503 — não derruba o resto do
// serviço (carteira/leilão continuam funcionando normalmente).
const LEAD_WEBHOOK_SECRET = process.env.LEAD_WEBHOOK_SECRET || "";
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || "https://privefeet.pro";
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

// Migração: coluna nova numa tabela que já existia antes dela (SQLite não
// deixa isso ir no CREATE TABLE IF NOT EXISTS acima, que só roda na criação).
// Guarda qual lance a criadora escolheu aceitar (fluxo de teste: ela vê os
// lances recebidos e escolhe um pra creditar na carteira dela).
const auctionColumns = db.prepare(`PRAGMA table_info(auctions)`).all();
if (!auctionColumns.some((c) => c.name === "accepted_bid_id")) {
  db.exec(`ALTER TABLE auctions ADD COLUMN accepted_bid_id INTEGER REFERENCES auction_bids(id)`);
}
// Dona do leilão (pra fluxo de teste: cada usuária inicia o próprio leilão
// fake a partir da conta dela, com lances simulados de compradores fictícios).
if (!auctionColumns.some((c) => c.name === "seller_account_id")) {
  db.exec(`ALTER TABLE auctions ADD COLUMN seller_account_id INTEGER REFERENCES accounts(id)`);
}

// Migração: campos de login (email, telefone, usuário, senha) na tabela de
// contas, que já existia antes deles.
const accountColumns = db.prepare(`PRAGMA table_info(accounts)`).all();
for (const [name, def] of [
  ["email", "TEXT"],
  ["phone", "TEXT"],
  ["username", "TEXT"],
  ["password_hash", "TEXT"],
  ["avatar_path", "TEXT"],
]) {
  if (!accountColumns.some((c) => c.name === name)) {
    db.exec(`ALTER TABLE accounts ADD COLUMN ${name} ${def}`);
  }
}
// username precisa ser único, mas só entre quem tem um (contas antigas sem
// login continuam existindo com username NULL, e SQLite permite múltiplos
// NULL num índice único).
db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username)`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lead_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    data_nascimento TEXT,
    idade INTEGER,
    genero TEXT,
    respostas_json TEXT,
    foto_path TEXT,
    origem TEXT,
    received_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Link de acesso único mandado pro formulário de recrutamento usar assim
  -- que a pessoa termina de responder — troca por uma sessão de verdade e
  -- se autodestrói (uso único, expira rápido).
  CREATE TABLE IF NOT EXISTS claim_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    used_at TEXT
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
const getAccountByUsername = db.prepare(`SELECT * FROM accounts WHERE username = ?`);
const getAccountById = db.prepare(`SELECT * FROM accounts WHERE id = ?`);
const insertUserAccount = db.prepare(`
  INSERT INTO accounts (external_id, name, handle, email, phone, username, password_hash)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const insertSession = db.prepare(`
  INSERT INTO sessions (token, account_id, expires_at) VALUES (?, ?, ?)
`);
const getSessionByToken = db.prepare(`
  SELECT sessions.*, accounts.* FROM sessions
  JOIN accounts ON accounts.id = sessions.account_id
  WHERE token = ? AND expires_at > datetime('now')
`);
const deleteSession = db.prepare(`DELETE FROM sessions WHERE token = ?`);
const getAccountByPhone = db.prepare(`SELECT * FROM accounts WHERE phone = ?`);
const insertLeadAccount = db.prepare(`
  INSERT INTO accounts (external_id, name, handle, phone) VALUES (?, ?, ?, ?)
`);
const updateLeadAccountName = db.prepare(`
  UPDATE accounts SET name = ?, updated_at = datetime('now') WHERE id = ?
`);
const updateAccountAvatar = db.prepare(`
  UPDATE accounts SET avatar_path = ?, updated_at = datetime('now') WHERE id = ?
`);
const insertLeadSubmission = db.prepare(`
  INSERT INTO lead_submissions
    (account_id, data_nascimento, idade, genero, respostas_json, foto_path, origem)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const insertClaimToken = db.prepare(`
  INSERT INTO claim_tokens (token, account_id, expires_at) VALUES (?, ?, ?)
`);
const getClaimToken = db.prepare(`
  SELECT * FROM claim_tokens WHERE token = ? AND used_at IS NULL AND expires_at > datetime('now')
`);
const markClaimTokenUsed = db.prepare(`UPDATE claim_tokens SET used_at = datetime('now') WHERE id = ?`);
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
const insertFakeAuction = db.prepare(`
  INSERT INTO auctions (external_id, status, ends_at, seller_account_id) VALUES (?, 'active', ?, ?)
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
  SELECT id, bidder_name, bidder_flag, amount_centavos FROM auction_bids
  WHERE auction_id = ? ORDER BY amount_centavos DESC LIMIT 20
`);
const getBidById = db.prepare(`SELECT * FROM auction_bids WHERE id = ? AND auction_id = ?`);
const acceptBid = db.prepare(`
  UPDATE auctions
  SET status = 'ended', accepted_bid_id = ?, winner_name = ?, winner_amount_centavos = ?, updated_at = datetime('now')
  WHERE id = ?
`);

function toPublicAuction(row) {
  if (!row) return null;
  const bids = getBidsForAuction.all(row.id).map((b) => ({
    id: b.id,
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
    acceptedBidId: row.accepted_bid_id ?? null,
    bids,
  };
}

function toPublicAccount(row) {
  return {
    externalId: row.external_id,
    name: row.name,
    handle: row.handle,
    avatar: row.avatar_path ? `/api/leads/${row.avatar_path.split("/").pop()}` : null,
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

// ===== Leilão fake (fluxo de teste) =====
// Pool de compradores fictícios — cada leilão de teste sorteia um
// subconjunto embaralhado desses 30, então nunca repete a mesma ordem.
const FAKE_BIDDERS = [
  { name: "Ahmed K.", flag: "🇦🇪" },
  { name: "Layla M.", flag: "🇦🇪" },
  { name: "James T.", flag: "🇬🇧" },
  { name: "Sophie R.", flag: "🇬🇧" },
  { name: "Marco B.", flag: "🇮🇹" },
  { name: "Giulia F.", flag: "🇮🇹" },
  { name: "Hans W.", flag: "🇩🇪" },
  { name: "Lukas M.", flag: "🇩🇪" },
  { name: "Pierre D.", flag: "🇫🇷" },
  { name: "Camille L.", flag: "🇫🇷" },
  { name: "Carlos R.", flag: "🇪🇸" },
  { name: "Elena V.", flag: "🇪🇸" },
  { name: "Ryan P.", flag: "🇺🇸" },
  { name: "Ashley K.", flag: "🇺🇸" },
  { name: "Liam O.", flag: "🇨🇦" },
  { name: "Chloe B.", flag: "🇨🇦" },
  { name: "Yuki T.", flag: "🇯🇵" },
  { name: "Haruto S.", flag: "🇯🇵" },
  { name: "Min-jun L.", flag: "🇰🇷" },
  { name: "Ji-woo K.", flag: "🇰🇷" },
  { name: "Lucas A.", flag: "🇧🇷" },
  { name: "Rafael S.", flag: "🇧🇷" },
  { name: "Diego F.", flag: "🇦🇷" },
  { name: "Valentina G.", flag: "🇦🇷" },
  { name: "Noah V.", flag: "🇳🇱" },
  { name: "Emma D.", flag: "🇳🇱" },
  { name: "Oscar L.", flag: "🇸🇪" },
  { name: "Freja N.", flag: "🇸🇪" },
  { name: "William H.", flag: "🇦🇺" },
  { name: "Olivia C.", flag: "🇦🇺" },
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Agenda de 6 a 10 lances chegando aos poucos (não tudo de uma vez), com
// valor sempre subindo, pra parecer uma disputa real. Timers em memória —
// se o processo reiniciar no meio, os lances restantes não chegam (ok pra
// um fluxo de teste).
function scheduleFakeBids(auctionRowId, durationMs) {
  const count = 6 + Math.floor(Math.random() * 5); // 6–10 lances
  const bidders = shuffleArray(FAKE_BIDDERS).slice(0, count);
  let amountCentavos = (20 + Math.floor(Math.random() * 30)) * 100; // começa em R$20–50

  bidders.forEach((bidder, i) => {
    amountCentavos += (5 + Math.floor(Math.random() * 40)) * 100; // sobe R$5–45 a cada lance
    const bidAmount = amountCentavos; // congela o valor DESSE lance — sem isso, todos os
    // timers liam a mesma variável já no valor final quando disparassem.
    // Espalha os lances nos primeiros 70% do tempo do leilão, em ordem.
    const delay = Math.round(((i + 1) / (count + 1)) * durationMs * 0.7);
    setTimeout(() => {
      try {
        insertBid.run(auctionRowId, `fake-${auctionRowId}-${i}-${randomUUID()}`, bidder.name, bidder.flag, bidAmount);
      } catch {
        // leilão pode já ter sido aceito/encerrado antes do timer disparar — ignora
      }
    }, delay);
  });
}

// ===== Login/cadastro =====
const SESSION_COOKIE = "privefeet_session";
const SESSION_DAYS = 30;

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password, stored) {
  const [salt, hex] = stored.split(":");
  if (!salt || !hex) return false;
  const derived = await scrypt(password, salt, 64);
  const expected = Buffer.from(hex, "hex");
  if (derived.length !== expected.length) return false;
  return cryptoTimingSafeEqual(derived, expected);
}

function normalizeUsername(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, "");
}

function digitsOnly(raw) {
  return String(raw || "").replace(/\D/g, "");
}

// Gera 3 alternativas livres a partir do login que ela tentou, tipo
// "lunahype12", "lunahype_47", "lunahype99" — só sugere o que não existe.
function suggestUsernames(base) {
  const suggestions = [];
  let attempts = 0;
  while (suggestions.length < 3 && attempts < 30) {
    attempts += 1;
    const n = Math.floor(Math.random() * 90) + 10; // 10–99
    const candidate = `${base}${n}`;
    if (!getAccountByUsername.get(candidate) && !suggestions.includes(candidate)) {
      suggestions.push(candidate);
    }
  }
  return suggestions;
}

function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

function setSessionCookie(res, token) {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`,
  );
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
}

async function createSessionFor(res, accountId) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  insertSession.run(token, accountId, expiresAt);
  setSessionCookie(res, token);
}

// Conta da sessão atual, se o cookie for válido — usado tanto pra
// /api/auth/me quanto como identidade "de verdade" (mais confiável que um
// external_id solto no corpo da requisição) em ações que mexem em dinheiro.
function getSessionAccount(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const row = getSessionByToken.get(token);
  return row || null;
}

const server = createServer(async (req, res) => {
  try {
    await handleRequest(req, res);
  } catch (err) {
    // Uma exceção não tratada aqui derrubava o servidor inteiro (carteira +
    // leilão + formulário juntos) por causa de UM request ruim. Agora só
    // aquele request falha com 500 — o resto continua no ar.
    console.error("Erro não tratado:", err);
    if (!res.headersSent) {
      res.writeHead(500, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: false, error: "internal_error" }));
    } else {
      res.end();
    }
  }
});

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  res.setHeader("content-type", "application/json; charset=utf-8");

  // O formulário de recrutamento roda num domínio/porta diferente e chama
  // /api/webhooks/lead direto do navegador dela — precisa de CORS liberado
  // aqui (quem realmente protege esse endpoint é o X-Webhook-Token, não a
  // origem). Os outros endpoints são chamados pelo próprio site ou
  // servidor-a-servidor, não precisam disso.
  if (url.pathname === "/api/webhooks/lead") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Webhook-Token");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
  }

  if (req.method === "GET" && url.pathname === "/api/account") {
    const requestedId = url.searchParams.get("external_id");
    // Prioridade: ?external_id= explícito (link de teste) > sessão de login
    // (cookie) > conta padrão do dono (preview quando não tem nada disso).
    const sessionAccount = requestedId ? null : getSessionAccount(req);
    const row = sessionAccount || getAccountByExternalId.get(requestedId || DEFAULT_EXTERNAL_ID);
    if (!row) {
      res.writeHead(404);
      res.end(JSON.stringify({ ok: false, error: "conta não encontrada" }));
      return;
    }
    res.writeHead(200);
    res.end(JSON.stringify(toPublicAccount(row)));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/signup") {
    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      res.writeHead(400);
      res.end(JSON.stringify({ ok: false, error: "invalid_json" }));
      return;
    }

    const email = String(body.email || "").trim().toLowerCase();
    const phone = digitsOnly(body.phone);
    const username = normalizeUsername(body.username);
    const password = String(body.password || "");

    if (!email || !email.includes("@")) {
      res.writeHead(400);
      res.end(JSON.stringify({ ok: false, error: "e-mail inválido" }));
      return;
    }
    if (phone.length < 10 || phone.length > 11) {
      res.writeHead(400);
      res.end(JSON.stringify({ ok: false, error: "telefone inválido — inclua o DDD" }));
      return;
    }
    if (username.length < 3) {
      res.writeHead(400);
      res.end(JSON.stringify({ ok: false, error: "login precisa ter pelo menos 3 caracteres" }));
      return;
    }
    if (password.length < 6) {
      res.writeHead(400);
      res.end(JSON.stringify({ ok: false, error: "senha precisa ter pelo menos 6 caracteres" }));
      return;
    }

    if (getAccountByUsername.get(username)) {
      res.writeHead(409);
      res.end(
        JSON.stringify({
          ok: false,
          error: "username_taken",
          suggestions: suggestUsernames(username),
        }),
      );
      return;
    }

    const passwordHash = await hashPassword(password);
    const info = insertUserAccount.run(
      `user_${username}_${Date.now()}`, // external_id interno, só precisa ser único
      username,
      `@${username}`,
      email,
      phone,
      username,
      passwordHash,
    );
    const account = getAccountById.get(info.lastInsertRowid);
    await createSessionFor(res, account.id);

    res.writeHead(201);
    res.end(JSON.stringify({ ok: true, account: toPublicAccount(account) }));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      res.writeHead(400);
      res.end(JSON.stringify({ ok: false, error: "invalid_json" }));
      return;
    }

    const username = normalizeUsername(body.username);
    const password = String(body.password || "");
    const account = username ? getAccountByUsername.get(username) : null;

    const genericError = () => {
      res.writeHead(401);
      res.end(JSON.stringify({ ok: false, error: "login ou senha inválidos" }));
    };

    if (!account || !account.password_hash) {
      genericError();
      return;
    }
    const valid = await verifyPassword(password, account.password_hash);
    if (!valid) {
      genericError();
      return;
    }

    await createSessionFor(res, account.id);
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, account: toPublicAccount(account) }));
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/auth/me") {
    const account = getSessionAccount(req);
    if (!account) {
      res.writeHead(401);
      res.end(JSON.stringify({ ok: false, error: "não autenticado" }));
      return;
    }
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, account: toPublicAccount(account) }));
    return;
  }

  // Serve as fotos enviadas no formulário de recrutamento (viram o avatar
  // do perfil). Só aceita nomes no formato exato que a gente mesmo gera
  // (uuid.extensão) — nada de caminho vindo da URL, pra não abrir brecha
  // de ler qualquer arquivo do servidor.
  if (req.method === "GET" && url.pathname.startsWith("/api/leads/")) {
    const filename = url.pathname.slice("/api/leads/".length);
    const safe = /^[a-f0-9-]{36}\.(jpg|jpeg|png|webp)$/i.test(filename);
    if (!safe) {
      res.writeHead(400);
      res.end(JSON.stringify({ ok: false, error: "nome de arquivo inválido" }));
      return;
    }
    const filePath = join(dirname(DB_PATH), "leads", filename);
    if (!existsSync(filePath)) {
      res.writeHead(404);
      res.end(JSON.stringify({ ok: false, error: "não encontrado" }));
      return;
    }
    const ext = filename.split(".").pop().toLowerCase();
    const contentType = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" }[ext];
    res.setHeader("content-type", contentType);
    res.setHeader("cache-control", "public, max-age=86400");
    res.writeHead(200);
    res.end(readFileSync(filePath));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/logout") {
    const token = parseCookies(req)[SESSION_COOKIE];
    if (token) deleteSession.run(token);
    clearSessionCookie(res);
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // Recebe as respostas do formulário de recrutamento (funil externo) e já
  // cria/atualiza a conta dela — sem pedir e-mail/login/senha de novo. A
  // resposta traz um link de uso único que loga ela direto no painel.
  if (req.method === "POST" && url.pathname === "/api/webhooks/lead") {
    if (!LEAD_WEBHOOK_SECRET) {
      res.writeHead(503);
      res.end(JSON.stringify({ ok: false, error: "endpoint não configurado" }));
      return;
    }
    const providedToken = req.headers["x-webhook-token"];
    if (typeof providedToken !== "string" || !timingSafeEqual(providedToken, LEAD_WEBHOOK_SECRET)) {
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

    const nome = String(body.nome || "").trim();
    const whatsappId = digitsOnly(body.whatsappId || body.whatsapp);
    const idade = Number.isFinite(body.idade) ? Math.round(body.idade) : null;

    if (!nome) {
      res.writeHead(400);
      res.end(JSON.stringify({ ok: false, error: "nome é obrigatório" }));
      return;
    }
    if (whatsappId.length < 10 || whatsappId.length > 13) {
      res.writeHead(400);
      res.end(JSON.stringify({ ok: false, error: "whatsappId inválido" }));
      return;
    }
    if (idade != null && idade < 18) {
      res.writeHead(403);
      res.end(JSON.stringify({ ok: false, error: "menor de 18 anos" }));
      return;
    }

    // Mesma pessoa mandando de novo (mesmo telefone) reaproveita a conta em
    // vez de criar uma duplicada.
    let account = getAccountByPhone.get(whatsappId);
    if (!account) {
      const handleBase = normalizeUsername(nome).slice(0, 20) || `lead${whatsappId.slice(-6)}`;
      const externalId = `lead_${whatsappId}_${Date.now()}`;
      insertLeadAccount.run(externalId, nome, `@${handleBase}`, whatsappId);
      account = getAccountByPhone.get(whatsappId);
    } else {
      updateLeadAccountName.run(nome, account.id);
    }

    // Foto (opcional): decodifica o base64 e salva em disco, do lado do
    // nosso servidor — nunca fica só no navegador dela.
    let fotoPath = null;
    if (typeof body.fotoBase64 === "string" && body.fotoBase64.startsWith("data:")) {
      try {
        const match = body.fotoBase64.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          const ext = match[1].split("/")[1] || "jpg";
          const dir = join(dirname(DB_PATH), "leads");
          mkdirSync(dir, { recursive: true });
          const filename = `${randomUUID()}.${ext}`;
          writeFileSync(join(dir, filename), Buffer.from(match[2], "base64"));
          fotoPath = `leads/${filename}`;
        }
      } catch {
        // segue sem a foto — não trava o cadastro por isso
      }
    }

    insertLeadSubmission.run(
      account.id,
      body.dataNascimento || null,
      idade,
      body.generoId || body.genero || null,
      JSON.stringify(body.respostas || []),
      fotoPath,
      body.origem || null,
    );

    // A foto que ela mandou vira o avatar de verdade do perfil/carteira dela.
    if (fotoPath) {
      updateAccountAvatar.run(fotoPath, account.id);
    }

    const claimToken = randomBytes(32).toString("hex");
    const claimExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    insertClaimToken.run(claimToken, account.id, claimExpiresAt);

    res.writeHead(201);
    res.end(
      JSON.stringify({
        ok: true,
        claimUrl: `${PUBLIC_SITE_URL}/api/auth/claim?token=${claimToken}`,
      }),
    );
    return;
  }

  // Link de uso único: troca por uma sessão de verdade e manda ela pro
  // painel já logada. É pra onde o formulário de recrutamento redireciona
  // no lugar do link fixo, quando o webhook responde com sucesso.
  if (req.method === "GET" && url.pathname === "/api/auth/claim") {
    const token = url.searchParams.get("token") || "";
    const row = token ? getClaimToken.get(token) : null;
    if (!row) {
      res.writeHead(302, { Location: "/entrar" });
      res.end();
      return;
    }
    markClaimTokenUsed.run(row.id);
    await createSessionFor(res, row.account_id);
    res.writeHead(302, { Location: "/" });
    res.end();
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

  // Fluxo de teste: a usuária inicia o próprio leilão fake a partir da
  // conta dela (depois de anexar a foto no formulário), e um grupo de
  // compradores fictícios começa a dar lance sozinho.
  if (req.method === "POST" && url.pathname === "/api/auction/start-fake") {
    const account = getSessionAccount(req);
    if (!account) {
      res.writeHead(401);
      res.end(JSON.stringify({ ok: false, error: "não autenticado" }));
      return;
    }

    const existing = getLatestAuction.get();
    if (existing && existing.status === "active") {
      res.writeHead(409);
      res.end(JSON.stringify({ ok: false, error: "já tem um leilão ativo agora" }));
      return;
    }

    const durationMs = 90 * 1000; // 90s — dá tempo de ver os lances chegando
    const externalId = `fake-${account.external_id}-${Date.now()}`;
    const endsAt = new Date(Date.now() + durationMs).toISOString();
    insertFakeAuction.run(externalId, endsAt, account.id);
    const auctionRow = getAuctionByExternalId.get(externalId);

    scheduleFakeBids(auctionRow.id, durationMs);

    res.writeHead(201);
    res.end(JSON.stringify({ ok: true, auction: toPublicAuction(auctionRow) }));
    return;
  }

  // Fluxo de teste: a própria usuária escolhe, entre os lances recebidos, qual
  // aceitar — só então o valor cai na carteira dela. Chamado pelo navegador
  // dela mesma (não pelo servidor de leilão externo), por isso não exige o
  // secret do webhook, só o external_id de quem está aceitando.
  if (req.method === "POST" && url.pathname === "/api/auction/accept-bid") {
    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      res.writeHead(400);
      res.end(JSON.stringify({ ok: false, error: "invalid_json" }));
      return;
    }

    const { external_id, bid_id } = body;
    if (typeof bid_id !== "number" || !Number.isInteger(bid_id)) {
      res.writeHead(400);
      res.end(JSON.stringify({ ok: false, error: "bid_id é obrigatório" }));
      return;
    }

    // Sessão de login (cookie) é mais confiável que um external_id solto no
    // corpo — qualquer um poderia forjar esse campo. Só cai pro external_id
    // do corpo quando não tem sessão (fluxo de teste com link ?u=).
    const sessionAccount = getSessionAccount(req);
    if (!sessionAccount && (typeof external_id !== "string" || !external_id)) {
      res.writeHead(400);
      res.end(JSON.stringify({ ok: false, error: "external_id é obrigatório" }));
      return;
    }

    const auction = getLatestAuction.get();
    if (!auction) {
      res.writeHead(404);
      res.end(JSON.stringify({ ok: false, error: "nenhum leilão ainda" }));
      return;
    }
    if (auction.accepted_bid_id != null) {
      res.writeHead(409);
      res.end(JSON.stringify({ ok: false, error: "esse leilão já teve um lance aceito" }));
      return;
    }
    const bid = getBidById.get(bid_id, auction.id);
    if (!bid) {
      res.writeHead(404);
      res.end(JSON.stringify({ ok: false, error: "lance não encontrado nesse leilão" }));
      return;
    }

    let account = sessionAccount;
    if (!account) {
      account = getAccountByExternalId.get(external_id);
      if (!account) {
        insertAccount.run(external_id, external_id, `@${external_id}`);
        account = getAccountByExternalId.get(external_id);
      }
    }

    // Leilão com dona definida (fluxo do leilão fake): só ela pode aceitar.
    if (auction.seller_account_id != null && auction.seller_account_id !== account.id) {
      res.writeHead(403);
      res.end(JSON.stringify({ ok: false, error: "esse leilão não é seu" }));
      return;
    }

    acceptBid.run(bid.id, bid.bidder_name, bid.amount_centavos, auction.id);
    bumpSaldo.run(bid.amount_centavos, account.id);
    bumpMes.run(bid.amount_centavos, account.id);

    const savedAuction = getAuctionByExternalId.get(auction.external_id);
    const updatedAccount = getAccountById.get(account.id);
    res.writeHead(200);
    res.end(
      JSON.stringify({ ok: true, auction: toPublicAuction(savedAuction), account: toPublicAccount(updatedAccount) }),
    );
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ ok: false, error: "not_found" }));
}

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[privefeet-webhook] ouvindo em http://127.0.0.1:${PORT}`);
});
