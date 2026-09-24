// ==============================================
// POST/DELETE /api/telegram/vinculo
// ==============================================
// Chamada pelo app (card "Telegram" em Minha conta), sempre com o ID token
// de quem está logada no cabeçalho Authorization. É o Admin SDK que confere
// esse token — sem ele confirmado, não sai (nem entra) nenhum dado.
//
// POST gera um código de uso único, válido por 10 minutos, para a pessoa
// mandar em /start CODIGO no bot. DELETE desfaz o vínculo direto pelo app,
// sem precisar abrir o Telegram (o bot também tem /desvincular, para quando
// o app não está à mão).

import { getAuth } from "firebase-admin/auth";
import { obterAppAdmin } from "../_lib/firebase-admin.js";
import { criarCodigo, desvincularPorUid } from "../_lib/telegram/vinculo.js";

async function uidDoPedido(request: Request): Promise<string | null> {
  const cabecalho = request.headers.get("authorization");
  const token = cabecalho?.startsWith("Bearer ") ? cabecalho.slice("Bearer ".length) : null;
  if (!token) return null;

  try {
    const decodificado = await getAuth(obterAppAdmin()).verifyIdToken(token);
    return decodificado.uid;
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  const uid = await uidDoPedido(request);
  if (!uid) return new Response("Não autorizado", { status: 401 });

  const gerado = await criarCodigo(uid);
  return Response.json(gerado);
}

export async function DELETE(request: Request): Promise<Response> {
  const uid = await uidDoPedido(request);
  if (!uid) return new Response("Não autorizado", { status: 401 });

  await desvincularPorUid(uid);
  return new Response(null, { status: 204 });
}
