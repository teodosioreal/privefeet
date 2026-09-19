import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  Bookmark,
  Camera,
  Check,
  Compass,
  Crown,
  Gift,
  Heart,
  Home,
  MessageCircle,
  MessageSquare,
  Search,
  Settings,
  Share2,
  Sparkles,
  Star,
  TrendingUp,
  User,
  Wallet,
  X,
} from "lucide-react";

import { feedImages } from "@/config/imagens";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PrivFeet — Feed de atividades dos criadores" },
      {
        name: "description",
        content:
          "Acompanhe em tempo real o que está acontecendo: novas fotos de pets, paisagens e viagens publicadas pelos criadores da plataforma.",
      },
      { property: "og:title", content: "PrivFeet — Feed de atividades dos criadores" },
      {
        property: "og:description",
        content:
          "Feed contínuo com publicações de criadores de fotografia, ranking dos mais ativos e painel de carteira.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const navItems = [
  { label: "Feed", icon: Home, active: true },
  { label: "Explorar", icon: Compass },
  { label: "Assinaturas", icon: Star },
  { label: "Mensagens", icon: MessageSquare, badge: "3" },
  { label: "Salvos", icon: Bookmark },
  { label: "Perfil", icon: User },
  { label: "Configurações", icon: Settings },
];

type Post = {
  name: string;
  handle: string;
  time: string;
  tag: string;
  text: string;
  image: string;
  price: string;
  likes: string;
  comments: string;
};

const images = feedImages;

const rawPosts: Array<Omit<Post, "image">> = [
  { name: "Lia Moreira", handle: "@liamoreira", time: "há 4 min", tag: "Pets", text: "O Pipoca na luz da manhã ☀️🐱", price: "R$ 19,90", likes: "2.418", comments: "184" },
  { name: "Rafael Costa", handle: "@rafacosta.photo", time: "há 12 min", tag: "Paisagem", text: "Amanhecer sobre o lago, 18 fotos novas.", price: "R$ 29,90", likes: "5.902", comments: "421" },
  { name: "Bianca Rezende", handle: "@biancarez", time: "há 25 min", tag: "Pets", text: "Sessão de inverno com a Nina 🧶", price: "R$ 24,90", likes: "3.117", comments: "256" },
  { name: "Estúdio Horizonte", handle: "@horizonte", time: "há 45 min", tag: "Aéreas", text: "Falésias ao pôr do sol + presets.", price: "R$ 39,90", likes: "8.340", comments: "612" },
  { name: "Nuno Aguiar", handle: "@nunoaguiar", time: "há 1 h", tag: "Arquitetura", text: "Geometria de vidro no centro da cidade.", price: "R$ 35,00", likes: "1.902", comments: "97" },
  { name: "Clara Vasques", handle: "@claravq", time: "há 1 h", tag: "Natureza", text: "Raios de sol na trilha da serra.", price: "R$ 22,50", likes: "4.221", comments: "310" },
  { name: "Pedro Lemos", handle: "@pedrolemos", time: "há 2 h", tag: "Viagem", text: "Vielas coloridas com vista pro mar.", price: "R$ 49,90", likes: "6.780", comments: "524" },
  { name: "Aline Duarte", handle: "@alineduarte", time: "há 2 h", tag: "Pets", text: "Filhote curioso no jardim 🌿", price: "R$ 18,00", likes: "9.110", comments: "703" },
  { name: "Marcos Prado", handle: "@marcosprado", time: "há 3 h", tag: "Paisagem", text: "Névoa cobrindo o vale ao nascer do sol.", price: "R$ 27,90", likes: "2.980", comments: "142" },
  { name: "Júlia Campos", handle: "@juliacampos", time: "há 4 h", tag: "Pets", text: "Retratos de estúdio com iluminação suave.", price: "R$ 31,00", likes: "3.640", comments: "221" },
  { name: "Foto Aurora", handle: "@fotoaurora", time: "há 5 h", tag: "Viagem", text: "Ensaio de fim de tarde na costa.", price: "R$ 45,00", likes: "7.412", comments: "489" },
  { name: "Diego Nunes", handle: "@diegonunes", time: "há 6 h", tag: "Arquitetura", text: "Linhas e sombras do novo museu.", price: "R$ 25,00", likes: "1.455", comments: "88" },
  { name: "Sofia Mendes", handle: "@sofiamendes", time: "há 8 h", tag: "Natureza", text: "Floresta em silêncio depois da chuva.", price: "R$ 20,00", likes: "5.130", comments: "367" },
  { name: "Caio Bertoldi", handle: "@caiobertoldi", time: "há 9 h", tag: "Pets", text: "Sessão especial: gatos e cobertores.", price: "R$ 28,90", likes: "4.008", comments: "295" },
  { name: "Renata Lisboa", handle: "@renatalisboa", time: "há 11 h", tag: "Paisagem", text: "Ondas turquesa vistas do alto.", price: "R$ 52,00", likes: "10.240", comments: "914" },
  { name: "Tiago Almeida", handle: "@tiagoalmeida", time: "há 13 h", tag: "Viagem", text: "Roteiro de 3 dias em fotos.", price: "R$ 33,50", likes: "2.211", comments: "154" },
  { name: "Helena Braga", handle: "@helenabraga", time: "há 16 h", tag: "Pets", text: "Olhar azul da Lua 🐾", price: "R$ 21,90", likes: "6.045", comments: "412" },
  { name: "Coletivo Norte", handle: "@coletivonorte", time: "há 20 h", tag: "Natureza", text: "Registro do amanhecer na montanha.", price: "R$ 37,00", likes: "3.874", comments: "268" },
];

