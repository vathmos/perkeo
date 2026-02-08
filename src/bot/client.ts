import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import ffmpeg from "fluent-ffmpeg";
import { handleBratCommand } from "../commands/brat";
import { handleStickerCommand } from "../commands/sticker";

ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH!);
ffmpeg.setFfprobePath(process.env.FFPROBE_PATH!);

export function createClient(): Client {
  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    },
  });

  client.on("qr", (qr: string) => {
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    console.log("Perkeo Bot is online.");
  });

  client.on("message", async (msg) => {
    try {
      const handledBrat = await handleBratCommand(msg, client);
      if (handledBrat) {
        return;
      }

      await handleStickerCommand(msg, client);
    } catch (err) {
      console.error("Error:", err);
    }
  });

  return client;
}
