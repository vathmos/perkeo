import type { Client, Message } from "whatsapp-web.js";

export async function handleStickerCommand(
  msg: Message,
  client: Client,
): Promise<boolean> {
  const body = (msg.body ?? "").trim();
  const [commandRaw, ...args] = body.split(/\s+/);
  const command = commandRaw?.toLowerCase() ?? "";
  const isStickerCommand = command === "!sticker" || command === "!s";

  if (!isStickerCommand) {
    return false;
  }

  const isTemp = args[0]?.toLowerCase() === "temp";

  let targetMsg = msg;
  if (msg.hasQuotedMsg) {
    targetMsg = await msg.getQuotedMessage();
  }

  if (targetMsg.hasMedia) {
    const media = await targetMsg.downloadMedia();
    if (!media) {
      await msg.reply("I couldn't download that media. Try again.");
      return true;
    }

    const sentSticker = await client.sendMessage(msg.from, media, {
      sendMediaAsSticker: true,
      stickerAuthor: "Bot",
      stickerName: "Perkeo",
    });

    if (isTemp) {
      scheduleTempDelete(
        client,
        targetMsg.id?._serialized,
        sentSticker.id?._serialized,
      );
    }
  }

  return true;
}

const TEMP_DELETE_DELAY_MS = 10_000;
const TEMP_DELETE_RETRY_MS = 1_200;
const TEMP_DELETE_MAX_ATTEMPTS = 3;

type RevokeResult = {
  ok: boolean;
  missing?: string[];
  notAllowed?: string[];
  error?: string;
};

function scheduleTempDelete(
  client: Client,
  sourceId?: string,
  stickerId?: string,
): void {
  setTimeout(() => {
    void runTempDelete(client, sourceId, stickerId);
  }, TEMP_DELETE_DELAY_MS);
}

async function runTempDelete(
  client: Client,
  sourceId?: string,
  stickerId?: string,
): Promise<void> {
  let lastResult: RevokeResult | undefined;

  for (let attempt = 1; attempt <= TEMP_DELETE_MAX_ATTEMPTS; attempt++) {
    lastResult = await tryRevokeBoth(client, sourceId, stickerId);
    if (lastResult.ok) {
      return;
    }

    if (lastResult.missing?.length && attempt < TEMP_DELETE_MAX_ATTEMPTS) {
      await sleep(TEMP_DELETE_RETRY_MS);
      continue;
    }

    break;
  }

  console.warn("Temp delete incomplete:", lastResult);
}

async function tryRevokeBoth(
  client: Client,
  sourceId?: string,
  stickerId?: string,
): Promise<RevokeResult> {
  const ids = [sourceId, stickerId].filter(
    (value): value is string => Boolean(value),
  );

  if (ids.length === 0) {
    return { ok: false, error: "Missing message ids." };
  }

  const page = (client as { pupPage?: { evaluate: Function } }).pupPage;
  if (!page?.evaluate) {
    return { ok: false, error: "Puppeteer page unavailable." };
  }

  try {
    return (await page.evaluate(
      async ({ sourceId, stickerId }) => {
        const browserWindow = globalThis as any;
        const ids = [sourceId, stickerId].filter(Boolean);
        const missing = [];
        const notAllowed = [];
        const messages = [];

        for (const id of ids) {
          const msg =
            browserWindow.Store.Msg.get(id) ||
            (await browserWindow.Store.Msg.getMessagesById([id]))?.messages?.[0];
          if (!msg) {
            missing.push(id);
          } else {
            messages.push(msg);
          }
        }

        if (missing.length > 0) {
          return { ok: false, missing };
        }

        for (const msg of messages) {
          const canRevoke =
            browserWindow.Store.MsgActionChecks.canSenderRevokeMsg(msg) ||
            browserWindow.Store.MsgActionChecks.canAdminRevokeMsg(msg);
          if (!canRevoke) {
            notAllowed.push(msg.id._serialized);
          }
        }

        if (notAllowed.length > 0) {
          return { ok: false, notAllowed };
        }

        const grouped = new Map();
        for (const msg of messages) {
          const chatId = msg.id.remote;
          if (!grouped.has(chatId)) {
            grouped.set(chatId, []);
          }
          grouped.get(chatId).push(msg);
        }

        for (const [chatId, msgs] of grouped.entries()) {
          const chat =
            browserWindow.Store.Chat.get(chatId) ||
            (await browserWindow.Store.Chat.find(chatId));
          if (!chat) {
            return { ok: false, error: "Chat not found." };
          }

          if (
            browserWindow.compareWwebVersions(
              browserWindow.Debug.VERSION,
              ">=",
              "2.3000.0",
            )
          ) {
            await browserWindow.Store.Cmd.sendRevokeMsgs(
              chat,
              { list: msgs, type: "message" },
              { clearMedia: true },
            );
          } else {
            for (const msg of msgs) {
              await browserWindow.Store.Cmd.sendRevokeMsgs(chat, [msg], {
                clearMedia: true,
                type: msg.id.fromMe ? "Sender" : "Admin",
              });
            }
          }
        }

        return { ok: true };
      },
      { sourceId, stickerId },
    )) as RevokeResult;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