const posts: Post[] = rawPosts.map((p, i) => ({ ...p, image: images[i % images.length]! }));

const banners = [
  {
    badge: "Em alta agora",
    title: "Veja o que está acontecendo na plataforma",
    text: "Mais de 2.400 novas publicações de criadores nas últimas 24 horas.",
    cta: "Explorar feed",
  },
  {
    badge: "Comunidade",
    title: "Novos criadores chegando todos os dias",
    text: "Fotografia de pets, paisagens, viagem e arquitetura em um só lugar.",
    cta: "Descobrir criadores",
  },
  {
    badge: "Destaques",
    title: "As publicações mais comentadas da semana",
    text: "Acompanhe os registros que movimentaram a comunidade.",
    cta: "Ver destaques",
  },
];

const topCreators = [
  { name: "Renata Lisboa", handle: "@renatalisboa", tag: "Paisagem", metric: "128k seguidores" },
  { name: "Aline Duarte", handle: "@alineduarte", tag: "Pets", metric: "96k seguidores" },
  { name: "Estúdio Horizonte", handle: "@horizonte", tag: "Aéreas", metric: "74k seguidores" },
  { name: "Pedro Lemos", handle: "@pedrolemos", tag: "Viagem", metric: "51k seguidores" },
  { name: "Clara Vasques", handle: "@claravq", tag: "Natureza", metric: "43k seguidores" },
];

// ===== Leilão (barra superior + popup de lances) =====
const AUCTION_SECONDS = 120; // duração do contador: 2 minutos

const auctionBids = [
  { flag: "🇦🇪", name: "Ahmed bin Zayed", amount: "R$ 133,71" },
  { flag: "🇸🇦", name: "Faisal bin Mohammed", amount: "R$ 124,99" },
  { flag: "🇴🇲", name: "Asaad Al-Harthy", amount: "R$ 111,32" },
  { flag: "🇸🇦", name: "Bandar Al-Qahtani", amount: "R$ 106,16" },
  { flag: "🇸🇦", name: "Abdulaziz Al-Rashid", amount: "R$ 96,46" },
];

function formatCountdown(totalSeconds: number) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

const categories = [
  { label: "Gatinhos", posts: "12.4k posts" },
  { label: "Montanhas", posts: "9.1k posts" },
  { label: "Praias", posts: "7.8k posts" },
  { label: "Arquitetura", posts: "5.5k posts" },
  { label: "Auroras", posts: "3.2k posts" },
];

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const dims = size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";
  return (
    <div
      className={`${dims} grid shrink-0 place-items-center rounded-full font-bold text-brand-foreground`}
      style={{ background: "var(--gradient-brand)" }}
    >
      {initials}
    </div>
  );
}

