import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, ChevronDown, ImagePlus, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  REDIRECT_URL,
  LINK_TERMOS,
  LINK_PRIVACIDADE,
  TEMPO_TRANSICAO_MS,
  TEMPO_REDIRECIONAMENTO_MS,
} from "@/content/config";
import { TEXTOS } from "@/content/textos";
import { SEO } from "@/content/seo";
import { FAQ } from "@/content/faq";
import { enviarWebhook } from "@/lib/webhook";
import backgroundImage from "@/assets/avaliacao-bg.jpg";
import logoImage from "@/assets/logo-pes.png";
import seloReclameAqui from "@/assets/selo-reclame-aqui.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: SEO.titulo },
      { name: "description", content: SEO.descricao },
      { name: "keywords", content: SEO.palavrasChave.join(", ") },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { name: "author", content: SEO.nomeDoSite },
      { name: "language", content: "pt-BR" },
      { property: "og:site_name", content: SEO.nomeDoSite },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:title", content: SEO.tituloCompartilhamento },
      { property: "og:description", content: SEO.descricaoCompartilhamento },
      { property: "og:url", content: SEO.siteUrl },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SEO.tituloCompartilhamento },
      { name: "twitter:description", content: SEO.descricaoCompartilhamento },
    ],
    links: [{ rel: "canonical", href: SEO.siteUrl }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              name: SEO.nomeDoSite,
              url: SEO.siteUrl,
              inLanguage: "pt-BR",
              description: SEO.descricao,
              keywords: SEO.palavrasChave.join(", "),
            },
            {
              "@type": "Service",
              name: SEO.titulo,
              serviceType: "Venda de fotos de pés",
              areaServed: ["BR", "US", "GB", "PT", "CA", "AU"],
              provider: { "@type": "Organization", name: SEO.nomeDoSite, url: SEO.siteUrl },
              description: SEO.descricao,
            },
            {
              "@type": "FAQPage",
              mainEntity: SEO.perguntasGoogle.map((q) => ({
                "@type": "Question",
                name: q.pergunta,
                acceptedAnswer: { "@type": "Answer", text: q.resposta },
              })),
            },
          ],
        }),
      },
    ],
  }),
  component: Index,
});

const questions = TEXTOS.perguntas;

