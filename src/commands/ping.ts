import type { Message } from "whatsapp-web.js";

export async function handlePingCommand(msg: Message): Promise<boolean> {
  const body = msg.body ?? "";

  if (body.toLowerCase() !== "!ping") {
    return false;
  }

  await msg.reply("The fool lives!");
  return true;
}
