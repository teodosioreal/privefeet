// =====================================================================
// CONFIGURAÇÕES GERAIS — edite apenas os valores entre aspas
//
// Tudo aqui pode ser alterado depois de baixar o site e subir na
// hospedagem (Hostinger): abra este arquivo, troque o texto entre aspas,
// salve e envie novamente. Nada mais precisa ser mexido.
// =====================================================================

/** Para onde a pessoa é enviada no fim (site da empresa, plataforma, WhatsApp, etc.).
 *  Cole aqui o link entre as aspas — depois é só trocar por qualquer outro. */
export const REDIRECT_URL =
  import.meta.env["VITE_REDIRECT_URL"] ??
  "https://wa.me/5511999999999?text=Ol%C3%A1%2C%20conclu%C3%AD%20minha%20avalia%C3%A7%C3%A3o.";

/** Endereço do webhook que recebe as respostas (Zapier, Make, n8n, seu servidor...).
 *  Cole aqui o link entre as aspas. Deixe "" para desativar o envio.
 *  Exemplo: "https://hook.eu2.make.com/abc123" */
export const WEBHOOK_URL = import.meta.env["VITE_WEBHOOK_URL"] ?? "";

/** Senha/token opcional enviada junto no cabeçalho "X-Webhook-Token".
 *  Serve para o outro site conferir que o envio veio mesmo daqui.
 *  Deixe "" se não quiser usar. */
export const WEBHOOK_TOKEN = import.meta.env["VITE_WEBHOOK_TOKEN"] ?? "";

/** Nome do site/origem que vai junto em cada envio (ajuda a separar campanhas). */
export const NOME_DA_ORIGEM = "Avaliação privada";

/** true = envia também a foto (em base64) dentro do webhook.
 *  false = envia só o nome do arquivo e o tamanho. */
export const ENVIAR_FOTO_NO_WEBHOOK = true;

/** Tamanho máximo da foto enviada no webhook (em MB). Acima disso, a foto não vai. */
export const LIMITE_FOTO_WEBHOOK_MB = 5;

/** Quantos segundos esperar o webhook responder antes de seguir para o WhatsApp.
 *  Uma foto de até 5MB (limite acima) pode demorar bem mais que isso numa
 *  conexão de celular mais lenta — se o tempo for curto demais aqui, o envio
 *  é cancelado no meio e ela cai no WhatsApp mesmo com o servidor no ar. */
export const TEMPO_LIMITE_WEBHOOK_SEG = 25;

/** Links dos documentos legais. Deixe "" para exibir apenas o texto, sem link. */
export const LINK_TERMOS = "";
export const LINK_PRIVACIDADE = "";

/** Tempo (ms) da animação de "processando" entre as etapas. */
export const TEMPO_TRANSICAO_MS = 1050;

/** Tempo (ms) da tela final antes do redirecionamento automático. */
export const TEMPO_REDIRECIONAMENTO_MS = 2000;
