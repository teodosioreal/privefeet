// ============================================================
//  LISTA DE IMAGENS DO FEED
// ============================================================
// Para adicionar uma imagem nova:
//   1. Coloque o arquivo na pasta  public/images/  (ex.: post-9.jpg)
//   2. Adicione uma linha aqui com o caminho e a proporção real dela
//      (ratio = largura / altura da imagem original — isso evita que a
//      foto seja cortada no feed e evita "pulo" de layout no celular
//      enquanto ela carrega).
//
// Para trocar uma foto existente sem mexer em nada:
//   basta substituir o arquivo na pasta public/images/ mantendo o mesmo nome
//   E o mesmo enquadramento (senão atualize o ratio também).
//
// As fotos são usadas em ordem e repetem quando a lista acaba.

export type FeedImage = { src: string; ratio: number };

export const feedImages: FeedImage[] = [
  { src: "/images/post-1.jpg", ratio: 0.7503 },
  { src: "/images/post-2.jpg", ratio: 0.7688 },
  { src: "/images/post-3.jpg", ratio: 0.8 },
  { src: "/images/post-4.jpg", ratio: 0.5627 },
  { src: "/images/post-5.jpg", ratio: 0.5625 },
  { src: "/images/post-6.jpg", ratio: 0.6175 },
  { src: "/images/post-7.jpg", ratio: 0.7503 },
  { src: "/images/post-8.jpg", ratio: 0.5627 },
  { src: "/images/post-9.jpg", ratio: 0.5627 },
  { src: "/images/post-10.jpg", ratio: 0.5627 },
  { src: "/images/post-11.jpg", ratio: 0.809 },
  { src: "/images/post-12.jpg", ratio: 0.8 },
  { src: "/images/post-13.jpg", ratio: 0.7502 },
  { src: "/images/post-14.jpg", ratio: 0.7502 },
  { src: "/images/post-15.jpg", ratio: 0.7547 },
  { src: "/images/post-16.jpg", ratio: 0.754 },
  { src: "/images/post-17.jpg", ratio: 0.5784 },
  { src: "/images/post-18.jpg", ratio: 0.563 },
  { src: "/images/post-19.jpg", ratio: 0.5736 },
  { src: "/images/post-20.jpg", ratio: 0.7502 },
  { src: "/images/post-21.jpg", ratio: 0.5625 },
  { src: "/images/post-22.jpg", ratio: 0.5928 },
  { src: "/images/post-23.jpg", ratio: 0.462 },
  { src: "/images/post-24.jpg", ratio: 0.7502 },
];

// ============================================================
//  FOTOS DE PERFIL (avatares redondos de cada criador no feed)
// ============================================================
// Mesma lógica: coloque o arquivo em public/images/avatars/ e adicione aqui.
export const avatarImages: string[] = [
  "/images/avatars/avatar-1.jpg",
  "/images/avatars/avatar-2.jpg",
  "/images/avatars/avatar-3.jpg",
  "/images/avatars/avatar-4.jpg",
  "/images/avatars/avatar-5.jpg",
  "/images/avatars/avatar-6.jpg",
  "/images/avatars/avatar-7.jpg",
  "/images/avatars/avatar-8.jpg",
  "/images/avatars/avatar-9.jpg",
  "/images/avatars/avatar-10.jpg",
  "/images/avatars/avatar-11.jpg",
  "/images/avatars/avatar-12.jpg",
  "/images/avatars/avatar-13.jpg",
  "/images/avatars/avatar-14.jpg",
  "/images/avatars/avatar-15.jpg",
  "/images/avatars/avatar-16.jpg",
  "/images/avatars/avatar-18.jpg",
  "/images/avatars/avatar-19.jpg",
  "/images/avatars/avatar-20.jpg",
];
