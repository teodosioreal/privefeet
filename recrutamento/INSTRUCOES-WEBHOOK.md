# Guia final — textos, link final e webhook

## 1. Onde fica cada coisa

| O que você quer mudar | Arquivo |
|---|---|
| Textos das telas, perguntas e opções | `src/content/textos.ts` |
| Perguntas frequentes | `src/content/faq.ts` |
| Textos que aparecem no Google (título, descrição, palavras-chave) | `src/content/seo.ts` |
| Link final, webhook, tempos, links dos Termos | `src/content/config.ts` |

Regra de ouro: troque somente o que está **entre aspas**. Nunca apague os campos
`id:` — são os códigos fixos que o webhook usa.

Depois de editar, gere o site de novo (`npm install` na 1ª vez, depois `npm run build`)
e suba o conteúdo da pasta `dist` para a hospedagem. Ou edite aqui e clique em Publicar.

## 2. Link para onde a pessoa vai no final

Em `src/content/config.ts`:

```ts
export const REDIRECT_URL = "https://seusite.com/plataforma";
```

## 3. Ligar o webhook

Em `src/content/config.ts`:

```ts
export const WEBHOOK_URL = "https://seu-endereco-que-recebe";  // "" desativa
export const WEBHOOK_TOKEN = "uma-senha-sua";                   // opcional
```

O envio é um **POST** com corpo **JSON**, cabeçalhos:
- `Content-Type: application/json`
- `X-Webhook-Token: <o token, se você preencheu>`

Como gerar um endereço pronto:
- **Make**: cenário novo → módulo *Webhooks → Custom webhook* → copie a URL.
- **Zapier**: *Catch Hook* → copie a URL.
- **n8n**: nó *Webhook* (método POST) → copie a URL de produção.
- **Site próprio**: um arquivo PHP como o exemplo do item 6.

Importante: o envio sai do navegador da cliente, então o endereço que recebe
precisa liberar CORS (ver exemplo). Make, Zapier e n8n já liberam.

## 4. O que é enviado (exemplo real)

```json
{
  "id": "9f0c...-uuid",
  "origem": "Avaliação privada",
  "origemUrl": "https://seusite.com/?utm_source=facebook",
  "referencia": "https://www.instagram.com/",
  "enviadoEm": "2026-09-19T16:30:00.000Z",

  "nome": "Maria Silva",
  "dataNascimento": "1998-04-10",
  "idade": 28,
  "genero": "Feminino",
  "generoId": "feminino",
  "whatsapp": "(11) 98888-7777",
  "whatsappId": "11988887777",

  "respostas": [
    { "perguntaId": "tatuagem", "pergunta": "Você tem alguma tatuagem nos pés?",
      "respostaId": "sem_tatuagem", "resposta": "❌ Não tenho" }
  ],
  "pergunta1": "Você tem alguma tatuagem nos pés?",
  "pergunta1Id": "tatuagem",
  "resposta1": "❌ Não tenho",
  "resposta1Id": "sem_tatuagem",
  "...": "o mesmo para 2, 3, 4 e 5",

  "foto": { "nome": "foto.jpg", "tipo": "image/jpeg", "tamanhoBytes": 812344 },
  "fotoBase64": "data:image/jpeg;base64,....",

  "campanha": { "utm_source": "facebook", "utm_medium": "", "fbclid": "", "gclid": "" },
  "dispositivo": { "userAgent": "...", "idioma": "pt-BR", "tela": "390x844", "fusoHorario": "America/Sao_Paulo" },
  "iniciadoEm": "2026-09-19T16:28:30.000Z",
  "duracaoSegundos": 78
}
```

## 5. Códigos fixos (o que garante que nada quebra)

No outro site, leia sempre os campos terminados em `Id`:

| Pergunta | `perguntaId` | Opções (`respostaId`) |
|---|---|---|
| Tatuagem | `tatuagem` | `sem_tatuagem`, `tatuagem_pequena`, `varias_tatuagens`, `tatuagem_escondida` |
| Unhas | `unhas` | `nunca_pinta`, `as_vezes`, `sempre`, `pedicure_profissional` |
| Formato dos dedos | `formato` | `egipcio`, `grego`, `romano`, `nao_sei` |
| Tamanho do pé | `tamanho` | `tam_33_35`, `tam_36_37`, `tam_38_39`, `tam_40_mais` |
| Cuidados | `cuidados` | `nenhum_cuidado`, `hidratacao_semanal`, `pedicure_mensal`, `spa_diario` |
| Identificação | — | `generoId`: `feminino`, `masculino` |
| WhatsApp | — | `whatsapp`: formatado com +55 • `whatsappId`: 55 + DDD + número, só dígitos (use este) |

Você pode reescrever todos os textos dessas perguntas e opções: os códigos
continuam iguais e o outro site continua entendendo tudo.

## 6. Exemplo pronto para receber no seu site (PHP)

```php
<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Webhook-Token');
header('Access-Control-Allow-Methods: POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$token = $_SERVER['HTTP_X_WEBHOOK_TOKEN'] ?? '';
if ($token !== 'uma-senha-sua') { http_response_code(401); exit('token inválido'); }

$dados = json_decode(file_get_contents('php://input'), true);

// salvar a foto, se veio
if (!empty($dados['fotoBase64'])) {
  [$cabecalho, $conteudo] = explode(',', $dados['fotoBase64'], 2);
  file_put_contents(__DIR__ . '/fotos/' . $dados['id'] . '.jpg', base64_decode($conteudo));
}

// guardar o registro
file_put_contents(__DIR__ . '/leads.jsonl', json_encode($dados) . PHP_EOL, FILE_APPEND);

http_response_code(200);
echo 'ok';
```

## 7. Como testar

1. Coloque a URL do webhook em `config.ts` e publique (ou rode o site local).
2. Preencha o funil inteiro até a tela "Tudo pronto!".
3. O envio acontece nessa tela, antes do redirecionamento (espera até 8 segundos).
4. Confira no Make/Zapier/n8n ou no seu arquivo `leads.jsonl`.

Se nada chegar: confira se `WEBHOOK_URL` não está vazio, se o endereço aceita POST
e se o CORS está liberado.

## 8. Enviar os dados para o WhatsApp (opcional)

Dá sim! O webhook manda as informações em JSON, e você pode usá-las para te
avisar no WhatsApp automaticamente. As duas formas mais fáceis:

**Make (Make.com):**
1. No cenário, depois do módulo "Webhook", adicione o módulo **WhatsApp Business Cloud > Send a Message** (gratuito, usa a API oficial do WhatsApp).
2. Conecte com um token do Meta for Developers (gratuito) e no campo "Message" escreva o template, clicando nos dados recebidos, ex.:
   `Novo lead: {{nome}} | Idade: {{idade}} | Resposta 1: {{resposta1}}`
3. Ative o cenário. Cada preenchimento do funil chega uma mensagem sua no WhatsApp.

**n8n:** mesmo esquema — nó Webhook > nó **WhatsApp Business Cloud** (ou o nó
"HTTP Request" chamando a API do WhatsApp) montando o texto com os campos.

Alternativa sem API do WhatsApp: módulos de terceiros no Make/Zapier (ex.
"Twilio para WhatsApp") — pagos por mensagem.

Importante: o site continua igual. Quem configura o envio ao WhatsApp é a
ferramenta que recebe o webhook (Make/n8n/Zapier), não o site.
