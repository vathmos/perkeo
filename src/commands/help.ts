import type { Message } from "whatsapp-web.js";

const HELP_MESSAGE = [
  "Available commands:",
  "!help - show this help message",
  "!ping - check bot status",
  "!brat <text> - generate a brat sticker",
  "!sticker | !s - turn quoted media into a sticker",
  "!sticker temp | !s temp - delete source + sticker after 10s",
].join("\n");

export async function handleHelpCommand(msg: Message): Promise<boolean> {
  const body = msg.body ?? "";

  if (body.toLowerCase() !== "!help") {
    return false;
  }

  await msg.reply(HELP_MESSAGE);
  return true;
}
