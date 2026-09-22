# 🚀 Dashboard Pessoal - Minha Rotina

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)

Aplicativo de organização pessoal: tarefas, hábitos com sequência, metas, finanças e notas, com timer Pomodoro. Instalável como app no celular (PWA), funciona offline e entra com a conta Google.

> "Não andeis ansiosos pelo dia de amanhã, pois o amanhã cuidará de si mesmo." (Mateus 6:34)

## ✨ Funcionalidades

- **Tarefas & Hábitos** — controle diário com sequência que vira sozinha na virada do dia
- **Metas** — progresso de objetivos de longo prazo
- **Notas rápidas** — post-its coloridos
- **Finanças** — contas a pagar e fluxo de caixa com saldo do mês
- **Pomodoro** — sessões de foco
- **PWA** — instala na tela inicial, abre offline, com tela de abertura própria
- **Bilíngue** — português e inglês
- **Tema claro e escuro**

## 🛠️ Tecnologias

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Autenticação:** Firebase Auth (login com Google)
- **Banco de dados:** Cloud Firestore, com cache offline
- **Deploy:** Vercel

Não há backend próprio. O app fala direto com o Firebase, e quem garante que
cada pessoa só alcança os próprios dados são as regras em [`firestore.rules`](firestore.rules).

## 🚀 Rodando o projeto

### 1. Requisitos

- Node.js 20+
- Um projeto no [Firebase](https://console.firebase.google.com) com **Authentication → Google** ativado e um **Firestore** criado

### 2. Configuração

```bash
cp .env.example .env
```

Preencha com a config do seu projeto (Console → Project settings → Your apps → Web):

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Essas chaves são públicas por design: elas identificam o projeto, não autorizam nada.

Publique as regras de segurança do arquivo `firestore.rules` no console (Firestore Database → Rules), e adicione seus domínios em Authentication → Settings → Authorized domains.

### 3. Execução

```bash
npm install
npm run dev
```

### Outros comandos

```bash
npm test      # testes
npm run lint  # análise estática
npm run build # build de produção
npm run icones # regenera ícones e telas de abertura a partir de public/logo.svg
```

## 🔒 Segurança

- **Login com Google**, sem senha guardada em lugar nenhum
- **Isolamento por usuário:** todo dado mora em `users/{uid}`, e as regras do Firestore só liberam o caminho de quem está logado — verificado no servidor a cada leitura e escrita
- **Sessão persistente** guardada pelo próprio Firebase

## 📁 Estrutura

```
src/
├── lib/
│   ├── firebase.ts    inicialização do Firebase
│   ├── db.ts          acesso ao Firestore
│   ├── dates.ts       "que dia é hoje", no fuso local
│   └── habits.ts      sequência e "feito hoje"
├── contexts/          autenticação e idioma
├── components/        Logo, splash e widgets do dashboard
└── pages/             login, dashboard, conta
firestore.rules        regras de segurança
```

## 🔗 Demonstração

✨ [Acesse o projeto online](https://dashboard-three-khaki-68.vercel.app/)

## 📩 Contato

[![LinkedIn](https://img.shields.io/badge/linkedin-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/palomagl)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/5551998127367)

---

> Desenvolvido com foco em organização pessoal e experiência do usuário.
