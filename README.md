# 🚀 Dashboard Pessoal - Minha Rotina

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)

Sistema full-stack completo para gerenciamento de produtividade e rotina pessoal. O projeto oferece uma interface moderna para controle de hábitos, tarefas, metas e finanças, com suporte a personalização total de perfil e idioma.

> "Não andeis ansiosos pelo dia de amanhã, pois o amanhã cuidará de si mesmo." (Mateus 6:34)

## ✨ Funcionalidades

### 📋 Gestão de Produtividade
- **Tarefas & Hábitos:** Controle diário com sistema de "streaks" (sequências) para hábitos.
- **Metas:** Acompanhamento de progresso de objetivos a longo prazo.
- **Notas Rápidas:** Sistema de "Post-its" coloridos para lembretes e insights rápidos.

### 💰 Controle Financeiro
- **Fluxo de Caixa:** Gestão de receitas e despesas com cálculo automático de saldo mensal.
- **Contas:** Organização de contas pendentes e pagas.

### ⚙️ Personalização (Configurações)
- **Multilinguagem:** Troca dinâmica de idioma entre **Português (PT)** e **Inglês (EN)**.
- **Perfil do Usuário:** Alteração de nome, e-mail e senha diretamente no painel.
- **Interface:** Alternância entre Modo Claro (Light) e Modo Escuro (Dark).

---

## 🛠️ Tecnologias

- **Frontend:** React, Vite, Tailwind CSS, Shadcn/UI, Context API.
- **Backend:** Node.js, Express, JWT, Bcrypt, Prisma ORM.
- **Banco de Dados:** PostgreSQL (Hospedado no Neon.tech).
- **Deploy:** Vercel (Frontend) e Render (Backend).

---

## 🚀 Como Rodar o Projeto

### 1. Requisitos
- Node.js instalado e uma instância de PostgreSQL (ou conta no Neon.tech).

### 2. Configuração (Frontend)
Crie um arquivo `.env` na pasta raiz do frontend:
```env
VITE_API_URL=http://localhost:3000
```
### 3.Execução
Abra o terminal na pasta do projeto:
#### Terminal: Frontend
```bash
# Instalar dependências
npm install

# Iniciar o projeto
npm run dev
```

---

## 🔒 Segurança e Arquitetura

- **Autenticação:** Proteção de rotas e dados via tokens `JWT`.
- **Criptografia:** Senhas de usuários armazenadas com hash seguro `Bcrypt`.
- **Internacionalização:** Uso de `Context API` para gerenciar o estado global de tradução (i18n).
- **Persistência:** Banco de dados relacional garantindo a integridade das finanças e metas.

---

## 🔗 Demonstração

✨ **Acesse o projeto online:** [https://dashboard.vercel.app](https://dashboard-three-khaki-68.vercel.app/)

---

## 📩 Contato

Se tiver alguma dúvida ou quiser bater um papo sobre o projeto, me chama aí:

[![LinkedIn](https://img.shields.io/badge/linkedin-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/palomagl)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/5551998127367)

---

> Desenvolvido com foco em organização pessoal e experiência do usuário.
