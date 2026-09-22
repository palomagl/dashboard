// ==============================================
// Firebase
// ==============================================
// Ponto único de inicialização. Não existe backend: o app fala direto com o
// Firebase Auth e o Firestore, e quem protege os dados são as regras em
// firestore.rules, avaliadas no servidor do Google a cada leitura e escrita.

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Falha cedo e com nome: sem isto, uma variável esquecida vira um erro de
// autenticação confuso lá na frente, longe da causa.
const faltando = Object.entries(config)
  .filter(([, valor]) => !valor)
  .map(([chave]) => chave);

if (faltando.length > 0) {
  throw new Error(
    `Config do Firebase incompleta: ${faltando.join(", ")}. ` +
      `Confira o .env (veja .env.example).`
  );
}

export const app = initializeApp(config);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
// Sempre perguntar qual conta usar. Sem isto, quem tem várias contas Google
// entra direto na última usada e não consegue trocar.
googleProvider.setCustomParameters({ prompt: "select_account" });

// Cache em disco, com suporte a várias abas abertas. É o que faz o app abrir
// já mostrando os dados no celular, mesmo sem sinal, sincronizando depois.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
