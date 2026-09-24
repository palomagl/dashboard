// ==============================================
// Firebase Admin: inicialização
// ==============================================
// Usado só pelas rotas em api/ (Node, nunca Edge — o Admin SDK precisa do
// runtime do Node). O app do navegador nunca importa este arquivo: ele fala
// com o Firebase pelo SDK de cliente, em src/lib/firebase.ts.
//
// A credencial é a chave de uma conta de serviço, colada inteira (o JSON que
// o Firebase Console entrega) na variável FIREBASE_SERVICE_ACCOUNT, só na
// Vercel. Nunca com o prefixo VITE_.

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";

let appAdmin: App | undefined;

function credencial() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!json) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT não configurado (Vercel → Settings → Environment Variables)."
    );
  }
  try {
    return JSON.parse(json);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT não é um JSON válido.");
  }
}

/** Sempre a mesma instância: uma função serverless pode reaproveitar o processo entre chamadas. */
export function obterAppAdmin(): App {
  if (appAdmin) return appAdmin;
  const existentes = getApps();
  appAdmin = existentes.length > 0 ? existentes[0] : initializeApp({ credential: cert(credencial()) });
  return appAdmin;
}
