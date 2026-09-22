# Fundação: Firebase + Login com Google

**Data:** 2026-09-22
**Fase:** 1 de 2 (a fase 2 é o redesign da home, com spec próprio)
**Status:** aguardando revisão

---

## 1. Objetivo

Trocar o motor do "Minha Rotina" sem mudar a cara dele.

No fim desta fase o app parece **quase idêntico** ao de hoje, mas:

- entra com **um botão do Google**, e a sessão fica salva (não pede login de novo)
- **qualquer pessoa** com conta Google pode entrar e ganha um espaço só dela
- **não existe mais backend**: nem Render, nem Neon, nem Express, nem Prisma
- abre **na hora**, sem os ~50s de cold start do Render free
- funciona **offline** no iPhone (cache do Firestore)
- tem a **logo de verdade** no lugar do ícone genérico, e uma **splash** ao abrir

O redesign da tela (hierarquia "o que faço agora", hábitos horizontais, barra de ação rápida) **não faz parte desta fase**.

---

## 2. Decisões já tomadas

Confirmadas em conversa, não são para rediscutir aqui:

| Decisão | Escolha |
|---|---|
| Dados atuais do Neon | **Começar do zero.** Nada é migrado. |
| Separação entre usuárias | **100% separada.** Ninguém vê nada de ninguém. |
| Quem pode entrar | **Aberto.** Qualquer conta Google. |
| Métodos de login | **Só Google.** E-mail/senha é removido. |
| Backend | **Aposentado.** Frontend fala direto com o Firebase. |
| Ordem | Fundação primeiro, redesign depois. |

---

## 3. Arquitetura

### Hoje

```
React (Vercel) → fetch com JWT → Express (Render) → Prisma → Postgres (Neon)
```

Três serviços, três lugares para quebrar, e o Render dorme depois de 15 min de inatividade.

### Depois

```
React (Vercel) → Firebase SDK → Firebase Auth (Google)
                              → Cloud Firestore
```

Um serviço. Sem servidor para manter, sem cold start, sem senha para guardar.

**O que garante a segurança:** as *Security Rules* do Firestore, avaliadas pelo servidor do Google a cada leitura e escrita. Como o cadastro é aberto, essas regras são a única coisa entre uma pessoa desconhecida e os dados de outra — por isso elas têm **teste automatizado** (seção 9), não são escritas na confiança.

**Sobre a config do Firebase ficar no bundle:** as chaves `apiKey`, `projectId` etc. são públicas por design e vão para o JavaScript do navegador. Isso é normal e documentado pelo Google — elas identificam o projeto, não autorizam nada. Quem autoriza são as regras. Mesmo assim ficam em `.env` para facilitar trocar de projeto.

---

## 4. Modelo de dados (Firestore)

Tudo pendurado embaixo do `uid` da pessoa. Não existe coleção global de dados de usuário — isso torna a regra de segurança trivial de escrever e de verificar.

```
users/{uid}                          perfil
  ├── tasks/{id}
  ├── habits/{id}
  ├── goals/{id}
  ├── notes/{id}
  ├── bills/{id}
  ├── transactions/{id}
  └── days/{YYYY-MM-DD}              histórico para o gráfico semanal
```

### `users/{uid}`

```ts
{
  name: string          // vem do Google no primeiro acesso, editável depois
  email: string
  photoURL: string | null
  createdAt: Timestamp
}
```

Criado automaticamente no **primeiro login**, a partir do que o Google devolve. A pessoa nunca preenche formulário de cadastro.

**Tema e idioma continuam no `localStorage`**, como hoje. Guardá-los no Firestore sincronizaria entre aparelhos, mas custaria uma leitura antes de pintar a tela — e o `index.html` já aplica o tema antes do React subir justamente para não piscar. Não vale trocar isso por uma conveniência que ninguém pediu.

### `tasks/{id}`

```ts
{ title: string, completed: boolean, category: string,
  createdAt: Timestamp, updatedAt: Timestamp }
```

### `habits/{id}` — aqui tem uma correção de bug

