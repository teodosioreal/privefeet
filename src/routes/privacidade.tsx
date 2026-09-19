import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [{ title: "Política de Privacidade — PrivFeet" }],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao feed
        </Link>

        <h1 className="mt-6 text-2xl font-extrabold tracking-tight">Política de Privacidade</h1>
        <p className="mt-1 text-sm text-muted-foreground">Última atualização: {new Date(__BUILD_TIME__).toLocaleDateString("pt-BR")}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-base font-bold text-foreground">1. Quem somos</h2>
            <p className="mt-2">
              O PrivFeet é uma plataforma de conteúdo por assinatura. Esta política explica quais dados
              coletamos de quem usa o site, como usamos essas informações e quais são os seus direitos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">2. Dados que coletamos</h2>
            <p className="mt-2">
              Ao criar uma conta ou realizar um pagamento, podemos coletar: nome, identificador de contato
              (telefone/e-mail), dados de pagamento processados por um provedor terceiro (nunca armazenamos
              dados completos de cartão ou chave Pix em nossos servidores) e informações de uso da plataforma
              (como saldo, histórico de transações e atividade de conta).
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">3. Como usamos seus dados</h2>
            <p className="mt-2">
              Usamos os dados para: manter sua conta e carteira atualizadas, processar pagamentos e saques,
              dar suporte quando necessário, e cumprir obrigações legais. Não vendemos seus dados pessoais a
              terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">4. Pagamentos e carteira</h2>
            <p className="mt-2">
              Os valores exibidos na sua carteira refletem eventos de pagamento processados por sistemas
              próprios ou parceiros. Guardamos um histórico das transações para fins de auditoria e suporte.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">5. Cookies</h2>
            <p className="mt-2">
              Podemos usar cookies e armazenamento local para manter sua sessão ativa e lembrar preferências
              básicas de uso. Você pode limpar esses dados a qualquer momento nas configurações do navegador.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">6. Idade mínima</h2>
            <p className="mt-2">
              O uso da plataforma é restrito a maiores de 18 anos. Ao criar uma conta, você declara ter
              idade legal para contratar os serviços oferecidos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">7. Seus direitos</h2>
            <p className="mt-2">
              Você pode solicitar a qualquer momento acesso, correção ou exclusão dos seus dados pessoais,
              entrando em contato pelos canais oficiais da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">8. Alterações nesta política</h2>
            <p className="mt-2">
              Esta política pode ser atualizada periodicamente. A data no topo desta página indica a versão
              mais recente.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
