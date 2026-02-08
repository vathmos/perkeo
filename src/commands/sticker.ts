import type { Client, Message } from "whatsapp-web.js";

export async function handleStickerCommand(
  msg: Message,
  client: Client,
): Promise<boolean> {
  const body = msg.body ?? "";
  const isStickerCommand = body.toLowerCase() === "!sticker";

  if (!isStickerCommand) {
    return false;
  }

  let targetMsg = msg;
  if (msg.hasQuotedMsg) {
    targetMsg = await msg.getQuotedMessage();
  }

  if (targetMsg.hasMedia) {
    const media = await targetMsg.downloadMedia();
    await client.sendMessage(msg.from, media, {
      sendMediaAsSticker: true,
      stickerAuthor: "Bot",
      stickerName: "Perkeo",
    });
  }

  return true;
}
