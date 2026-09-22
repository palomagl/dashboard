// ==============================================
// Ações que podem falhar
// ==============================================
// Toda gravação passa por aqui. Antes, cada widget tinha o seu `catch {}`: se
// a escrita falhava, o botão simplesmente não fazia nada e ninguém ficava
// sabendo. Um app que falha em silêncio parece um app quebrado.

import { toast } from "sonner";

function detalheDe(erro: unknown): string | undefined {
  const codigo = (erro as { code?: string } | null)?.code;

  // Os poucos casos em que dá para dizer algo útil em vez de repetir o código.
  if (codigo === "permission-denied") return "Sem permissão para gravar.";
  if (codigo === "unavailable") return "Você parece estar sem conexão.";
  if (codigo === "not-found") return "O item não existe mais.";
  if (codigo === "resource-exhausted") return "Limite de uso atingido.";

  return codigo ?? (erro as Error)?.message;
}

/**
 * Executa uma gravação e avisa quando ela falha.
 *
 * Devolve `null` em caso de erro, para quem chamou não atualizar a tela como
 * se tivesse dado certo — mostrar a tarefa concluída quando o banco não
 * registrou é pior do que mostrar o erro.
 */
export async function executar<T>(
  fn: () => Promise<T>,
  mensagens: { erro: string; sucesso?: string }
): Promise<T | null> {
  try {
    const resultado = await fn();
    if (mensagens.sucesso) toast.success(mensagens.sucesso);
    return resultado;
  } catch (erro) {
    console.error(mensagens.erro, erro);
    toast.error(mensagens.erro, { description: detalheDe(erro) });
    return null;
  }
}

/**
 * Para leituras. Falha de leitura não merece um aviso vermelho — a tela vazia
 * já comunica — mas merece aparecer no console em vez de sumir.
 */
export async function carregar<T>(fn: () => Promise<T>, oQue: string): Promise<T | null> {
  try {
    return await fn();
  } catch (erro) {
    console.error(`Falha ao carregar ${oQue}:`, erro);
    return null;
  }
}
