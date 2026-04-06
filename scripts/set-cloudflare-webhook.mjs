import fs from "node:fs";
import path from "node:path";

function loadDevVars() {
  const filePath = path.resolve(".dev.vars");
  if (!fs.existsSync(filePath)) {
    throw new Error(".dev.vars not found. Create it from .dev.vars.example first.");
  }
  const raw = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    env[key] = value;
  }
  return env;
}

async function callTelegram(token, method, payload) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(`Telegram API error on ${method}: ${JSON.stringify(data)}`);
  }
  return data.result;
}

async function main() {
  const env = loadDevVars();
  const token = env.BOT_TOKEN;
  const secret = env.WEBHOOK_SECRET_TOKEN;
  const workerUrl = env.WORKER_PUBLIC_URL;
  if (!token || !secret || !workerUrl) {
    throw new Error("BOT_TOKEN, WEBHOOK_SECRET_TOKEN and WORKER_PUBLIC_URL are required in .dev.vars");
  }
  const webhookUrl = `${workerUrl.replace(/\/$/, "")}/telegram/webhook`;
  await callTelegram(token, "setWebhook", {
    url: webhookUrl,
    secret_token: secret,
    drop_pending_updates: true,
    allowed_updates: [
      "message",
      "callback_query",
      "pre_checkout_query"
    ]
  });
  const info = await callTelegram(token, "getWebhookInfo", {});
  console.log(JSON.stringify(info, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