Hoje o hábito tem `completed: boolean` e `streak: number`. Isso tem um problema real: **um booleano não sabe que dia é hoje.** Marcou academia na segunda, o hábito fica marcado para sempre, ou desmarca em algum momento que depende de o backend rodar alguma coisa. A sequência também não tem como estar certa.

Troca para:

```ts
{ name: string, icon: string,
  streak: number,
  lastCompletedOn: string | null,   // "2026-09-22"
  createdAt: Timestamp }
```

E aí:

- **"feito hoje?"** = `lastCompletedOn === hoje`. Vira verdade sozinho quando o dia vira, sem ninguém precisar rodar nada.
- **sequência** = ao marcar, se `lastCompletedOn` era ontem, `streak + 1`; se era mais antigo, `streak = 1`.

Isso entra nesta fase porque estamos reescrevendo a camada de dados de qualquer jeito, e levar o bug junto para o Firestore seria pior.

### `goals/{id}`, `notes/{id}`, `bills/{id}`, `transactions/{id}`

Mesmos campos das interfaces de hoje em `src/lib/api.ts`, mais `createdAt`. Valores de dinheiro continuam `number`.

### `days/{YYYY-MM-DD}` — o gráfico semanal

```ts
{ tasksCompleted: number, habitsCompleted: number }
```

Um documento por dia, escrito com incremento atômico quando você marca uma tarefa ou um hábito. Sete leituras para montar o gráfico.

**O dia é o seu dia, não o do servidor.** O id (`2026-09-22`) é formado no fuso do aparelho, não em UTC. Marcar um hábito às 22h de Porto Alegre tem que cair na terça, não na quarta — em UTC cairia na quarta. Mesma regra vale para o `lastCompletedOn` dos hábitos: as duas coisas usam a mesma função de "que dia é hoje", uma só, testada.

Por que não calcular na hora a partir das tarefas: porque **o histórico precisa sobreviver ao apagar**. Se você conclui cinco tarefas na segunda e apaga três na quarta, a segunda continua tendo sido um dia de cinco. Contando as tarefas que ainda existem, o passado muda toda vez que você limpa a lista.

---