function Dashboard() {
  const [secondsLeft, setSecondsLeft] = useState(AUCTION_SECONDS);
  const [showBids, setShowBids] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [planCycle, setPlanCycle] = useState<"mensal" | "anual">("anual");

  useEffect(() => {
    if (secondsLeft <= 0) {
      setShowBids(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const closeBids = () => {
    setShowBids(false);
    setSecondsLeft(AUCTION_SECONDS); // recomeça a contagem de 2 minutos
  };

  const closePlan = () => setShowPlan(false);

  const feed: Array<{ key: string; node: React.ReactNode }> = [];
  let bannerIndex = 0;
  posts.forEach((post, i) => {
    feed.push({ key: post.handle, node: <PostCard post={post} priority={i === 0} /> });
    if ((i + 1) % 5 === 0 && bannerIndex < banners.length) {
      const banner = banners[bannerIndex]!;
      feed.push({ key: `banner-${bannerIndex}`, node: <PromoBanner {...banner} /> });
      bannerIndex += 1;
    }
    if (i === 2) {
      feed.push({ key: "ranking", node: <RankingCard /> });
    }
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Notificação superior — próximo leilão */}
      <div
        className="fixed inset-x-0 top-0 z-40 text-brand-foreground"
        style={{ background: "var(--gradient-brand)", boxShadow: "0 6px 24px -12px rgba(0,0,0,0.4)" }}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          <span>Próximo leilão em</span>
          <span className="rounded-lg bg-white/20 px-2 py-0.5 text-base font-extrabold tabular-nums tracking-tight">
            {formatCountdown(Math.max(secondsLeft, 0))}
          </span>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 pb-6 pt-16">
        {/* Left sidebar */}
        <aside
          className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col justify-between rounded-3xl bg-card p-5 lg:flex"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div>
            <div className="flex items-center gap-2 px-1">
              <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
                <Sparkles className="h-5 w-5 text-brand-foreground" />
              </div>
              <span className="text-lg font-extrabold tracking-tight">PrivFeet</span>
            </div>

            <nav className="mt-7 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    item.active
                      ? "bg-accent text-brand"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="min-w-0 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-brand-foreground">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <button
              className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-brand-foreground"
              style={{ background: "var(--gradient-brand)" }}
            >
              Criar publicação
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-muted p-3">
            <Avatar name="Teodosio Real" size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Teodosio Real</p>
              <p className="truncate text-xs text-muted-foreground">@teodosio</p>
            </div>
          </div>
        </aside>

        {/* Main feed */}
        <main className="min-w-0 flex-1 space-y-5">
          <header
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-card p-3 sm:flex sm:justify-between"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-muted px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                placeholder="Buscar criadores, publicações…"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground">
                <Bell className="h-5 w-5" />
              </button>
              <Avatar name="Teodosio Real" size="sm" />
            </div>
          </header>

          <button
            onClick={() => setShowPlan(true)}
            className="flex w-full items-center justify-between gap-3 rounded-3xl p-5 text-left text-brand-foreground transition-transform hover:scale-[1.01]"
            style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/20">
                <Camera className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-extrabold sm:text-lg">
                  Envie mais uma foto e entre no leilão
                </p>
                <p className="mt-0.5 truncate text-sm text-white/85">
                  Ative seu plano e concorra a lances em tempo real
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-bold text-brand">
              Participar
            </span>
          </button>

          {feed.map((item) => (
            <div key={item.key}>{item.node}</div>
          ))}
        </main>

        {/* Right sidebar */}
        <aside className="sticky top-6 hidden h-fit w-80 shrink-0 space-y-5 xl:block">
          <section className="rounded-3xl bg-foreground p-5 text-background" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 text-sm font-semibold opacity-80">
              <Wallet className="h-4 w-4" /> Carteira
            </div>
            <p className="mt-4 text-xs opacity-60">Saldo disponível</p>
            <p className="text-3xl font-extrabold tracking-tight">R$ 75,00</p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-xs opacity-60">Este mês</p>
                <p className="text-sm font-bold">R$ 1.240,00</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-xs opacity-60">Seguidores</p>
                <p className="text-sm font-bold">312</p>
              </div>
            </div>

            <ul className="mt-5 space-y-2 text-sm">
              {[
                ["Publicações", "R$ 890,00"],
                ["Coleções", "R$ 280,00"],
                ["Gorjetas", "R$ 70,00"],
              ].map(([label, value]) => (
                <li key={label} className="flex items-center justify-between">
                  <span className="opacity-60">{label}</span>
                  <span className="font-semibold">{value}</span>
                </li>
              ))}
            </ul>

            <button className="mt-5 w-full rounded-xl bg-background py-2.5 text-sm font-bold text-foreground">
              Solicitar saque
            </button>
          </section>

          <section className="rounded-3xl bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h3 className="text-base font-bold">Categorias em alta</h3>
            <ul className="mt-3 space-y-3">
              {categories.map((c) => (
                <li key={c.label} className="flex items-center justify-between">
                  <span className="text-sm font-medium">#{c.label}</span>
                  <span className="text-xs text-muted-foreground">{c.posts}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl p-5 text-brand-foreground" style={{ background: "var(--gradient-brand)" }}>
            <Gift className="h-6 w-6" />
            <h3 className="mt-3 text-base font-bold">Convide e ganhe</h3>
            <p className="mt-1 text-sm text-white/85">
              Ganhe 10% dos primeiros ganhos de cada amigo convidado.
            </p>
            <button className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-bold text-brand">Copiar convite</button>
          </section>
        </aside>
      </div>

      {/* Popup — Últimos lances do leilão */}
      {showBids && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
          onClick={closeBids}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl bg-card"
            style={{ boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between p-5 text-brand-foreground"
              style={{ background: "var(--gradient-brand)" }}
            >
              <h3 className="flex items-center gap-2 text-lg font-extrabold">
                <Crown className="h-5 w-5" /> Últimos lances
              </h3>
              <button
                onClick={closeBids}
                aria-label="Fechar"
                className="grid h-8 w-8 place-items-center rounded-xl bg-white/20 transition-colors hover:bg-white/30"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul className="divide-y divide-border">
              {auctionBids.map((bid, i) => (
                <li
                  key={bid.name}
                  className={`flex items-center gap-3 px-5 py-3.5 ${i === 0 ? "bg-accent" : ""}`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-xl">
                    {bid.flag}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{bid.name}</p>
                    {i === 0 && (
                      <p className="text-[11px] font-bold uppercase tracking-wide text-brand">
                        Lance mais alto
                      </p>
                    )}
                  </div>
                  <span className="ml-auto shrink-0 text-base font-extrabold tabular-nums tracking-tight">
                    {bid.amount}
                  </span>
                </li>
              ))}
            </ul>

            <div className="p-5 pt-3">
              <button
                onClick={closeBids}
                className="w-full rounded-xl py-3 text-sm font-bold text-brand-foreground"
                style={{ background: "var(--gradient-brand)" }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup — Escolha de plano (liberar leilões / saque) */}
      {showPlan && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
          onClick={closePlan}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl bg-card"
            style={{ boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between p-5 text-brand-foreground"
              style={{ background: "var(--gradient-brand)" }}
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/75">Antes de sacar...</p>
                <h3 className="text-lg font-extrabold">Escolha seu plano</h3>
              </div>
              <button
                onClick={closePlan}
                aria-label="Fechar"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/20 transition-colors hover:bg-white/30"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm text-muted-foreground">Ative pra liberar leilões e sacar seus ganhos.</p>

              <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
                <button
                  onClick={() => setPlanCycle("mensal")}
                  className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                    planCycle === "mensal" ? "bg-card text-foreground shadow" : "text-muted-foreground"
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setPlanCycle("anual")}
                  className={`relative rounded-lg py-2 text-sm font-semibold transition-colors ${
                    planCycle === "anual" ? "bg-card text-foreground shadow" : "text-muted-foreground"
                  }`}
                >
                  Anual
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-foreground">
                    Mais popular
                  </span>
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-border p-4">
                <p className="text-sm font-bold">{planCycle === "anual" ? "Plano Anual" : "Plano Mensal"}</p>
                <p className="text-xs text-muted-foreground">
                  {planCycle === "anual" ? "Pague 1 vez, use o ano todo" : "Renovação automática todo mês"}
                </p>
                <p className="mt-2 text-3xl font-extrabold tracking-tight">
                  {planCycle === "anual" ? "R$ 59" : "R$ 39"}
                  <span className="text-sm font-semibold text-muted-foreground">
                    {planCycle === "anual" ? "/ano" : "/mês"}
                  </span>
                </p>

                <ul className="mt-4 space-y-2 text-sm">
                  {[
                    "Saque PIX instantâneo 24h",
                    "Leilões ilimitados",
                    "Suporte prioritário 24/7",
                    ...(planCycle === "anual" ? ["Economia de R$ 409 vs mensal"] : []),
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-brand" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href="#"
                className="mt-5 block rounded-xl py-3 text-center text-sm font-bold text-brand-foreground"
                style={{ background: "var(--gradient-brand)" }}
              >
                Gerar PIX e finalizar
              </a>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                🛡️ Site protegido · Seus dados em segurança
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PromoBanner({
  badge,
  title,
  text,
  cta,
}: {
  badge: string;
  title: string;
  text: string;
  cta: string;
}) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl p-6 text-brand-foreground sm:p-8"
      style={{ background: "var(--gradient-brand)" }}
    >
      <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/15" />
      <div className="absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/10" />
      <div className="relative max-w-lg">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
          <Crown className="h-3.5 w-3.5" /> {badge}
        </span>
        <h2 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">{title}</h2>
        <p className="mt-2 text-sm text-white/85">{text}</p>
        <button className="mt-5 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand">{cta}</button>
      </div>
    </section>
  );
}

function RankingCard() {
  return (
    <section className="rounded-3xl bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h3 className="flex min-w-0 items-center gap-2 text-base font-bold">
          <TrendingUp className="h-5 w-5 shrink-0 text-brand" />
          <span className="truncate">Top Criadores</span>
        </h3>
        <button className="shrink-0 text-xs font-semibold text-brand">Ver todos</button>
      </div>
      <ul className="mt-4 divide-y divide-border">
        {topCreators.map((c, i) => (
          <li key={c.handle} className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 py-3">
            <span className="w-6 text-sm font-extrabold text-muted-foreground">#{i + 1}</span>
            <Avatar name={c.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{c.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {c.handle} · {c.tag}
              </p>
            </div>
            <span className="shrink-0 text-xs font-medium text-muted-foreground">{c.metric}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PostCard({ post, priority }: { post: Post; priority?: boolean }) {
  return (
    <article className="overflow-hidden rounded-3xl bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4">
        <Avatar name={post.name} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{post.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {post.handle} · {post.time}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-brand">{post.tag}</span>
      </div>

      <p className="px-4 pb-3 text-sm text-foreground/90">{post.text}</p>

      <div className="relative mx-4 overflow-hidden rounded-2xl">
        <img
          src={post.image}
          alt={post.text}
          loading={priority ? "eager" : "lazy"}
          width={1024}
          height={768}
          className="post-image-locked h-80 w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.visibility = "hidden";
          }}
        />
        <div className="post-image-veil pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="rounded-2xl bg-white px-6 py-3 text-xl font-extrabold tracking-tight text-black shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
            {post.price}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5 p-4 text-sm text-muted-foreground">
        <button className="flex items-center gap-1.5 hover:text-brand-pink">
          <Heart className="h-5 w-5" /> {post.likes}
        </button>
        <button className="flex items-center gap-1.5 hover:text-foreground">
          <MessageCircle className="h-5 w-5" /> {post.comments}
        </button>
        <button className="flex items-center gap-1.5 hover:text-brand-orange">
          <Gift className="h-5 w-5" /> Gorjeta
        </button>
        <button className="ml-auto flex items-center gap-1.5 hover:text-foreground">
          <Share2 className="h-5 w-5" /> Compartilhar
        </button>
      </div>
    </article>
  );
}
