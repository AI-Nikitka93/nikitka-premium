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

async function ensureProfileField(token, params) {
  const current = await callTelegram(token, params.getMethod, { language_code: "" });
  const currentValue = current?.[params.responseKey] ?? "";
  if (currentValue === params.desiredValue) {
    return { field: params.responseKey, status: "unchanged" };
  }
  try {
    await callTelegram(token, params.setMethod, {
      language_code: "",
      [params.payloadKey]: params.desiredValue
    });
    return { field: params.responseKey, status: "updated" };
  } catch (error) {
    if (String(error).includes("\"error_code\":429")) {
      return { field: params.responseKey, status: "rate_limited" };
    }
    throw error;
  }
}

async function main() {
  const env = loadDevVars();
  const token = env.BOT_TOKEN;
  const botTitle = env.BOT_TITLE || "NIKITKA PREMIUM";
  const adminHandle = env.ADMIN_HANDLE || "@ai_nikitka93";
  const adminChatId = env.ADMIN_CHAT_ID || "0";
  const workerPublicUrl = env.WORKER_PUBLIC_URL;

  if (!token || !workerPublicUrl) {
    throw new Error("BOT_TOKEN and WORKER_PUBLIC_URL are required in .dev.vars");
  }

  const description =
    `Тестовый AI-проект магазина одежды в Telegram. ` +
    `Реального магазина и реальных товаров здесь нет, изображения созданы AI. Админ: ${adminHandle}`;
  const shortDescription = `Тестовый AI-магазин. Реальных товаров нет. Админ: ${adminHandle}`;

  const profileResults = [];
  profileResults.push(await ensureProfileField(token, {
    getMethod: "getMyName",
    setMethod: "setMyName",
    responseKey: "name",
    payloadKey: "name",
    desiredValue: botTitle
  }));
  profileResults.push(await ensureProfileField(token, {
    getMethod: "getMyDescription",
    setMethod: "setMyDescription",
    responseKey: "description",
    payloadKey: "description",
    desiredValue: description
  }));
  profileResults.push(await ensureProfileField(token, {
    getMethod: "getMyShortDescription",
    setMethod: "setMyShortDescription",
    responseKey: "short_description",
    payloadKey: "short_description",
    desiredValue: shortDescription
  }));

  await callTelegram(token, "setMyCommands", {
    language_code: "",
    commands: [
      { command: "start", description: "Открыть бот" },
      { command: "catalog", description: "Открыть каталог" },
      { command: "aihelp", description: "AI-менеджер" },
      { command: "search", description: "Найти товар" },
      { command: "favorites", description: "Открыть избранное" },
      { command: "cart", description: "Открыть корзину" },
      { command: "contact", description: "Связаться с менеджером" },
      { command: "help", description: "Показать помощь" }
    ]
  });

  if (Number(adminChatId) > 0) {
    await callTelegram(token, "setMyCommands", {
      scope: {
        type: "chat",
        chat_id: Number(adminChatId)
      },
      language_code: "",
      commands: [
        { command: "start", description: "Открыть бот" },
        { command: "catalog", description: "Открыть каталог" },
        { command: "aihelp", description: "AI-менеджер" },
        { command: "search", description: "Найти товар" },
        { command: "favorites", description: "Открыть избранное" },
        { command: "cart", description: "Открыть корзину" },
        { command: "contact", description: "Связаться с менеджером" },
        { command: "help", description: "Показать помощь" },
        { command: "admin", description: "Открыть админ-панель" }
      ]
    });
  }

  await callTelegram(token, "setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: "✨ Открыть витрину",
      web_app: {
        url: `${workerPublicUrl.replace(/\/$/, "")}/app`
      }
    }
  });

  console.log(JSON.stringify({
    ok: true,
    botTitle,
    adminHandle,
    adminChatId,
    profileResults
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
