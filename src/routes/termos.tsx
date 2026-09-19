import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [{ title: "Termos de Uso — PrivFeet" }],
  }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao feed
        </Link>

        <h1 className="mt-6 text-2xl font-extrabold tracking-tight">Termos de Uso</h1>
        <p className="mt-1 text-sm text-muted-foreground">Última atualização: {new Date(__BUILD_TIME__).toLocaleDateString("pt-BR")}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-base font-bold text-foreground">1. Aceitação dos termos</h2>
            <p className="mt-2">
              Ao acessar ou usar o PrivFeet, você concorda com estes Termos de Uso. Se não concordar, não
              utilize a plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">2. Elegibilidade</h2>
            <p className="mt-2">
              A plataforma é destinada exclusivamente a maiores de 18 anos. Ao se cadastrar, você declara
              ter capacidade legal para celebrar este acordo.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">3. Conta e responsabilidades</h2>
            <p className="mt-2">
              Você é responsável por manter a confidencialidade das suas credenciais de acesso e por toda
              atividade realizada na sua conta.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">4. Planos e pagamentos</h2>
            <p className="mt-2">
              Alguns recursos exigem a ativação de um plano pago. Os valores, benefícios e formas de
              pagamento vigentes são exibidos no momento da contratação. Pagamentos são processados por
              provedores de pagamento e não somos responsáveis por falhas fora do nosso controle direto.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">5. Carteira e saques</h2>
            <p className="mt-2">
              O saldo exibido na carteira reflete eventos de pagamento confirmados. Solicitações de saque
              estão sujeitas a verificação e podem levar até o prazo informado na plataforma para serem
              processadas.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">6. Conteúdo publicado</h2>
            <p className="mt-2">
              Você é responsável pelo conteúdo que publica ou envia na plataforma, e declara possuir todos
              os direitos necessários sobre ele. É proibido publicar conteúdo de terceiros sem autorização,
              ou qualquer material ilegal.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">7. Suspensão e encerramento</h2>
            <p className="mt-2">
              Podemos suspender ou encerrar contas que violem estes termos, sem prejuízo de outras medidas
              cabíveis.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">8. Alterações nestes termos</h2>
            <p className="mt-2">
              Estes termos podem ser atualizados periodicamente. A data no topo desta página indica a
              versão mais recente. O uso continuado da plataforma após uma alteração implica aceitação dos
              novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-foreground">9. Contato</h2>
            <p className="mt-2">
              Dúvidas sobre estes termos podem ser enviadas pelos canais oficiais de suporte da plataforma.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
