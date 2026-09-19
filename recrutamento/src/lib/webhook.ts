import {
  WEBHOOK_URL,
  WEBHOOK_TOKEN,
  NOME_DA_ORIGEM,
  ENVIAR_FOTO_NO_WEBHOOK,
  LIMITE_FOTO_WEBHOOK_MB,
  TEMPO_LIMITE_WEBHOOK_SEG,
} from "@/content/config";

export type RespostaItem = {
  /** Código fixo da pergunta — não muda quando os textos são editados */
  perguntaId?: string;
  pergunta: string;
  /** Código fixo da opção escolhida — não muda quando os textos são editados */
  respostaId?: string;
  resposta: string;
};

export type RespostasFunil = {
  nome: string;
  respostas: RespostaItem[];
  dataNascimento: string;
  idade: number;
  /** Texto atual da identificação (o que está escrito na tela) */
  genero: string;
  /** Código fixo da identificação ("feminino"/"masculino") */
  generoId?: string;
  /** WhatsApp da pessoa formatado, ex.: "(11) 98888-7777" */
  whatsapp?: string;
  /** WhatsApp da pessoa — só os números, ex.: "11988887777" */
  whatsappId?: string;
  iniciadoEm: string;
  duracaoSegundos: number;
  foto?: File;
};

function fileParaBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Lê os parâmetros de campanha (utm_source, utm_medium...) da URL atual. */
function lerParametros() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const todos: Record<string, string> = {};
  params.forEach((value, key) => {
    todos[key] = value;
  });
  return {
    todos,
    utm_source: params.get("utm_source") ?? "",
    utm_medium: params.get("utm_medium") ?? "",
    utm_campaign: params.get("utm_campaign") ?? "",
    utm_content: params.get("utm_content") ?? "",
    utm_term: params.get("utm_term") ?? "",
    fbclid: params.get("fbclid") ?? "",
    gclid: params.get("gclid") ?? "",
  };
}

/** Monta o pacote de dados (JSON) que será enviado ao outro site. */
export async function montarPayload(dados: RespostasFunil) {
  const parametros = lerParametros();

  const payload: Record<string, unknown> = {
    // identificação do envio
    id: crypto.randomUUID(),
    origem: NOME_DA_ORIGEM,
    origemUrl: typeof window !== "undefined" ? window.location.href : "",
    referencia: typeof document !== "undefined" ? document.referrer : "",
    enviadoEm: new Date().toISOString(),

    // dados da pessoa
    nome: dados.nome,
    dataNascimento: dados.dataNascimento,
    idade: dados.idade,
    genero: dados.genero,
    generoId: dados.generoId ?? "",
    whatsapp: dados.whatsapp ?? "",
    whatsappId: dados.whatsappId ?? "",

    // respostas — lista completa com pergunta e resposta
    respostas: dados.respostas,
    // mesmas respostas em campos simples (resposta1, resposta2...) para
    // ferramentas que não leem listas
    ...Object.fromEntries(dados.respostas.map((item, i) => [`resposta${i + 1}`, item.resposta])),
    ...Object.fromEntries(dados.respostas.map((item, i) => [`pergunta${i + 1}`, item.pergunta])),
    // códigos fixos — use estes no outro site para não depender dos textos
    ...Object.fromEntries(dados.respostas.map((item, i) => [`pergunta${i + 1}Id`, item.perguntaId ?? ""])),
    ...Object.fromEntries(dados.respostas.map((item, i) => [`resposta${i + 1}Id`, item.respostaId ?? ""])),

    // foto
    foto: dados.foto
      ? { nome: dados.foto.name, tipo: dados.foto.type, tamanhoBytes: dados.foto.size }
      : null,

    // campanha e dispositivo
    campanha: parametros,
    dispositivo:
      typeof navigator !== "undefined"
        ? {
            userAgent: navigator.userAgent,
            idioma: navigator.language,
            tela: typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : "",
            fusoHorario: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }
        : null,

    // tempo de preenchimento
    iniciadoEm: dados.iniciadoEm,
    duracaoSegundos: dados.duracaoSegundos,
  };

  if (
    ENVIAR_FOTO_NO_WEBHOOK &&
    dados.foto &&
    dados.foto.size <= LIMITE_FOTO_WEBHOOK_MB * 1024 * 1024
  ) {
    try {
      payload["fotoBase64"] = await fileParaBase64(dados.foto);
    } catch {
      /* segue sem a foto */
    }
  }

  return payload;
}

/** Envia as respostas para o webhook configurado em src/content/config.ts */
export async function enviarWebhook(dados: RespostasFunil) {
  if (!WEBHOOK_URL) return { enviado: false, motivo: "webhook desativado" as const };

  const payload = await montarPayload(dados);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (WEBHOOK_TOKEN) headers["X-Webhook-Token"] = WEBHOOK_TOKEN;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), TEMPO_LIMITE_WEBHOOK_SEG * 1000);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
      keepalive: true,
    });
    // Se o outro site já cria a conta na hora e manda de volta um link de
    // acesso (claimUrl), guardamos aqui — quem chamou decide se usa esse
    // link em vez do redirecionamento fixo de config.ts.
    let claimUrl: string | undefined;
    try {
      const data = await response.clone().json();
      if (data && typeof data.claimUrl === "string") claimUrl = data.claimUrl;
    } catch {
      // resposta não era JSON (ou não tinha claimUrl) — segue sem ela
    }
    return { enviado: response.ok, status: response.status, claimUrl };
  } catch (error) {
    console.error("Falha ao enviar webhook", error);
    return { enviado: false, motivo: "erro de rede" as const };
  } finally {
    window.clearTimeout(timeout);
  }
}
