// =====================================================================
// TODOS OS TEXTOS DO SITE — troque livremente o que está entre aspas.
// Nada aqui quebra o site: são apenas palavras.
// =====================================================================

export const TEXTOS = {
  /** ATENÇÃO: os textos que aparecem no GOOGLE agora ficam em
   *  src/content/seo.ts (título, descrição, palavras-chave e o bloco de
   *  conteúdo do rodapé). Edite lá. */

  /** PRIMEIRA PÁGINA (etapa inicial) */
  inicio: {
    titulo: "Avaliação privada",
    subtitulo: "Certos traços despertam desejos",
    rotuloNome: "Nome completo",
    placeholderNome: "Digite seu nome",
    rotuloFoto: "Foto dos pés",
    chamadaUpload: "Toque para enviar ou tirar na hora",
    ajudaUpload: "JPG ou PNG · até 10 MB · envie da galeria ou fotografe agora",
    avisoFoto: "Envie uma foto real e sua — não vale imagem gerada por IA ou baixada da internet.",
    trocarFoto: "Trocar foto",
    botaoContinuar: "Continuar",
    avisoLegal: {
      antes: "Ao continuar, você concorda com os ",
      termos: "Termos de Uso",
      entre: " e a ",
      privacidade: "Política de Privacidade",
      depois: ".",
    },
  },

  /** PERGUNTAS (5 no total). Pode trocar títulos, apoios e os textos das opções.
   *  IMPORTANTE: o campo `id` é o código fixo que o webhook envia para o outro
   *  site. NÃO mude os ids — troque apenas os textos entre aspas. Assim o
   *  webhook continua funcionando mesmo se você reescrever todas as palavras. */
  perguntas: [
    {
      id: "tatuagem",
      titulo: "Você tem alguma tatuagem nos pés?",
      apoio: "Compradores valorizam exclusividade visual.",
      opcoes: [
        { id: "sem_tatuagem", texto: "Não tenho" },
        { id: "tatuagem_pequena", texto: "Tenho uma pequena" },
        { id: "varias_tatuagens", texto: "Tenho várias" },
        { id: "tatuagem_escondida", texto: "Tenho, mas escondidas" },
      ],
    },
    {
      id: "unhas",
      titulo: "Costuma pintar as unhas dos pés?",
      apoio: "Cores chamativas aumentam o lance médio.",
      opcoes: [
        { id: "nunca_pinta", texto: "Nunca" },
        { id: "as_vezes", texto: "Às vezes" },
        { id: "sempre", texto: "Sempre" },
        { id: "pedicure_profissional", texto: "Faço pedicure profissional" },
      ],
    },
    {
      id: "formato",
      titulo: "Qual o formato dos seus dedos?",
      apoio: "Cada formato tem demanda em diferentes regiões.",
      opcoes: [
        { id: "egipcio", texto: "Egípcio (decrescente)" },
        { id: "grego", texto: "Grego (segundo dedo maior)" },
        { id: "romano", texto: "Romano (3 primeiros iguais)" },
        { id: "nao_sei", texto: "Não sei" },
      ],
    },
    {
      id: "tamanho",
      titulo: "Qual o tamanho do seu pé?",
      apoio: "Tamanhos pequenos são mais valorizados em Dubai.",
      opcoes: [
        { id: "tam_33_35", texto: "33–35" },
        { id: "tam_36_37", texto: "36–37" },
        { id: "tam_38_39", texto: "38–39" },
        { id: "tam_40_mais", texto: "40+" },
      ],
    },
    {
      id: "cuidados",
      titulo: "Como são seus cuidados com os pés?",
      apoio: "Quanto mais cuidados, maior a raridade.",
      opcoes: [
        { id: "nenhum_cuidado", texto: "Nenhum especial" },
        { id: "hidratacao_semanal", texto: "Hidratação semanal" },
        { id: "pedicure_mensal", texto: "Pedicure mensal" },
        { id: "spa_diario", texto: "Spa, esfoliação e hidratação diária" },
      ],
    },
  ],

  /** Rótulo acima de cada pergunta: "Pergunta 2 de 5" */
  rotuloPergunta: (atual: number, total: number) => `Pergunta ${atual} de ${total}`,

  /** ETAPA DA DATA DE NASCIMENTO */
  nascimento: {
    etiqueta: "Perfil · 1 de 3",
    titulo: "Quase lá — sua data de nascimento",
    apoio: "Apenas maiores de 18 anos podem vender.",
    rotuloCampo: "Data de nascimento",
    placeholder: "DD/MM/AAAA",
    bloqueioMenorIdade: "Esta avaliação está disponível somente para maiores de 18 anos.",
    botaoContinuar: "Continuar",
  },

  /** ETAPA DE IDENTIFICAÇÃO — ids fixos ("feminino"/"masculino") vão no webhook. */
  genero: {
    etiqueta: "Perfil · 2 de 3",
    titulo: "Como você se identifica?",
    apoio: "Essa informação ajuda a personalizar sua experiência.",
    opcoes: [
      { id: "feminino", texto: "Feminino" },
      { id: "masculino", texto: "Masculino" },
    ],
  },

  /** ETAPA DO TELEFONE — o número digitado vai para o webhook
   *  (telefoneId = 55 + DDD + número, só dígitos). Pode trocar os textos livremente. */
  whatsapp: {
    etiqueta: "Perfil · 3 de 3",
    titulo: "Para onde enviamos sua confirmação?",
    apoio: "Digite seu telefone com DDD. É por lá que você recebe a confirmação dos seus dados.",
    ddi: "55",
    rotuloCampo: "Seu telefone com DDD",
    placeholder: "(11) 98888-7777",
    avisoUnico: "Aceitamos apenas um número de telefone por cadastro.",
    avisoNumeroInvalido: "Digite um número válido com DDD — exemplo: (11) 98888-7777.",
    botaoContinuar: "Continuar",
  },

  /** TELA FINAL — sem botão: redireciona automaticamente para REDIRECT_URL
   *  (configurado em src/content/config.ts) após o tempo de redirecionamento. */
  final: {
    titulo: "Tudo pronto!",
    apoio: "Estamos redirecionando você para a plataforma. Um instante...",
  },

  /** Frases do "processando" entre as etapas */
  transicoes: {
    inicio: "Iniciando sua avaliação...",
    perguntas: "Analisando suas respostas...",
    nascimento: "Validando seus dados...",
    genero: "Finalizando seu perfil...",
    whatsapp: "Confirmando seu número...",
  },

  /** Botões e textos que aparecem em várias telas */
  comuns: {
    voltar: "Voltar",
    logoAlt: "Logo do salão",
    previaFoto: "Prévia da foto selecionada",
    /** Contador no topo das etapas: "3 / 9" */
    contador: (atual: number, total: number) => `${atual} / ${total}`,
  },

  /** RODAPÉ */
  rodape: {
    seguranca: "Conexão criptografada",
    termos: "Termos de Uso",
    privacidade: "Política de Privacidade",
  },
} as const;
