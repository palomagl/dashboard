import { Component, type ErrorInfo, type ReactNode } from "react";
import { Logo } from "@/components/Logo";

// Uma exceção durante a renderização desmonta a árvore inteira do React, e o
// que sobra é uma página em branco — sem mensagem, sem botão, sem pista. Isto
// aparece no lugar: diz que quebrou e oferece a saída.

interface Props {
  children: ReactNode;
}

interface State {
  quebrou: boolean;
  mensagem: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { quebrou: false, mensagem: "" };

  static getDerivedStateFromError(erro: Error): State {
    return { quebrou: true, mensagem: erro.message };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error("A tela quebrou:", erro, info.componentStack);
  }

  render() {
    if (!this.state.quebrou) return this.props.children;

    return (
      <div
        className="min-h-screen bg-background grid place-items-center px-5
          pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <div className="w-full max-w-[400px] text-center">
          <div className="flex justify-center">
            <Logo className="w-14 h-14 opacity-60" />
          </div>

          <h1 className="mt-6 text-xl font-bold text-foreground">Algo quebrou nesta tela</h1>

          <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted-foreground">
            Seus dados estão salvos e não foram afetados. Recarregar costuma resolver.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-7 h-12 w-full rounded-2xl bg-primary font-semibold text-primary-foreground
              transition-all hover:opacity-90 active:scale-[0.99]"
          >
            Recarregar
          </button>

          {/* O detalhe técnico fica recolhido: serve para me contar o que houve,
              sem assustar quem só quer voltar a usar o app. */}
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-muted-foreground/70">
              Detalhes técnicos
            </summary>
            <pre className="mt-2 overflow-auto rounded-lg bg-secondary/50 p-3 text-[0.7rem] leading-relaxed text-muted-foreground">
              {this.state.mensagem}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
