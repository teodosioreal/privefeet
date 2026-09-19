import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Lock, UserRound } from "lucide-react";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [{ title: "Entrar — PrivFeet" }],
  }),
  component: EntrarPage,
});

function EntrarPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"senha" | "formulario">("senha");

  // Login e senha (quem criou conta em /cadastro)
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Nome + telefone (quem veio pelo formulário de recrutamento — essas
  // contas nunca tiveram usuário/senha, entraram direto pelo link único)
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submitSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        navigate({ to: "/" });
        return;
      }
      setError(data.error || "Não deu pra entrar, tenta de novo.");
    } catch {
      setError("Sem conexão com o servidor. Tenta de novo em instantes.");
    } finally {
      setLoading(false);
    }
  };

  const submitFormulario = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        navigate({ to: "/" });
        return;
      }
      setError(data.error || "Não deu pra entrar, tenta de novo.");
    } catch {
      setError("Sem conexão com o servidor. Tenta de novo em instantes.");
    } finally {
      setLoading(false);
    }
  };

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
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Entrar</h1>
            <p className="text-xs text-muted-foreground">Acesse seu painel</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
          <button
            type="button"
            onClick={() => {
              setMode("senha");
              setError(null);
            }}
            className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
              mode === "senha" ? "bg-card text-foreground shadow" : "text-muted-foreground"
            }`}
          >
            Login e senha
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("formulario");
              setError(null);
            }}
            className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
              mode === "formulario" ? "bg-card text-foreground shadow" : "text-muted-foreground"
            }`}
          >
            Vim pelo formulário
          </button>
        </div>

        {mode === "senha" ? (
          <form onSubmit={submitSenha} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Login</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="seu_login"
                className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-bold text-brand-foreground disabled:opacity-60"
              style={{ background: "var(--gradient-brand)" }}
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        ) : (
          <form onSubmit={submitFormulario} className="mt-6 space-y-4">
            <div className="flex items-start gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
              <UserRound className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Use o primeiro nome e o telefone que você preencheu na avaliação.</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Primeiro nome</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Maria"
                className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Telefone (com DDD)</label>
              <input
                type="tel"
                required
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 91234-5678"
                className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-bold text-brand-foreground disabled:opacity-60"
              style={{ background: "var(--gradient-brand)" }}
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link to="/cadastro" className="font-semibold text-foreground hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
