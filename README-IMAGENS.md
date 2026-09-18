# Como trocar e adicionar fotos (Hostinger)

## Onde ficam as fotos

Todas as fotos do feed ficam na pasta **`public/images/`** com nomes simples:
`post-1.jpg`, `post-2.jpg`, … `post-8.jpg`.

## Trocar uma foto (sem mexer em código)

1. Publique o site normalmente e faça upload da pasta gerada para a Hostinger.
2. No gerenciador de arquivos da Hostinger, abra a pasta `images` dentro do site.
3. Substitua o arquivo pelo seu, **mantendo exatamente o mesmo nome** (ex.: `post-3.jpg`).
4. Pronto — a foto nova aparece na hora, sem rebuild e sem mexer no site.

## Adicionar uma foto nova

1. Coloque o arquivo novo na pasta **`public/images/`** do projeto (ex.: `post-9.jpg`).
2. Abra o arquivo **`src/config/imagens.ts`** e adicione uma linha na lista:

```ts
export const feedImages: string[] = [
  "/images/post-1.jpg",
  // ...as outras...
  "/images/post-9.jpg",   // ← nova linha
];
```

3. Publique de novo e envie a pasta atualizada para a Hostinger.

## Dica

- Use fotos `.jpg` no formato paisagem (de preferência 1200×900 ou similar).
- Os nomes devem bater exatamente, incluindo maiúsculas/minúsculas.
- Enquanto a lista não tem foto nova suficiente, as existentes se repetem no feed.