## 5. Regras de segurança

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;

      match /{collection}/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }

    // tudo o que não foi liberado acima é negado
  }
}
```

Curta de propósito. Cada regra extra é uma chance a mais de deixar buraco.

O Firestore **nega por padrão**: o que não aparece aqui não é acessível. Não existe caminho no banco fora de `users/{uid}`, então não existe dado sem dono.

**Isso vai ter teste** — ver seção 9.

---

## 6. Fluxo de login

### A splash

Componente React que mostra a logo centralizada, o nome por baixo em fade, e sai dissolvendo.

Ele **cobre trabalho real**: o Firebase leva de 100 a 400ms para restaurar a sessão do IndexedDB. Hoje esse tempo é o texto cinza "Carregando..." do `ProtectedRoute.tsx`. A splash toma o lugar dele.

- **mínimo 700ms**, saída em fade de 300ms — sem isso ela pisca e parece bug
- **só no cold start.** Nunca ao navegar entre telas.
- constante nomeada no código, fácil de ajustar se ficar rápida ou lenta demais para o seu gosto

E uma camada antes dela: tags `apple-touch-startup-image` no `index.html`. O iOS **ignora a splash do manifest do PWA** — sem essas tags, o que aparece entre tocar no ícone e o React carregar é uma tela branca. Com elas, a logo aparece no primeiro quadro.

### O botão

Um botão só, no lugar onde hoje ficam e-mail, senha e "lembrar de mim":

- fundo branco, logo colorida oficial do Google em SVG, `h-12`, mesmo arredondamento do resto da tela
- estado de carregando, e uma linha de erro legível quando falha
- todo o resto da `Login.tsx` fica de pé: painel esquerdo, gradientes, blobs animados, lista de features, card de Pomodoro

### Popup ou redirect

Não dá para escolher um só:

- **`signInWithPopup`** é o recomendado no navegador, mas **no iPhone com o app salvo na tela inicial** (modo standalone) ele abre uma janela que não volta — o login trava. E esse é exatamente o seu caso de uso principal.
- **`signInWithRedirect`** funciona em standalone, mas quebra no **Safari** quando o `authDomain` é de outro domínio (`*.firebaseapp.com`), porque o Safari particiona storage de terceiros.

Então:

1. **Detectar standalone** (`window.matchMedia('(display-mode: standalone)')` e `navigator.standalone` do iOS) → redirect. Caso contrário → popup.
2. **Resolver o problema do Safari** apontando o `authDomain` para o domínio da própria Vercel, com um rewrite de `/__/auth/*` para o handler do Firebase em `vercel.json`. Aí o fluxo é same-origin e o Safari não bloqueia.

**Isso precisa ser testado no seu iPhone de verdade**, com o app na tela inicial. Não dá para validar só no Chrome do computador — é o cenário onde quebra.

### Primeiro acesso

1. Toca no botão → escolhe a conta Google
2. Firebase autentica e devolve `uid`, nome, e-mail, foto
3. App verifica se `users/{uid}` existe; se não, cria com esses dados
4. Vai para o dashboard, vazio

Sua namorada faz o mesmo no celular dela, ganha outro `uid`, e os dois espaços nunca se encontram.

### Sair

`signOut()` do Firebase e volta para `/login`.

---

## 7. Identidade visual

A logo é **três formas arredondadas**: teal em cima à esquerda, roxo em cima à direita, laranja embaixo à direita, cada uma com um corte diagonal de brilho.

A sorte é que **sua paleta já é essa.** Em `src/index.css`:

| Token | Valor de hoje | Cor da logo |
|---|---|---|
| `--primary` / `--widget-tasks` | `173 80% 40%` | teal |
| `--widget-habits` | `262 83% 58%` | roxo |
| `--widget-goals` | `38 92% 50%` | âmbar |

A logo não é uma marca nova. É a marca que já estava no CSS ganhando forma. **Nenhuma variável de cor muda.**

Entregáveis:

- `public/logo.svg` — a marca desenhada em SVG limpo (não um PNG rasterizado), usando as mesmas cores
- `public/favicon.svg` — substitui o check atual
- `public/pwa-192x192.png` e `pwa-512x512.png` — regerados
- imagens de splash do iOS nos tamanhos de iPhone
- componente `<Logo />` React, usado na `Login.tsx` (dois lugares), no `DashboardHeader` e na splash — **no lugar do ícone `Sparkles`** do lucide que faz de logo hoje

---

## 8. O que muda no código

### Nasce

| Arquivo | Para quê |
|---|---|
| `src/lib/firebase.ts` | inicializa o app, Auth e Firestore; liga o cache offline |
| `src/lib/db.ts` | substitui `api.ts` — **mesma forma de função** (`tasksApi.list()`, `.create()`…) para os widgets quase não mudarem |
| `src/lib/habits.ts` | cálculo de sequência e "feito hoje", puro e testável |
| `src/lib/stats.ts` | estatísticas rápidas e gráfico semanal |
| `src/components/SplashScreen.tsx` | a splash |
| `src/components/Logo.tsx` | a marca |
| `firestore.rules` | as regras |
| `firebase.json`, `.firebaserc` | config do projeto e do emulador |
| `vercel.json` | rewrite de `/__/auth/*` |

### Morre

| Arquivo / coisa | Por quê |
|---|---|
| `src/lib/api.ts` | o backend não existe mais |
| `src/pages/Register.tsx` + rota `/register` | não existe cadastro, o Google cuida disso |
| campos de e-mail/senha da `Login.tsx` | vira o botão do Google |
| troca de senha em `Account.tsx` | não há senha |
| `auth_token` e `mr_remember_email` no localStorage | o Firebase guarda a sessão sozinho |
| `VITE_API_URL` | não há API |
| seções do README sobre Express, Prisma, Neon, Render | não é mais verdade |

### Muda pouco

`AuthContext.tsx` passa a escutar o `onAuthStateChanged` do Firebase em vez de chamar `/auth/me`. Os widgets trocam o import de `@/lib/api` para `@/lib/db` e, fora isso, ficam como estão.

---

## 9. Testes

Node e as dependências ainda não estão instalados (seção 10), então isto é o alvo, não o estado atual.

**Regras de segurança — o teste que mais importa.** Com `@firebase/rules-unit-testing` no emulador:

- usuária A **consegue** ler e escrever em `users/A/**`
- usuária A **não consegue** ler `users/B/**` — nem um documento, nem listar a coleção
- quem não está logado **não consegue** nada
- ninguém escreve fora de `users/{uid}`

Com cadastro aberto, esse arquivo é o perímetro inteiro. Ele é escrito **antes** das regras, e tem que falhar antes de passar.

**Lógica pura** (Vitest, que o projeto já tem configurado):

- sequência: marcou ontem → +1; marcou anteontem → volta para 1; marcou hoje de novo → não conta duas vezes
- virada do dia: `lastCompletedOn` de ontem significa "não feito hoje"
- estatísticas: saldo do mês, contagem de tarefas do dia

**Na mão, e sem pular:** login no **iPhone com o app na tela inicial**. É o cenário do redirect, e é onde quebra.

---

## 10. Pré-requisitos — o que só você pode fazer

Isto trava a implementação. Não tem como eu fazer por você.

### a) Node.js

**Não está instalado nesta máquina** (confirmado por `winget` e por busca em disco). Sem ele não roda nada: nem instalar dependências, nem abrir o app, nem rodar teste.

### b) Projeto no Firebase

Em `console.firebase.google.com`:

1. criar um projeto
2. **Authentication → Sign-in method → Google → ativar**
3. **Firestore Database → criar**, em modo produção (as regras vêm do repositório)
4. **Project settings → Your apps → Web** → copiar a config
5. **Authentication → Settings → Authorized domains** → adicionar o domínio da Vercel e `localhost`

Eu te passo o passo a passo na hora, mas os cliques são seus: é sua conta Google.

### c) Vercel

As variáveis `VITE_FIREBASE_*` no painel do projeto, e apagar `VITE_API_URL`.

### d) Desligar o que sobrou

Depois que o app novo estiver de pé e funcionando: apagar o serviço no Render e o banco no Neon. **Você faz isso, não eu** — é destrutivo e é sua conta. E só depois de confirmar que o Firebase está funcionando, não antes.

---

## 11. Riscos

| Risco | Gravidade | O que fazemos |
|---|---|---|
| Login travar no PWA do iPhone | **alta** — é o seu uso principal | redirect em standalone + proxy do authDomain; testar no aparelho |
| Regra de segurança com buraco | **alta** — cadastro é aberto | testes no emulador, escritos antes das regras |
| Free tier do Firebase estourar | baixa | 50k leituras/dia aguenta dezenas de pessoas; dá para pôr teto depois |
| Cache offline com várias abas | baixa | o Firestore só sincroniza em uma aba por padrão; usar persistência multi-aba |
| Node/setup consumir a primeira sessão | média | resolver antes de começar a implementar |

---

## 12. Fora de escopo

Fase 2, spec próprio: a reorganização da home (o "o que faço agora", hábitos em linha, gráfico semanal para fora da primeira tela, barra de ação rápida, Pomodoro ligado à tarefa, celular como execução e computador como análise).

Também de fora: notificação push, compartilhamento entre as duas, exportar dados, e-mail/senha como segundo método.

---

## 13. Pronto quando

- [ ] entra com Google no Chrome do computador
- [ ] entra com Google no **iPhone, com o app na tela inicial**
- [ ] fecha e reabre: continua logada
- [ ] duas contas Google diferentes veem dashboards diferentes
- [ ] testes das regras passam no emulador
- [ ] tarefas, hábitos, metas, notas, contas e transações funcionam no Firestore
- [ ] hábito marcado ontem aparece desmarcado hoje, com a sequência certa
- [ ] gráfico semanal mostra o histórico certo
- [ ] logo no favicon, nos ícones do PWA, na splash, no login e no header
- [ ] splash aparece ao abrir e some sozinha
- [ ] `grep -ri "onrender\|VITE_API_URL\|prisma"` no `src/` não acha nada
- [ ] build da Vercel passa
