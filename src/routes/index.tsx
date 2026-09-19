import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Apple,
  Bell,
  Bookmark,
  Camera,
  Check,
  Compass,
  Crown,
  Gavel,
  Gift,
  Heart,
  Home,
  Lock,
  MessageCircle,
  MessageSquare,
  PlayCircle,
  Search,
  Settings,
  Share2,
  Smartphone,
  Sparkles,
  Star,
  TrendingUp,
  User,
  Wallet,
  X,
} from "lucide-react";

import { avatarImages, feedImages } from "@/config/imagens";

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
  { label: "Explorar", icon: Compass, locked: true },
  { label: "Assinaturas", icon: Star },
  { label: "Mensagens", icon: MessageSquare, badge: "1", locked: true },
  { label: "Salvos", icon: Bookmark, locked: true },
  { label: "Perfil", icon: User, locked: true },
  { label: "Configurações", icon: Settings, locked: true },
];

type Post = {
  name: string;
  handle: string;
  time: string;
  tag: string;
  text: string;
  image: string;
  imageRatio: number;
  avatar: string;
  price: string;
  likes: string;
  comments: string;
};

const images = feedImages;

const rawPosts: Array<Omit<Post, "image" | "avatar">> = [
  { name: "Lunahype", handle: "@lunahype", time: "há 4 min", tag: "Pets", text: "Pés de veludo", price: "R$ 38,21", likes: "2.418", comments: "184" },
  { name: "Marcellyfans", handle: "@marcellyfans", time: "há 12 min", tag: "Paisagem", text: "Velvet steps", price: "R$ 57,41", likes: "5.902", comments: "421" },
  { name: "Beladreams", handle: "@beladreams", time: "há 25 min", tag: "Pets", text: "Pasos de seda", price: "R$ 47,81", likes: "3.117", comments: "256" },
  { name: "Jujubacore", handle: "@jujubacore", time: "há 45 min", tag: "Aéreas", text: "خطى الحرير", price: "R$ 76,61", likes: "8.340", comments: "612" },
  { name: "Anacrush", handle: "@anacrush", time: "há 1 h", tag: "Arquitetura", text: "Toque suave", price: "R$ 67,20", likes: "1.902", comments: "97" },
  { name: "Melzinhaofc", handle: "@melzinhaofc", time: "há 1 h", tag: "Natureza", text: "Soft touch", price: "R$ 43,20", likes: "4.221", comments: "310" },
  { name: "Claramood", handle: "@claramood", time: "há 2 h", tag: "Viagem", text: "Encanto sutil", price: "R$ 95,81", likes: "6.780", comments: "524" },
  { name: "Vickylovers", handle: "@vickylovers", time: "há 2 h", tag: "Pets", text: "سحر خفي", price: "R$ 34,56", likes: "9.110", comments: "703" },
  { name: "Manuforever", handle: "@manuforever", time: "há 3 h", tag: "Paisagem", text: "Charme nos detalhes", price: "R$ 53,57", likes: "2.980", comments: "142" },
  { name: "Lalaflow", handle: "@lalaflow", time: "há 4 h", tag: "Pets", text: "Barefoot dreams", price: "R$ 59,52", likes: "3.640", comments: "221" },
  { name: "Dudaglow", handle: "@dudaglow", time: "há 5 h", tag: "Viagem", text: "Magia en cada paso", price: "R$ 86,40", likes: "7.412", comments: "489" },
  { name: "Giovannavibes", handle: "@giovannavibes", time: "há 6 h", tag: "Arquitetura", text: "أنوثة ناعمة", price: "R$ 48,00", likes: "1.455", comments: "88" },
  { name: "Majuverse", handle: "@majuverse", time: "há 8 h", tag: "Natureza", text: "Pés descalços, alma livre", price: "R$ 38,40", likes: "5.130", comments: "367" },
  { name: "Sofiacrush", handle: "@sofiacrush", time: "há 9 h", tag: "Pets", text: "Serene beauty", price: "R$ 55,49", likes: "4.008", comments: "295" },
  { name: "Isaacore", handle: "@isaacore", time: "há 11 h", tag: "Paisagem", text: "Belleza oculta", price: "R$ 99,84", likes: "10.240", comments: "914" },
  { name: "Biazone", handle: "@biazone", time: "há 13 h", tag: "Viagem", text: "خطوات رقيقة", price: "R$ 64,32", likes: "2.211", comments: "154" },
  { name: "Carolvibes", handle: "@carolvibes", time: "há 16 h", tag: "Pets", text: "Elegância natural", price: "R$ 42,05", likes: "6.045", comments: "412" },
  { name: "Ninahouse", handle: "@ninahouse", time: "há 20 h", tag: "Natureza", text: "Gentle stride", price: "R$ 71,04", likes: "3.874", comments: "268" },
];

