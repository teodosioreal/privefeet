// =====================================================================
// SEO — TEXTOS QUE O GOOGLE LÊ (resultado orgânico)
//
// COMO EDITAR: troque somente o que está entre aspas.
// Depois de editar é preciso gerar o site de novo (npm run build) e subir
// a pasta "dist" para a hospedagem — ou clicar em Publicar aqui no projeto.
// =====================================================================

export const SEO = {
  /** Endereço oficial do site (usado no canonical, og:url e sitemap) */
  siteUrl: "https://allure-filter.lovable.app",

  /** Nome da marca (aparece no Google e ao compartilhar o link) */
  nomeDoSite: "Vitrine dos Pés",

  /** Título principal (H1) da página — fica invisível no visual, mas o Google lê como título principal */
  tituloH1: "Site para vender foto do pé",

  /** Título que aparece no Google (ideal: até ~60 caracteres) */
  titulo: "Site para Vender Foto do Pé | Vender Foto do Pé para Gringos",

  /** Descrição que aparece abaixo do título no Google (ideal: até ~155 caracteres) */
  descricao:
    "Site para vender foto do pé com segurança: envie sua foto, passe pela avaliação e venda foto do pé para gringos com pagamento em PIX em até 20 minutos.",

  /** Título e descrição ao compartilhar o link (WhatsApp, Instagram, X) */
  tituloCompartilhamento: "Vender Foto do Pé para Gringos — Avaliação Privada",
  descricaoCompartilhamento:
    "Descubra quanto compradores estão dispostos a pagar pelas suas fotos de pés. Avaliação gratuita em menos de 1 minuto.",

  /** Palavras-chave do nicho (usadas na meta keywords e nos dados estruturados) */
  palavrasChave: [
    "site para vender foto do pé",
    "vender foto do pé",
    "vender foto do pé para gringos",
    "vender fotos dos pés",
    "como vender foto do pé",
    "quanto ganha vendendo foto do pé",
    "vender foto de pé pela internet",
    "site que compra foto de pé",
    "vender foto dos pés online",
    "vender foto do pé no exterior",
    "ganhar dinheiro vendendo foto do pé",
    "plataforma para vender foto de pé",
    "vender foto de pé anonimamente",
    "leilão de foto de pé",
    "vender foto do pé com pix",
    "foot pics brasil",
    "sell feet pics",
    "vender foto do pé feminino",
    "vender foto do pé masculino",
    "comprador de foto de pé",
  ],

  /** Bloco de conteúdo que o Google lê no rodapé da página inicial.
   *  É texto real e visível (o Google pune texto escondido).
   *  Troque livremente — quanto mais natural, melhor o ranqueamento. */
  conteudo: {
    titulo: "Site para vender foto do pé — e vender foto do pé para gringos",
    paragrafos: [
      "Aqui você descobre, em menos de um minuto, quanto compradores estão dispostos a pagar pelas suas fotos de pés. É um site para vender foto do pé de forma privada: sua imagem passa por curadoria e aparece na vitrine apenas com prévia levemente embaçada.",
      "Grande parte da procura vem do exterior, por isso vender foto do pé para gringos costuma render lances mais altos. Nossa avaliação analisa formato dos dedos, tamanho, esmalte, tatuagens e cuidados — os detalhes que mais pesam no valor final.",
      "O pagamento é exclusivo por PIX, liberado em até 20 minutos após vencer o leilão. Não é preciso mostrar rosto, nome ou redes sociais: dá para vender fotos dos pés de forma anônima, direto do celular, sem taxa de cadastro.",
    ],
    /** Lista curta de tópicos (bom para o Google e para a leitora) */
    topicos: [
      "Como vender foto do pé sem aparecer",
      "Quanto ganha vendendo foto do pé no Brasil e no exterior",
      "Plataforma segura para vender foto de pé com pagamento em PIX",
      "Vender foto do pé para gringos com leilão entre compradores",
    ],
  },

  /** Perguntas e respostas usadas nos dados estruturados (rich results) */
  perguntasGoogle: [
    {
      pergunta: "Como funciona o site para vender foto do pé?",
      resposta:
        "Você envia uma foto real dos seus pés, responde cinco perguntas rápidas e recebe a avaliação. Aprovada, sua foto entra na vitrine com prévia embaçada para os compradores darem lances.",
    },
    {
      pergunta: "Dá para vender foto do pé para gringos?",
      resposta:
        "Sim. A maior parte dos compradores está no exterior, e é justamente por isso que os lances costumam ser mais altos. Você recebe em reais, por PIX.",
    },
    {
      pergunta: "Quanto tempo leva para receber?",
      resposta:
        "As transações são exclusivas por PIX, em até 20 minutos após vencer o leilão.",
    },
  ],
} as const;
