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
      scheduleTempDelete(targetMsg, sentSticker);
    }
  }

  return true;
}

const TEMP_DELETE_DELAY_MS = 10_000;

function scheduleTempDelete(sourceMsg: Message, stickerMsg: Message): void {
  setTimeout(async () => {
    await tryDelete(sourceMsg);
    await tryDelete(stickerMsg);
  }, TEMP_DELETE_DELAY_MS);
}

async function tryDelete(message: Message): Promise<void> {
  try {
    await message.delete(true);
  } catch (err) {
    console.warn("Temp delete failed:", err);
  }
}