const posts: Post[] = rawPosts.map((p, i) => ({
  ...p,
  image: images[i % images.length]!.src,
  imageRatio: images[i % images.length]!.ratio,
  avatar: avatarImages[i % avatarImages.length]!,
}));

// ===== Scroll infinito: novas "páginas" de posts ao chegar perto do fim =====
const FRESH_TIME_LABELS = [
  "agora mesmo", "há 1 min", "há 2 min", "há 4 min", "há 7 min", "há 9 min",
  "há 12 min", "há 15 min", "há 18 min", "há 22 min", "há 26 min", "há 31 min",
  "há 38 min", "há 44 min", "há 52 min", "há 1 h", "há 1 h 20", "há 1 h 40",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

const MAX_EXTRA_PAGES = 5; // depois disso, para de carregar e mostra o rodapé

// Continua a mesma rotação usada nos posts iniciais (images[i % length]) em
// vez de reiniciar do zero a cada lote — assim toda foto/avatar fica sempre
// a exatamente "tamanho do pool" posts de distância da última vez que
// apareceu (o máximo espaçamento possível), do início ao fim do feed. Quem
// embaralha é só a ordem de quais criadoras aparecem, não as fotos.
function buildExtraPage(pageIndex: number): Post[] {
  const startIndex = rawPosts.length * (pageIndex + 1);
  return shuffle(rawPosts).map((p, i) => ({
    ...p,
    image: images[(startIndex + i) % images.length]!.src,
    imageRatio: images[(startIndex + i) % images.length]!.ratio,
    avatar: avatarImages[(startIndex + i) % avatarImages.length]!,
    time: FRESH_TIME_LABELS[i % FRESH_TIME_LABELS.length]!,
  }));
}

const banners = [
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
  { name: "Yasminmood", handle: "@yasminmood", vendas: 62, seguidores: 420, arrecadado: "R$ 6.056,72" },
  { name: "Emilywave", handle: "@emilywave", vendas: 43, seguidores: 380, arrecadado: "R$ 5.688,82" },
  { name: "Luizafans", handle: "@luizafans", vendas: 36, seguidores: 310, arrecadado: "R$ 4.720,32" },
  { name: "Heloisacore", handle: "@heloisacore", vendas: 29, seguidores: 250, arrecadado: "R$ 3.760,05" },
  { name: "Amandaflow", handle: "@amandaflow", vendas: 22, seguidores: 190, arrecadado: "R$ 2.880,00" },
];

// ===== Leilão real (barra superior + popup de lances) =====
// Dados vêm do servidor de leilão externo via webhook (POST /api/webhooks/auction);
// aqui só buscamos o estado atual (GET /api/auction/current) periodicamente.
type AuctionBid = { id: number; name: string; flag: string; amount: number };
type Auction = {
  externalId: string;
  status: "active" | "ended";
  endsAt: string;
  winnerName: string | null;
  winnerAmount: number | null;
  acceptedBidId: number | null;
  acceptDeadline: string;
  bids: AuctionBid[];
};

const AUCTION_POLL_MS = 5000;
// Depois que um leilão termina, o próximo começa sozinho (sem clique) depois
// de um intervalo curto e aleatório — dá a sensação de "outros leilões
// continuam acontecendo" sem ficar instantâneo demais.
const AUCTION_RESTART_DELAY_MS = [4000, 11000] as const;
const FEED_REORDER_MS = 2 * 60 * 1000;

function formatCountdown(totalSeconds: number) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// Cotação de mercado BRL -> AED (Dirham dos Emirados). Atualize esse valor
// periodicamente para manter a conversão exibida no site próxima da real.
const BRL_TO_AED_RATE = 0.7176;

function parseBRL(priceLabel: string): number {
  const digits = priceLabel.replace(/[^\d,]/g, "").replace(",", ".");
  return Number(digits) || 0;
}

function formatAED(brlAmount: number): string {
  const aed = brlAmount * BRL_TO_AED_RATE;
  return aed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ===== Carteira (dados reais, atualizados por webhook) =====
type Account = {
  name: string;
  handle: string;
  avatar: string | null;
  planActive: boolean;
  // Já aceitou alguma oferta de leilão alguma vez? Enquanto não aceita
  // nenhuma, participa de quantos leilões quiser de graça — só trava depois
  // da primeira oferta aceita, pra ser justo com quem ainda não fechou nada.
  hasAcceptedBid: boolean;
  saldo: number;
  esteMes: number;
  seguidores: number;
  publicacoes: number;
  colecoes: number;
  gorjetas: number;
};

// Usado no primeiro render e como fallback se a API não responder.
const DEFAULT_ACCOUNT: Account = {
  name: "Teodosio Real",
  handle: "@teodosio",
  avatar: null,
  planActive: false,
  hasAcceptedBid: false,
  saldo: 75,
  esteMes: 1240,
  seguidores: 312,
  publicacoes: 890,
  colecoes: 280,
  gorjetas: 70,
};


function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Avatar({ name, photo, size = "md" }: { name: string; photo?: string; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        width={44}
        height={44}
        className={`${dims} shrink-0 rounded-full object-cover`}
      />
    );
  }

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
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
  const [auction, setAuction] = useState<Auction | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [acceptSecondsLeft, setAcceptSecondsLeft] = useState(0);
  const [showBids, setShowBids] = useState(false);
  const autoOpenedForRef = useRef<string | null>(null); // evita reabrir o popup pro mesmo leilão
  const autoRestartedForRef = useRef<string | null>(null); // evita reiniciar duas vezes o mesmo leilão encerrado
  const [showPlan, setShowPlan] = useState(false);
  const [planCycle, setPlanCycle] = useState<"mensal" | "anual">("anual");
  const [account, setAccount] = useState<Account>(DEFAULT_ACCOUNT);
  const [extraPages, setExtraPages] = useState<Post[][]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [feedOrder, setFeedOrder] = useState<Post[]>(posts);
  const [acceptingBidId, setAcceptingBidId] = useState<number | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [saleNotice, setSaleNotice] = useState<{ bidderName: string; amount: number } | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // A usuária vê os lances recebidos no PRÓPRIO leilão e escolhe qual
  // aceitar — não precisa ser o maior. Só nesse momento o valor entra na
  // carteira dela. Sempre via sessão — o painel já exige login pra existir.
  // Participa de quantos leilões quiser de graça enquanto não aceitar
  // nenhuma oferta; só trava depois que já aceitou a primeira.
  const acceptBid = async (bidId: number) => {
    if (account.hasAcceptedBid && !account.planActive) {
      setShowPlan(true);
      return;
    }
    setAcceptingBidId(bidId);
    setAcceptError(null);
    try {
      const res = await fetch("/api/auction/accept-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bid_id: bidId }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setAuction(data.auction);
        setAccount(data.account);
        setSaleNotice({ bidderName: data.auction.winnerName, amount: data.auction.winnerAmount });
      } else if (data.requiresPlan) {
        setShowPlan(true);
      } else if (res.status === 410) {
        setAcceptError(data.error || "O prazo pra aceitar esse leilão já passou.");
      }
    } catch {
      // sem conexão com o webhook service: não trava a tela, só não credita
    } finally {
      setAcceptingBidId(null);
    }
  };

  const [subscribing, setSubscribing] = useState(false);

  // Mock por enquanto (sem gateway de pagamento de verdade) — ativa o plano
  // na hora, só pra liberar o fluxo de teste de aceitar lance.
  const subscribe = async () => {
    setSubscribing(true);
    try {
      const res = await fetch("/api/account/subscribe", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.ok) {
        setAccount(data.account);
        setShowPlan(false);
      }
    } catch {
      // sem conexão: fica no popup, ela pode tentar de novo
    } finally {
      setSubscribing(false);
    }
  };

  const [startingFakeAuction, setStartingFakeAuction] = useState(false);
  const [fakeAuctionError, setFakeAuctionError] = useState<string | null>(null);

  // Fluxo de teste: a usuária (logada de verdade, via cadastro/formulário)
  // inicia o próprio leilão fake — compradores fictícios começam a dar
  // lance sozinhos, pra ela testar a tela de aceitar lance. O primeiro já
  // nasce sozinho no cadastro; isso aqui serve pra reiniciar automaticamente
  // (rotação contínua) e como botão de fallback se algo falhar no meio.
  const startFakeAuction = async () => {
    setStartingFakeAuction(true);
    setFakeAuctionError(null);
    try {
      const res = await fetch("/api/auction/start-fake", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.ok) {
        setAuction(data.auction);
      } else {
        setFakeAuctionError(data.error || "Não deu pra iniciar o leilão.");
      }
    } catch {
      setFakeAuctionError("Sem conexão com o servidor.");
    } finally {
      setStartingFakeAuction(false);
    }
  };

  // Embaralha a ordem dos posts iniciais a cada 2 minutos, pra quem fica com
  // a aba aberta não ver sempre a mesma sequência. As fotos/avatares
  // continuam grudados em cada criadora (só a ordem de exibição muda).
  useEffect(() => {
    const id = setInterval(() => {
      setFeedOrder(shuffle(posts));
    }, FEED_REORDER_MS);
    return () => clearInterval(id);
  }, []);

  // O usuário rola o feed inicial normalmente; ao chegar no fim aparece um
  // botão "Carregar mais" (em vez de carregar sozinho). Cada clique busca um
  // novo lote (com um pequeno atraso simulando uma atualização de verdade),
  // até um limite — depois disso some o botão e o rodapé fica acessível.
  const loadMore = () => {
    if (isLoadingMore || extraPages.length >= MAX_EXTRA_PAGES) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setExtraPages((pages) => [...pages, buildExtraPage(pages.length)]);
      setIsLoadingMore(false);
    }, 700);
  };

  // Painel só existe pra quem está logada de verdade (sessão por cookie) —
  // cada uma só enxerga a própria conta, sem conta "modelo" compartilhada
  // pra quem chega sem cadastro. Confere a sessão primeiro; só busca a
  // conta (e só então mostra a tela) depois de confirmar quem é ela.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        setAuthChecked(true);
        setLoggedIn(ok);
        if (!ok) {
          window.location.href = "/entrar";
          return;
        }
        if (data.account) setAccount(data.account);
      })
      .catch(() => {
        if (!cancelled) {
          setAuthChecked(true);
          window.location.href = "/entrar";
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = () => {
    fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      window.location.href = "/";
    });
  };

  // Busca o leilão atual no servidor e continua checando periodicamente —
  // é assim que lances de gente real (mandados pelo servidor de leilão
  // externo via webhook) chegam na tela sem precisar recarregar a página.
  useEffect(() => {
    let cancelled = false;
    const poll = () => {
      fetch("/api/auction/current")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled) setAuction(data);
        })
        .catch(() => {
          // servidor de leilão fora do ar por enquanto: mantém o último estado conhecido.
        });
    };
    poll();
    const interval = setInterval(poll, AUCTION_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Conta regressiva calculada a partir do horário real de término (não é
  // mais um timer fixo do navegador) — continua certa mesmo entre um poll e outro.
  useEffect(() => {
    if (!auction || auction.status !== "active") {
      setSecondsLeft(0);
      return;
    }
    const tick = () => {
      const diff = Math.round((new Date(auction.endsAt).getTime() - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, diff));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [auction?.endsAt, auction?.status]);

  // Depois que o leilão encerra, quanto tempo ainda falta pra ela poder
  // aceitar algum lance (janela de 15min a partir do fim — ver
  // ACCEPT_DEADLINE_MS no servidor). Some quando já foi aceito.
  useEffect(() => {
    if (!auction || auction.status !== "ended" || auction.acceptedBidId != null) {
      setAcceptSecondsLeft(0);
      return;
    }
    const tick = () => {
      const diff = Math.round((new Date(auction.acceptDeadline).getTime() - Date.now()) / 1000);
      setAcceptSecondsLeft(Math.max(0, diff));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [auction?.acceptDeadline, auction?.status, auction?.acceptedBidId]);

  // Abre o popup de lances sozinho quando o leilão encerra — só uma vez por
  // leilão, pra não reabrir toda vez que o usuário fechar e um novo poll chegar.
  useEffect(() => {
    if (auction?.status === "ended" && autoOpenedForRef.current !== auction.externalId) {
      setShowBids(true);
      autoOpenedForRef.current = auction.externalId;
    }
  }, [auction]);

  // "Outros leilões continuam acontecendo" — depois que um termina, o
  // próximo começa sozinho pouco depois, sem ela precisar clicar em nada.
  // Depende só do externalId/status (não do objeto `auction` inteiro, que
  // muda de referência a cada poll de 5s) — senão o efeito é desmontado e
  // remontado a cada poll, cancelando o setTimeout antes dele disparar.
  useEffect(() => {
    if (auction?.status !== "ended") return;
    const externalId = auction.externalId;
    if (autoRestartedForRef.current === externalId) return;
    autoRestartedForRef.current = externalId;
    const [min, max] = AUCTION_RESTART_DELAY_MS;
    const delay = min + Math.random() * (max - min);
    const t = setTimeout(() => {
      startFakeAuction();
    }, delay);
    return () => clearTimeout(t);
  }, [auction?.externalId, auction?.status]);

  const closeBids = () => setShowBids(false);

  const closePlan = () => setShowPlan(false);

  const feed: Array<{ key: string; node: React.ReactNode }> = [];
  let bannerIndex = 0;
  feedOrder.forEach((post, i) => {
    feed.push({ key: post.handle, node: <PostCard post={post} priority={i === 0} /> });
    if ((i + 1) % 5 === 0 && bannerIndex <= banners.length) {
      if (bannerIndex === 0) {
        feed.push({ key: "banner-appstores", node: <AppStoresBanner /> });
      } else {
        const banner = banners[bannerIndex - 1]!;
        feed.push({ key: `banner-${bannerIndex}`, node: <PromoBanner {...banner} /> });
      }
      bannerIndex += 1;
    }
    if (i === 2) {
      feed.push({ key: "ranking", node: <RankingCard /> });
    }
  });

  // Enquanto confere a sessão (ou se não está logada e já vai redirecionar
  // pra /entrar), não mostra o painel — evita piscar dados de conta errada.
  if (!authChecked || !loggedIn) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Notificação superior — leilão real (dados do servidor externo) */}
      <div
        className="fixed inset-x-0 top-0 z-40 text-brand-foreground"
        style={{ background: "var(--gradient-brand)", boxShadow: "0 6px 24px -12px rgba(0,0,0,0.4)" }}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold">
          {auction?.status === "active" && (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              <span>Próximo leilão em</span>
              <span className="rounded-lg bg-white/20 px-2 py-0.5 text-base font-extrabold tabular-nums tracking-tight">
                {formatCountdown(secondsLeft)}
              </span>
            </>
          )}
          {auction?.status === "ended" && (
            <button onClick={() => setShowBids(true)} className="underline decoration-white/50 underline-offset-2 hover:decoration-white">
              Leilão encerrado · ver resultado
            </button>
          )}
          {!auction && <span className="text-white/85">Nenhum leilão no momento</span>}
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
                  onClick={item.locked ? () => setShowPlan(true) : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    item.active
                      ? "bg-accent text-brand"
                      : item.locked
                        ? "text-muted-foreground/50 hover:bg-accent/50 hover:text-muted-foreground"
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
                  {item.locked && !item.badge && <Lock className="ml-auto h-3.5 w-3.5 shrink-0 opacity-60" />}
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
            {/* Sempre iniciais aqui — a foto que ela manda no formulário é
                dos pés, não do rosto, e vira uma mancha sem forma nesse
                ícone redondo pequeno. A foto continua guardada, só não é
                usada como avatar. */}
            <Avatar name={account.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{account.name}</p>
              <p className="truncate text-xs text-muted-foreground">{account.handle}</p>
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
              {loggedIn ? (
                <button
                  onClick={logout}
                  className="rounded-xl bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Sair
                </button>
              ) : (
                <Link
                  to="/entrar"
                  className="rounded-xl bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Entrar
                </Link>
              )}
              <button className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground">
                <Bell className="h-5 w-5" />
              </button>
              <Avatar name={account.name} size="sm" />
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

          {extraPages.map((page, pi) =>
            page.map((post, i) => (
              <PostCard key={`extra-${pi}-${post.handle}-${i}`} post={post} />
            )),
          )}

          {isLoadingMore && (
            <div className="space-y-5">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="animate-pulse overflow-hidden rounded-3xl bg-card"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="flex items-center gap-3 p-4">
                    <div className="h-11 w-11 shrink-0 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 rounded bg-muted" />
                      <div className="h-2 w-20 rounded bg-muted" />
                    </div>
                  </div>
                  <div className="mx-4 mb-4 h-80 rounded-2xl bg-muted" />
                </div>
              ))}
            </div>
          )}

          {!isLoadingMore && extraPages.length < MAX_EXTRA_PAGES && (
            <button
              onClick={loadMore}
              className="w-full rounded-2xl bg-card py-3 text-sm font-bold text-foreground transition-colors hover:bg-accent"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              Carregar mais
            </button>
          )}

          <footer className="pb-2 pt-4 text-center text-xs text-muted-foreground">
            <div className="flex items-center justify-center gap-4">
              <Link to="/privacidade" className="hover:text-foreground hover:underline">
                Política de Privacidade
              </Link>
              <Link to="/termos" className="hover:text-foreground hover:underline">
                Termos de Uso
              </Link>
            </div>
            <p className="mt-2">
              Última atualização: {new Date(__BUILD_TIME__).toLocaleString("pt-BR")}
            </p>
          </footer>
        </main>

        {/* Right sidebar */}
        <aside className="sticky top-6 hidden h-fit w-80 shrink-0 space-y-5 xl:block">
          <section className="rounded-3xl bg-foreground p-5 text-background" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 text-sm font-semibold opacity-80">
              <Wallet className="h-4 w-4" /> Carteira
            </div>
            <p className="mt-4 text-xs opacity-60">Saldo disponível</p>
            <p className="text-3xl font-extrabold tracking-tight">{formatBRL(account.saldo)}</p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-xs opacity-60">Este mês</p>
                <p className="text-sm font-bold">{formatBRL(account.esteMes)}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-xs opacity-60">Seguidores</p>
                <p className="text-sm font-bold">{account.seguidores}</p>
              </div>
            </div>

            <ul className="mt-5 space-y-2 text-sm">
              {[
                ["Publicações", formatBRL(account.publicacoes)],
                ["Coleções", formatBRL(account.colecoes)],
                ["Gorjetas", formatBRL(account.gorjetas)],
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

          {/* Botão de teste: fallback pra quando não existe leilão nenhum ainda
              (conta antiga) ou o reinício automático falhou de verdade. Não
              aparece só porque um leilão terminou — nesse caso o próximo já
              está a caminho sozinho (ver efeito de auto-restart acima); mostrar
              o botão nesse meio-tempo deixaria ela clicar e disputar corrida
              com o reinício automático, gerando um erro de "já tem um ativo". */}
          {loggedIn && (!auction || (auction.status !== "active" && fakeAuctionError)) && (
            <section className="rounded-3xl bg-card p-5 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                <Gavel className="h-4 w-4 text-brand" /> Leilão de teste
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Inicia um leilão fake pra ver os lances chegando e testar o "Aceitar".
              </p>
              <button
                onClick={startFakeAuction}
                disabled={startingFakeAuction}
                className="mt-4 w-full rounded-xl py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-60"
                style={{ background: "var(--gradient-brand)" }}
              >
                {startingFakeAuction ? "Iniciando…" : "Prosseguir para a Plataforma"}
              </button>
              {fakeAuctionError && <p className="mt-2 text-xs text-red-500">{fakeAuctionError}</p>}
            </section>
          )}

          {/* Lances recebidos no leilão atual — a usuária escolhe qual aceitar
              (não precisa ser o maior); só aí o valor entra na carteira dela.
              Some depois que passam os 15min do prazo (mesma regra do popup). */}
          {auction &&
            auction.acceptedBidId == null &&
            auction.bids.length > 0 &&
            Date.now() < new Date(auction.acceptDeadline).getTime() && (
            <section className="rounded-3xl bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Gavel className="h-4 w-4 text-brand" /> Lances recebidos
              </div>
              {!account.hasAcceptedBid || account.planActive ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Escolha qual lance você quer aceitar — o valor cai na sua carteira na hora.
                </p>
              ) : (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-brand">
                  <Lock className="h-3 w-3 shrink-0" /> Assine o plano pra aceitar outra oferta.
                </p>
              )}
              <ul className="mt-4 space-y-2">
                {auction.bids.map((bid) => {
                  const locked = account.hasAcceptedBid && !account.planActive;
                  return (
                    <li
                      key={bid.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-accent/60 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {bid.flag} {bid.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatBRL(bid.amount)}</p>
                      </div>
                      <button
                        onClick={() => acceptBid(bid.id)}
                        disabled={acceptingBidId !== null}
                        className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${
                          locked ? "bg-muted text-muted-foreground" : "bg-brand text-brand-foreground"
                        }`}
                      >
                        {acceptingBidId === bid.id ? (
                          "Aceitando…"
                        ) : locked ? (
                          <span className="flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Assinar
                          </span>
                        ) : (
                          "Aceitar"
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

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

      {/* Popup — Últimos lances do leilão (dados reais) */}
      {showBids && auction && (
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
                <Crown className="h-5 w-5" /> {auction.status === "ended" ? "Leilão encerrado" : "Últimos lances"}
              </h3>
              <button
                onClick={closeBids}
                aria-label="Fechar"
                className="grid h-8 w-8 place-items-center rounded-xl bg-white/20 transition-colors hover:bg-white/30"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {auction.status === "ended" && auction.winnerName && (
              <div className="mx-5 mt-4 rounded-2xl bg-accent p-4 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand">Vencedor do leilão</p>
                <p className="mt-1 text-base font-bold">{auction.winnerName}</p>
                {auction.winnerAmount != null && (
                  <p className="text-sm text-muted-foreground">{formatBRL(auction.winnerAmount)}</p>
                )}
              </div>
            )}

            {(() => {
              const acceptWindowOpen = Date.now() < new Date(auction.acceptDeadline).getTime();
              const canPickHere = auction.acceptedBidId == null;
              const locked = account.hasAcceptedBid && !account.planActive;

              return (
                <>
                  {canPickHere && auction.status === "ended" && (
                    <p className="mx-5 mt-4 text-center text-xs text-muted-foreground">
                      {acceptWindowOpen ? (
                        <>Você tem <span className="font-bold tabular-nums text-brand">{formatCountdown(acceptSecondsLeft)}</span> pra aceitar um lance.</>
                      ) : (
                        "O prazo pra aceitar esse leilão já passou."
                      )}
                    </p>
                  )}
                  {acceptError && (
                    <p className="mx-5 mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-center text-xs text-red-500">
                      {acceptError}
                    </p>
                  )}

                  {auction.bids.length === 0 ? (
                    <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                      Ainda não chegou nenhum lance nesse leilão.
                    </p>
                  ) : (
                    <ul className="mt-2 divide-y divide-border">
                      {auction.bids.map((bid, i) => (
                        <li
                          key={`${bid.name}-${i}`}
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
                            {formatBRL(bid.amount)}
                          </span>
                          {canPickHere && acceptWindowOpen && (
                            <button
                              onClick={() => acceptBid(bid.id)}
                              disabled={acceptingBidId !== null}
                              className={`ml-3 shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${
                                locked ? "bg-muted text-muted-foreground" : "bg-brand text-brand-foreground"
                              }`}
                            >
                              {acceptingBidId === bid.id ? (
                                "Aceitando…"
                              ) : locked ? (
                                <span className="flex items-center gap-1">
                                  <Lock className="h-3 w-3" /> Assinar
                                </span>
                              ) : (
                                "Aceitar"
                              )}
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              );
            })()}

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
              {account.planActive ? (
                <div className="rounded-2xl border border-border p-4 text-center">
                  <div
                    className="mx-auto grid h-11 w-11 place-items-center rounded-full text-brand-foreground"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    <Check className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-bold">Seu plano já está ativo</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Você pode participar de todos os próximos leilões e sacar seus ganhos.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    O primeiro leilão é grátis. Pra participar dos próximos e sacar seus ganhos, ative um plano.
                  </p>

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

                  <button
                    onClick={subscribe}
                    disabled={subscribing}
                    className="mt-5 block w-full rounded-xl py-3 text-center text-sm font-bold text-brand-foreground disabled:opacity-60"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    {subscribing ? "Ativando…" : "Gerar PIX e finalizar"}
                  </button>
                </>
              )}

              <p className="mt-3 text-center text-xs text-muted-foreground">
                🛡️ Site protegido · Seus dados em segurança
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Popup — Confirmação de venda (lance aceito, carteira atualizada) */}
      {saleNotice && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
          onClick={() => setSaleNotice(null)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-3xl bg-card p-6 text-center"
            style={{ boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="mx-auto grid h-14 w-14 place-items-center rounded-full text-brand-foreground"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Wallet className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-extrabold">Atualizamos sua carteira!</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Parabéns pela sua venda — lance de {saleNotice.bidderName} aceito por{" "}
              <span className="font-bold text-foreground">{formatBRL(saleNotice.amount)}</span>.
            </p>
            <button
              onClick={() => setSaleNotice(null)}
              className="mt-5 w-full rounded-xl py-2.5 text-sm font-bold text-brand-foreground"
              style={{ background: "var(--gradient-brand)" }}
            >
              Show!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AppStoresBanner() {
  return (
    <section
      className="relative overflow-hidden rounded-3xl p-6 text-brand-foreground sm:p-8"
      style={{ background: "var(--gradient-brand)" }}
    >
      <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/15" />
      <div className="absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/10" />
      <div className="relative max-w-lg">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
          <Smartphone className="h-3.5 w-3.5" /> Em breve
        </span>
        <h2 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">
          Vocês pediram e está quase lá!
        </h2>
        <p className="mt-2 text-sm text-white/85">
          Nos próximos dias, a PrivFeet estará disponível na App Store e Play Store.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-black px-4 py-2.5 opacity-90">
            <Apple className="h-6 w-6 shrink-0" />
            <div className="leading-tight">
              <p className="text-[10px] text-white/70">Em breve na</p>
              <p className="text-sm font-bold">App Store</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-black px-4 py-2.5 opacity-90">
            <PlayCircle className="h-6 w-6 shrink-0" />
            <div className="leading-tight">
              <p className="text-[10px] text-white/70">Em breve no</p>
              <p className="text-sm font-bold">Google Play</p>
            </div>
          </div>
        </div>
      </div>
    </section>
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
      <p className="mt-1 text-xs text-muted-foreground">Últimos 7 dias · Atualizado a cada 24h</p>

      <ul className="mt-4 divide-y divide-border">
        {topCreators.map((c, i) => (
          <li key={c.handle} className="flex items-center gap-3 py-3">
            <span className="w-6 shrink-0 text-center text-sm font-extrabold text-muted-foreground">
              {i === 0 ? "🏆" : `#${i + 1}`}
            </span>
            <Avatar
              name={c.name}
              // Pega do fim do pool de avatares (em vez de começar do 0, como o
              // feed) pra não duplicar visualmente com os primeiros posts do
              // feed logo abaixo, que são os mais visíveis junto com este card.
              photo={
                avatarImages[
                  (avatarImages.length - topCreators.length + i) % avatarImages.length
                ]!
              }
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{c.handle}</p>
              <p className="truncate text-xs text-muted-foreground">
                {c.vendas} vendas · {c.seguidores} seguidores
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-bold">{c.arrecadado}</p>
              <p className="text-[10px] text-muted-foreground">arrecadado</p>
            </div>
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
        <Avatar name={post.name} photo={post.avatar} />
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
          style={{ aspectRatio: post.imageRatio }}
          className="post-image-locked block w-full max-h-[75vh] object-contain bg-muted"
          onError={(e) => {
            e.currentTarget.style.visibility = "hidden";
          }}
        />
        <div className="post-image-veil pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="rounded-2xl bg-white px-6 py-3 text-center shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
            <p className="text-[10px] font-bold uppercase tracking-wide text-black/60">Vendido por</p>
            <p className="text-xl font-extrabold tracking-tight text-black">{post.price}</p>
            <p className="text-xs font-semibold text-black/50">≈ AED {formatAED(parseBRL(post.price))}</p>
          </div>
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
