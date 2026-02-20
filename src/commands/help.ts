import type { Message } from "whatsapp-web.js";

const HELP_MESSAGE = [
  "Available commands:",
  "!help - show this help message",
  "!ping - check bot status",
  "!brat <text> - generate a brat sticker",
  "!sticker | !s - turn quoted media into a sticker",
  "!sticker <image_url> | !s <image_url> - make sticker from image URL",
  "!sticker temp | !s temp - delete source + sticker after 10s",
  "!sticker temp <image_url> | !s temp <image_url> - temporary URL sticker",
].join("\n");

export async function handleHelpCommand(msg: Message): Promise<boolean> {
  const body = msg.body ?? "";

  if (body.toLowerCase() !== "!help") {
    return false;
  }

  await msg.reply(HELP_MESSAGE);
  return true;
}
