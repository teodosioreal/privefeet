# PrivFeet

Implement the visual interface of the platform shown in the attached screenshot (dashboard layout):

User request: "criar um ap igual identico esse pdf que te enviei somente visual nada masi ed função por enqunto"

Design & Visual Layout Requirements:
- Faithful visual reproduction of the reference dashboard layout from the screenshot.
- Left sidebar navigation: Icons and links for navigation (Feed, Explorar, Assinaturas, Mensagens, Perfil, Configurações).
- Main feed (center column):
  - Promotional gradient banner cards (purple/pink/orange gradients with call-to-actions).
  - Post cards with creator header (avatar, display name, handle, timestamp).
  - Media container with blurred/locked teaser overlay and price badge (e.g., "R$ 19,90", "R$ 29,90", unlock button).
  - Post interaction row (likes, comments, tips, share).
  - In-feed creator ranking / "Top Criadores" widget card with avatars, ranking numbers, usernames, and metrics.
- Right sidebar widgets:
  - Wallet / Balance card with dark theme card styling (shows current balance "R$ 0,00", monthly stats, earnings breakdown, withdraw button).
- Responsive layout with polished typography, spacing, shadows, and color scheme matching the reference.
- Mock data populated across all cards to look complete and realistic. Purely visual for now as requested.

This project was originally scaffolded with [Lovable](https://lovable.dev).

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
