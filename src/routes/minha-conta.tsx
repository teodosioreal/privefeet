import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Wallet } from "lucide-react";

export const Route = createFileRoute("/minha-conta")({
  head: () => ({
    meta: [{ title: "Minha conta — PrivFeet" }],
  }),
  component: MinhaContaPage,
});

type Account = {
  name: string;
  handle: string;
  saldo: number;
  esteMes: number;
  pixFullName: string | null;
  pixKey: string | null;
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function MinhaContaPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [fullName, setFullName] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        setAuthChecked(true);
        if (!ok) {
          window.location.href = "/entrar";
          return;
        }
        setAccount(data.account);
        setFullName(data.account.pixFullName || "");
        setPixKey(data.account.pixKey || "");
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch("/api/account/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, pixKey }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setAccount(data.account);
        setSaved(true);
      } else {
        setError(data.error || "Não deu pra salvar, tenta de novo.");
      }
    } catch {
      setError("Sem conexão com o servidor. Tenta de novo em instantes.");
    } finally {
      setSaving(false);
    }
  };

  if (!authChecked || !account) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-sm px-4 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao feed
        </Link>

        <div className="mt-6 flex items-center gap-2">
          <div
            className="grid h-11 w-11 place-items-center rounded-2xl text-brand-foreground"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Minha conta</h1>
            <p className="text-xs text-muted-foreground">{account.name} · {account.handle}</p>
          </div>
        </div>

        <section className="mt-6 rounded-3xl bg-foreground p-5 text-background" style={{ boxShadow: "var(--shadow-card)" }}>
          <p className="text-xs opacity-60">Saldo disponível</p>
          <p className="text-3xl font-extrabold tracking-tight">{formatBRL(account.saldo)}</p>
          <div className="mt-4 rounded-2xl bg-white/10 p-3">
            <p className="text-xs opacity-60">Este mês</p>
            <p className="text-sm font-bold">{formatBRL(account.esteMes)}</p>
          </div>
        </section>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Nome completo</label>
            <input
              type="text"
              required
              minLength={3}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Como está no seu documento"
              className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Chave PIX</label>
            <input
              type="text"
              required
              minLength={4}
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
              className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {saved && !error && (
            <p className="flex items-center gap-1.5 text-sm text-brand">
              <Check className="h-4 w-4" /> Chave PIX salva.
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl py-3 text-sm font-bold text-brand-foreground disabled:opacity-60"
            style={{ background: "var(--gradient-brand)" }}
          >
            {saving ? "Salvando…" : "Salvar chave PIX"}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Saques são processados em até 20 minutos.
          </p>
        </form>
      </div>
    </div>
  );
}
