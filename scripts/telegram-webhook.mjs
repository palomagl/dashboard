// ==============================================
// Liga o bot do Telegram ao webhook do app
// ==============================================
// Roda uma vez por ambiente (e de novo se trocar o domínio ou o segredo):
//
//   TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... \
//     node scripts/telegram-webhook.mjs https://seu-app.vercel.app
//
// No PowerShell:
//   $env:TELEGRAM_BOT_TOKEN="..."; $env:TELEGRAM_WEBHOOK_SECRET="..."
//   node scripts/telegram-webhook.mjs https://seu-app.vercel.app
//
// Os valores têm que ser os mesmos cadastrados na Vercel. O script:
//   1. aponta o bot para <url>/api/telegram/webhook, com o segredo;
//   2. registra o menu de comandos (/start, /ajuda);
//   3. mostra o estado do webhook, incluindo o último erro, se houver.

const token = process.env.TELEGRAM_BOT_TOKEN;
const segredo = process.env.TELEGRAM_WEBHOOK_SECRET;
const base = process.argv[2]?.replace(/\/+$/, "");

function parar(mensagem) {
  console.error(`✖ ${mensagem}`);
  process.exit(1);
}

if (!token) parar("Falta TELEGRAM_BOT_TOKEN.");
if (!segredo) parar("Falta TELEGRAM_WEBHOOK_SECRET.");
if (!/^[A-Za-z0-9_-]{1,256}$/.test(segredo)) {
  parar("TELEGRAM_WEBHOOK_SECRET só pode ter letras, números, _ e -, com até 256 caracteres.");
}
if (!base || !base.startsWith("https://")) {
  parar("Passe o endereço do app com https://, ex.: node scripts/telegram-webhook.mjs https://seu-app.vercel.app");
}

async function chamar(metodo, corpo) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${metodo}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo ?? {}),
  });
  const dados = await res.json();
  if (!dados.ok) parar(`${metodo}: ${dados.description}`);
  return dados.result;
}

const url = `${base}/api/telegram/webhook`;

await chamar("setWebhook", {
  url,
  secret_token: segredo,
  // Só mensagens por enquanto. Os botões (Desfazer) vão entrar aqui na Fase 3.
  allowed_updates: ["message"],
  // Descarta o que acumulou enquanto o bot estava sem webhook.
  drop_pending_updates: true,
});
console.log(`✔ Webhook: ${url}`);

await chamar("setMyCommands", {
  commands: [
    { command: "start", description: "Apresentação do bot" },
    { command: "ajuda", description: "Comandos disponíveis" },
  ],
});
console.log("✔ Menu de comandos atualizado");

const info = await chamar("getWebhookInfo");
console.log(`  Pendentes: ${info.pending_update_count}`);
if (info.last_error_message) {
  console.log(`  Último erro: ${info.last_error_message}`);
}
