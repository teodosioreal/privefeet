// =====================================================================
// PERGUNTAS FREQUENTES (FAQ) — editável por aqui, sem tocar no resto.
//
// COMO EDITAR:
//   • Para mudar uma pergunta ou resposta: troque o texto entre aspas.
//   • Para adicionar uma nova pergunta: copie um bloco inteiro
//     { pergunta: "...", resposta: "..." }, cole na lista e troque o texto.
//     (atenção: coloque uma vírgula entre um bloco e outro)
//   • Para remover uma pergunta: apague o bloco inteiro dela.
//
// Você pode deixar a lista vazia ([]) se quiser esconder o FAQ inteiro.
// =====================================================================

export const FAQ = {
  /** Título da seção (deixe "" para esconder só o título) */
  titulo: "Perguntas frequentes",

  /** Subtítulo opcional que aparece abaixo do título (deixe "" para esconder) */
  subtitulo: "Tudo o que você precisa saber antes de começar.",

  /** Lista de perguntas — a primeira já vem aberta */
  itens: [
    {
      pergunta: "Minha foto fica privada?",
      resposta:
        "Na vitrine, possíveis compradores veem somente a prévia levemente embaçada — o suficiente para despertar interesse sem revelar tudo. Nada é exibido publicamente sem sua foto passar pela curadoria.",
    },
    {
      pergunta: "Quanto tempo leva a avaliação?",
      resposta:
        "Menos de um minuto. São poucas perguntas rápidas e você responde direto do celular.",
    },
    {
      pergunta: "Quem vê as minhas respostas?",
      resposta:
        "Somente o Sistema de filtro Automático do nosso site.",
    },
    {
      pergunta: "Preciso ter quantos anos?",
      resposta:
        "A avaliação é exclusiva para maiores de 18 anos.",
    },
    {
      pergunta: "Em quanto tempo eu recebo?",
      resposta:
        "As transações são exclusivas por PIX, em até 20 minutos após vencer o leilão.",
    },
    {
      pergunta: "Como funciona para vender foto do pé para gringos?",
      resposta:
        "A maior parte dos compradores está no exterior. Eles dão lances na sua prévia embaçada e você recebe em reais, por PIX — sem precisar falar outro idioma nem aparecer.",
    },
  ],
} as const;
