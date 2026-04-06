export class TelegramApi {
  private readonly baseUrl: string;

  constructor(private readonly token: string) {
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  async call<T>(method: string, payload: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}/${method}`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json<{ ok: boolean; result?: T; description?: string }>();
    if (!response.ok || !data.ok || data.result === undefined) {
      throw new Error(`Telegram API ${method} failed: ${JSON.stringify(data)}`);
    }
    return data.result;
  }

  sendMessage(payload: {
    chat_id: number;
    text: string;
    parse_mode?: "HTML";
    reply_markup?: unknown;
  }) {
    return this.call("sendMessage", payload);
  }

  sendPhoto(payload: {
    chat_id: number;
    photo: string;
    caption: string;
    parse_mode?: "HTML";
    reply_markup?: unknown;
  }) {
    return this.call("sendPhoto", payload);
  }

  editMessageText(payload: {
    chat_id: number;
    message_id: number;
    text: string;
    parse_mode?: "HTML";
    reply_markup?: unknown;
  }) {
    return this.call("editMessageText", payload);
  }

  editMessageMedia(payload: {
    chat_id: number;
    message_id: number;
    media: {
      type: "photo";
      media: string;
      caption: string;
      parse_mode?: "HTML";
    };
    reply_markup?: unknown;
  }) {
    return this.call("editMessageMedia", payload);
  }

  deleteMessage(payload: { chat_id: number; message_id: number }) {
    return this.call("deleteMessage", payload);
  }

  answerCallbackQuery(payload: {
    callback_query_id: string;
    text?: string;
    show_alert?: boolean;
  }) {
    return this.call("answerCallbackQuery", payload);
  }

  sendInvoice(payload: {
    chat_id: number;
    title: string;
    description: string;
    payload: string;
    provider_token: string;
    currency: string;
    prices: Array<{ label: string; amount: number }>;
    photo_url?: string;
    start_parameter: string;
  }) {
    return this.call("sendInvoice", payload);
  }

  answerPreCheckoutQuery(payload: {
    pre_checkout_query_id: string;
    ok: boolean;
    error_message?: string;
  }) {
    return this.call("answerPreCheckoutQuery", payload);
  }
}