function ageFrom(date: string) {
  const m = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return -1;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const birth = new Date(year, month - 1, day, 12, 0, 0);
  if (birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day) return -1;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const diff = today.getMonth() - birth.getMonth();
  if (diff < 0 || (diff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function maskDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join("/");
}

function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function LegalLink({ href, label }: { href: string; label: string }) {
  if (!href) return <span className="font-medium text-foreground/80">{label}</span>;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="font-medium text-foreground/80 underline underline-offset-2 hover:text-primary">
      {label}
    </a>
  );
}

function FaqItem({ item, open, onToggle }: { item: { pergunta: string; resposta: string }; open: boolean; onToggle: () => void }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl transition-colors duration-300", open ? "bg-white/[0.06]" : "bg-white/[0.03] hover:bg-white/[0.06]")}>
      <button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium">
        <span>{item.pergunta}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-primary transition-transform duration-300", open && "rotate-180")} />
      </button>
      <div className={cn("grid transition-all duration-300 ease-out", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="overflow-hidden"><p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{item.resposta}</p></div>
      </div>
    </div>
  );
}

function FaqSection() {
  const [open, setOpen] = useState(0);
  if (!FAQ.itens.length) return null;
  return (
    <section className="mx-auto mt-14 w-full max-w-sm animate-step-in sm:mt-16" aria-label={FAQ.titulo || "Perguntas frequentes"}>
      {FAQ.titulo && <h2 className="font-display text-base font-medium tracking-tight text-center sm:text-lg">{FAQ.titulo}</h2>}
      {FAQ.subtitulo && <p className="mt-1 text-center text-xs text-muted-foreground sm:text-sm">{FAQ.subtitulo}</p>}
      <div className="mt-4 space-y-2">
        {FAQ.itens.map((item, i) => (
          <FaqItem key={item.pergunta} item={item} open={open === i} onToggle={() => setOpen((cur) => (cur === i ? -1 : i))} />
        ))}
      </div>
    </section>
  );
}


function Index() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<File>();
  const [answers, setAnswers] = useState<string[]>([]);
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [showAvisoFoto, setShowAvisoFoto] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [pendingStep, setPendingStep] = useState<number>();
  const transitionTimer = useRef<number | undefined>(undefined);
  const webhookSent = useRef(false);
  const startedAt = useRef(new Date().toISOString());
  const fileInput = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => photo ? URL.createObjectURL(photo) : "", [photo]);
  const age = birthDate ? ageFrom(birthDate) : -1;
  const phoneDigits = whatsapp.replace(/\D/g, "");
  const phoneValid = phoneDigits.length === 10 || phoneDigits.length === 11;

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    if (step !== 9) return;
    if (webhookSent.current) return;
    webhookSent.current = true;

    // Espera o webhook responder (até o limite configurado) E o tempo
    // mínimo da tela "Tudo pronto!" — o que demorar mais. Se o outro site
    // já criou a conta e mandou um link de acesso (claimUrl), a pessoa cai
    // direto logada nele; senão, usa o redirecionamento fixo de sempre.
    let cancelled = false;
    const minDelay = new Promise<void>((resolve) => window.setTimeout(resolve, TEMPO_REDIRECIONAMENTO_MS));
    const sending = enviarWebhook({
      nome: name,
      respostas: answers.map((respostaId, i) => {
        const q = questions[i];
        const opt = q?.opcoes.find((o) => o.id === respostaId);
        return {
          perguntaId: q?.id ?? `pergunta${i + 1}`,
          pergunta: q?.titulo ?? `Pergunta ${i + 1}`,
          respostaId: respostaId,
          resposta: opt?.texto ?? respostaId,
        };
      }),
      dataNascimento: birthDate,
      idade: age,
      genero: TEXTOS.genero.opcoes.find((o) => o.id === gender)?.texto ?? gender,
      generoId: gender,
      whatsapp: `+${TEXTOS.whatsapp.ddi} ${maskPhone(whatsapp)}`,
      whatsappId: `${TEXTOS.whatsapp.ddi}${phoneDigits}`,
      iniciadoEm: startedAt.current,
      duracaoSegundos: Math.round((Date.now() - new Date(startedAt.current).getTime()) / 1000),
      ...(photo ? { foto: photo } : {}),
    }).catch(() => null);

    Promise.all([sending, minDelay]).then(([result]) => {
      if (cancelled) return;
      window.location.assign(result?.claimUrl || REDIRECT_URL);
    });

    return () => {
      cancelled = true;
    };
  }, [step, name, answers, birthDate, age, gender, whatsapp, phoneDigits, photo]);

  const valid = step === 0 ? name.trim().length >= 3 && !!photo
    : step >= 1 && step <= 5 ? !!answers[step - 1]
    : step === 6 ? age >= 18
    : step === 7 ? !!gender
    : step === 8 ? phoneValid : true;

  const selectAnswer = (value: string) => {
    setAnswers((current) => { const next = [...current]; next[step - 1] = value; return next; });
  };

  const goTo = (next: number) => {
    if (transitioning) return;
    setPendingStep(next);
    setTransitioning(true);
    transitionTimer.current = window.setTimeout(() => {
      setStep(next);
      setTransitioning(false);
      setPendingStep(undefined);
    }, TEMPO_TRANSICAO_MS);
  };

  useEffect(() => () => window.clearTimeout(transitionTimer.current), []);

  // Etapa nova sempre começa no topo: evita o conteúdo aparecer cortado
  // quando o toque no botão aconteceu com a página rolada para baixo.
  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  const transitionLabel = step === 0 ? TEXTOS.transicoes.inicio
    : step === 6 ? TEXTOS.transicoes.nascimento
    : step === 7 ? TEXTOS.transicoes.genero
    : step === 8 ? TEXTOS.transicoes.whatsapp
    : TEXTOS.transicoes.perguntas;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      <div className="fixed inset-0 z-0" aria-hidden="true">
        <img
          src={backgroundImage}
          alt=""
          width={1920}
          height={1280}
          className="h-full w-full object-cover object-[50%_38%] opacity-95 contrast-[1.06] saturate-[1.12]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,transparent_0%,color-mix(in_oklab,var(--background)_35%,transparent)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_38%_at_50%_42%,color-mix(in_oklab,var(--primary)_22%,transparent)_0%,transparent_70%)] mix-blend-soft-light" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--background)_30%,transparent)_0%,transparent_22%,transparent_60%,color-mix(in_oklab,var(--background)_65%,transparent)_100%)]" />
      </div>
      <div className="fixed inset-x-0 top-0 z-20 h-1 bg-secondary">
        <div className="h-full bg-primary transition-[width] duration-700 ease-out" style={{ width: `${(((transitioning && pendingStep !== undefined ? pendingStep : step) + 1) / 10) * 100}%` }} />
      </div>
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 pb-28 pt-8 sm:px-8 sm:pt-12 lg:px-12">
        <div className="pointer-events-none absolute left-1/2 top-1/3 -z-10 size-96 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl animate-soft-pulse" aria-hidden="true" />
        <div className="pointer-events-none absolute left-1/2 top-2/3 -z-10 size-72 -translate-x-1/2 rounded-full bg-[var(--blush)]/15 blur-3xl" aria-hidden="true" />
        <h1 className="sr-only">{SEO.tituloH1}</h1>
        <div className="relative mx-auto flex min-h-[calc(100dvh-9.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-background/36 px-5 py-7 shadow-2xl shadow-black/50 backdrop-blur-xl sm:px-8 sm:py-9">
        <header className="relative mb-8 flex items-center justify-center">
          {step > 0 ? (
            <span className="grid size-11 place-items-center rounded-full bg-primary/15 shadow-lg shadow-primary/20"><img src={logoImage} alt={TEXTOS.comuns.logoAlt} width={24} height={24} className="size-6 object-contain" /></span>
          ) : null}
          {step > 0 && step < 9 && <span className="absolute right-0 rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium text-muted-foreground">{TEXTOS.comuns.contador(step + 1, 10)}</span>}
        </header>

        <section key={step} className={cn("my-auto transition-opacity duration-300", transitioning ? "pointer-events-none opacity-0" : "animate-step-in opacity-100")}>
          {step === 0 && <>
            <img src={logoImage} alt={TEXTOS.comuns.logoAlt} width={816} height={816} className="mx-auto mb-5 size-20 object-contain drop-shadow-[0_0_18px_rgba(197,95,63,0.35)] sm:size-24" />
            <h1 className="bg-gradient-to-r from-foreground via-foreground to-blush bg-clip-text text-center font-display text-3xl font-medium tracking-tight sm:text-4xl">{TEXTOS.inicio.titulo}</h1>
            <p className="mt-2 text-center text-sm text-muted-foreground sm:text-base">{TEXTOS.inicio.subtitulo}</p>
            <div className="mt-8 space-y-6">
              <div>
                <span className="mb-2 block text-sm font-medium">{TEXTOS.inicio.rotuloFoto}</span>
                <input ref={fileInput} className="hidden" type="file" accept="image/jpeg,image/png" onChange={(e) => { const file = e.target.files?.[0]; if (file && file.size <= 10 * 1024 * 1024) setPhoto(file); }} />
                {!photo ? <button type="button" onClick={() => { setShowAvisoFoto(true); fileInput.current?.click(); }} className="group flex h-44 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/[0.04] text-center transition duration-300 hover:border-primary/70 hover:bg-primary/5 active:scale-[0.99]">
                  <span className="mb-3 grid size-11 place-items-center rounded-md bg-secondary text-primary transition group-hover:scale-105"><ImagePlus /></span><span className="text-sm font-semibold">{TEXTOS.inicio.chamadaUpload}</span><span className="mt-1 text-xs text-muted-foreground">{TEXTOS.inicio.ajudaUpload}</span>
                </button> : <div className="relative h-52 overflow-hidden rounded-lg bg-card"><img src={preview} alt={TEXTOS.comuns.previaFoto} className="h-full w-full scale-110 object-cover blur-xl" /><div className="absolute inset-0 grid place-items-center bg-black/30"><span className="grid size-14 place-items-center rounded-full bg-black/45 backdrop-blur-sm"><LockKeyhole className="size-6 text-foreground/90" /></span></div><Button type="button" size="sm" variant="secondary" onClick={() => { setShowAvisoFoto(true); fileInput.current?.click(); }} className="absolute bottom-3 right-3 rounded-full"><RefreshCw /> {TEXTOS.inicio.trocarFoto}</Button></div>}
                {showAvisoFoto && <p role="note" className="mt-3 flex items-start gap-2 rounded-xl bg-primary/10 px-3.5 py-2.5 text-xs leading-relaxed text-primary/90 animate-step-in"><ShieldCheck className="mt-0.5 size-4 shrink-0" />{TEXTOS.inicio.avisoFoto}</p>}
              </div>
              <label className="block"><span className="mb-2 block text-sm font-medium">{TEXTOS.inicio.rotuloNome}</span><Input value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder={TEXTOS.inicio.placeholderNome} className="h-12 rounded-full border-white/10 bg-white/[0.04] px-5 focus-visible:border-primary/60" /></label>
            </div>
          </>}

          {step >= 1 && step <= 5 && (() => { const q = questions[step - 1]; if (!q) return null; return <>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary">{TEXTOS.rotuloPergunta(step, questions.length)}</p>
            <h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">{q.titulo}</h1><p className="mt-3 text-sm text-muted-foreground">{q.apoio}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">{q.opcoes.map((option) => { const selected = answers[step - 1] === option.id; return <button key={option.id} type="button" aria-pressed={selected} onClick={() => { selectAnswer(option.id); goTo(step + 1); }} className={cn("flex min-h-14 w-full items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3 text-left text-sm font-medium transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-white/[0.08] active:scale-[0.98]", selected && "bg-primary/20 shadow-lg shadow-primary/20")}><span className={cn("grid size-6 shrink-0 place-items-center rounded-full border transition duration-300", selected ? "border-primary bg-primary text-primary-foreground" : "border-white/15")} aria-hidden="true">{selected && <Check className="size-3.5" />}</span><span className="min-w-0">{option.texto}</span></button>})}</div>
          </>; })()}

          {step === 6 && <><p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary">{TEXTOS.nascimento.etiqueta}</p><h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">{TEXTOS.nascimento.titulo}</h1><p className="mt-3 text-sm text-muted-foreground">{TEXTOS.nascimento.apoio}</p><label className="mt-8 block"><span className="mb-2 block text-sm font-medium">{TEXTOS.nascimento.rotuloCampo}</span><Input inputMode="numeric" autoComplete="bday" placeholder={TEXTOS.nascimento.placeholder} value={birthDate} maxLength={10} onChange={(e) => setBirthDate(maskDate(e.target.value))} className="h-12 rounded-full bg-white/[0.04] px-5 text-center text-base tracking-[0.15em] placeholder:text-muted-foreground/50 focus-visible:border-primary/60" /></label>{birthDate && age < 18 && <p role="alert" className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{TEXTOS.nascimento.bloqueioMenorIdade}</p>}</>}
          {step === 7 && <><p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary">{TEXTOS.genero.etiqueta}</p><h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">{TEXTOS.genero.titulo}</h1><p className="mt-3 text-sm text-muted-foreground">{TEXTOS.genero.apoio}</p><div className="mt-8 grid grid-cols-2 gap-3">{TEXTOS.genero.opcoes.map((option) => <button key={option.id} type="button" aria-pressed={gender === option.id} onClick={() => { setGender(option.id); goTo(8); }} className={cn("min-h-24 rounded-2xl bg-white/[0.04] text-sm font-semibold transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-white/[0.08] active:scale-[0.98]", gender === option.id && "bg-primary/20 shadow-lg shadow-primary/20")}>{option.texto}</button>)}</div></>}
          {step === 8 && <><p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary">{TEXTOS.whatsapp.etiqueta}</p><h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">{TEXTOS.whatsapp.titulo}</h1><p className="mt-3 text-sm text-muted-foreground">{TEXTOS.whatsapp.apoio}</p><label className="mt-8 block"><span className="mb-2 block text-sm font-medium">{TEXTOS.whatsapp.rotuloCampo}</span><div className="flex h-12 items-center rounded-full bg-white/[0.04] px-5 focus-within:border-primary/60 border border-transparent"><span className="shrink-0 text-base tracking-[0.08em] text-muted-foreground">+{TEXTOS.whatsapp.ddi}</span><span className="mx-3 h-4 w-px shrink-0 bg-white/15" /><Input inputMode="tel" autoComplete="tel" placeholder={TEXTOS.whatsapp.placeholder} value={whatsapp} maxLength={15} onChange={(e) => setWhatsapp(maskPhone(e.target.value))} className="h-full flex-1 rounded-none border-0 bg-transparent px-0 text-center text-base tracking-[0.08em] shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-0" /></div></label><p className="mt-3 text-center text-xs text-muted-foreground/80">{TEXTOS.whatsapp.avisoUnico}</p>{whatsapp.length > 0 && !phoneValid && <p role="alert" className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{TEXTOS.whatsapp.avisoNumeroInvalido}</p>}</>}
          {step === 9 && <div className="py-16 text-center" role="status" aria-live="polite"><div className="relative mx-auto mb-7 grid size-20 place-items-center"><span className="absolute inset-0 rounded-full border border-primary/20 animate-soft-pulse" /><span className="size-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" /></div><h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">{TEXTOS.final.titulo}</h1><p className="mt-3 text-sm text-muted-foreground">{TEXTOS.final.apoio}</p><div className="mx-auto mt-8 h-1 w-44 overflow-hidden rounded-full bg-white/10"><span className="block h-full w-full origin-left rounded-full bg-primary animate-redirect-bar" style={{ ["--redirect-duration" as never]: `${TEMPO_REDIRECIONAMENTO_MS}ms` }} /></div></div>}
        </section>

        {step < 9 && <div className="mt-10 flex items-center gap-3">
          {step > 0 && <Button variant="ghost" className="h-12 px-3 text-muted-foreground" onClick={() => setStep((s) => s - 1)}><ArrowLeft /> {TEXTOS.comuns.voltar}</Button>}
          {(step === 0 || step === 6 || step === 8) && <Button disabled={!valid} className="ml-auto h-12 min-w-48 rounded-full px-6 transition-transform duration-300 active:scale-[0.97]" onClick={() => goTo(step + 1)}>{step === 0 ? TEXTOS.inicio.botaoContinuar : step === 8 ? TEXTOS.whatsapp.botaoContinuar : TEXTOS.nascimento.botaoContinuar}<ArrowRight /></Button>}
        </div>}
        {transitioning && (
          <div role="status" aria-live="polite" className="absolute inset-0 z-20 flex animate-step-in flex-col items-center justify-center gap-5 rounded-3xl bg-background/60 backdrop-blur-2xl">
            <div className="relative grid size-16 place-items-center">
              <span className="absolute inset-0 animate-soft-pulse rounded-full border border-primary/25" />
              <span className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            </div>
            <p className="animate-soft-pulse text-sm font-medium text-muted-foreground">{transitionLabel}</p>
          </div>
        )}
        </div>
        {step === 0 && <FaqSection />}
      </div>
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-white/5 bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-6">
          <p className="flex items-center gap-1.5 whitespace-nowrap text-center text-[10px] text-muted-foreground sm:text-xs">
            <LockKeyhole className="size-3 shrink-0 text-primary" /> {TEXTOS.rodape.seguranca}
          </p>
          <img
            src={seloReclameAqui}
            alt="Verificada por Reclame AQUI"
            loading="lazy"
            className="h-9 w-auto opacity-90 sm:h-10"
          />
          <p className="flex items-center gap-3 text-center text-[10px] text-muted-foreground sm:text-xs">
            <LegalLink href={LINK_TERMOS} label={TEXTOS.rodape.termos} />
            <span aria-hidden="true" className="h-3 w-px bg-white/15" />
            <LegalLink href={LINK_PRIVACIDADE} label={TEXTOS.rodape.privacidade} />
          </p>
        </div>
      </footer>
    </main>
  );
}
