// Serviço independente: escuta o webhook de push do GitHub e atualiza o site
// sozinho (git pull -> build -> reinicia os processos no PM2).
//
// Configurar no GitHub: Settings -> Webhooks -> Add webhook
//   Payload URL:  https://privefeet.pro/_deploy
//   Content type: application/json
//   Secret:       o mesmo valor de DEPLOY_WEBHOOK_SECRET
//   Events:       só "push"
//
// Variáveis de ambiente:
//   PORT                   (padrão 3022)
//   DEPLOY_WEBHOOK_SECRET   obrigatório — precisa bater com o secret configurado no GitHub
//   REPO_DIR                (padrão /var/www/privefeet)
//   BRANCH                  (padrão main)

import { createServer } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";
import { exec } from "node:child_process";
import { appendFileSync } from "node:fs";

const PORT = Number(process.env.PORT || 3022);
const SECRET = process.env.DEPLOY_WEBHOOK_SECRET;
const REPO_DIR = process.env.REPO_DIR || "/var/www/privefeet";
const BRANCH = process.env.BRANCH || "main";
const LOG_FILE = `${REPO_DIR}/deploy.log`;

if (!SECRET) {
  console.error("DEPLOY_WEBHOOK_SECRET não definido. Configure a variável de ambiente antes de iniciar.");
  process.exit(1);
}

function log(line) {
  const entry = `[${new Date().toISOString()}] ${line}\n`;
  process.stdout.write(entry);
  try {
    appendFileSync(LOG_FILE, entry);
  } catch {
    // sem permissão de escrever o log não deve derrubar o serviço
  }
}

let deploying = false;

function runDeploy() {
  if (deploying) {
    log("Deploy já em andamento, ignorando novo push por enquanto.");
    return;
  }
  deploying = true;
  log("Iniciando deploy...");

  const cmd = [
    "git fetch origin",
    `git reset --hard origin/${BRANCH}`,
    "bun install",
    "bun run build",
    "pm2 restart privefeet",
    "pm2 restart privefeet-webhook",
  ].join(" && ");

  const bunPath = `${process.env.HOME}/.bun/bin`;
  exec(cmd, { cwd: REPO_DIR, shell: "/bin/bash", env: { ...process.env, PATH: `${bunPath}:${process.env.PATH}` } }, (error, stdout, stderr) => {
    deploying = false;
    if (error) {
      log(`Deploy FALHOU: ${error.message}`);
      if (stdout) log(`stdout: ${stdout}`);
      if (stderr) log(`stderr: ${stderr}`);
      return;
    }
    log("Deploy concluído com sucesso.");
    if (stdout) log(`stdout: ${stdout}`);
  });
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => {
      chunks.push(chunk);
      if (chunks.reduce((n, c) => n + c.length, 0) > 5_000_000) req.destroy();
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function verifySignature(rawBody, signatureHeader) {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
  const expected = "sha256=" + createHmac("sha256", SECRET).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method !== "POST" || url.pathname !== "/_deploy") {
    res.writeHead(404);
    res.end("not found");
    return;
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers["x-hub-signature-256"];

  if (!verifySignature(rawBody, Array.isArray(signature) ? signature[0] : signature)) {
    log("Webhook recebido com assinatura inválida — ignorado.");
    res.writeHead(401);
    res.end("unauthorized");
    return;
  }

  const event = req.headers["x-github-event"];
  if (event !== "push") {
    res.writeHead(200);
    res.end("ignored (not a push event)");
    return;
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    res.writeHead(400);
    res.end("invalid json");
    return;
  }

  if (payload.ref !== `refs/heads/${BRANCH}`) {
    res.writeHead(200);
    res.end(`ignored (branch ${payload.ref} != ${BRANCH})`);
    return;
  }

  res.writeHead(202);
  res.end("deploy started");
  runDeploy();
});

server.listen(PORT, "127.0.0.1", () => {
  log(`[privefeet-deploy] ouvindo em http://127.0.0.1:${PORT}`);
});
