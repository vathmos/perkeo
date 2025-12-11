import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { CanvasRenderingContext2D, createCanvas, registerFont } from "canvas";

registerFont("./arialnarrow.ttf", { family: "arialnarrow" });

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  }
});

client.on("qr", (qr: string) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Perkeo Bot is online.");
});

client.on("message", async (msg) => {
  try {
    const body = msg.body ?? "";

    if (body.toLowerCase().startsWith("!brat")) {
      const text = body.slice(5).trim();
      if (!text) {
        await msg.reply("Usage: !brat <text>");
        return;
      }

      const buffer = await generateBratImage(text);
      const media = new MessageMedia("image/png", buffer.toString("base64"));

      await client.sendMessage(msg.from, media, {
        sendMediaAsSticker: true,
        stickerAuthor: "of Heidelberg",
        stickerName: "Perkeo Bot",
      });
      return;
    }

    const isStickerCommand = body.toLowerCase() === "!sticker";

    if (isStickerCommand) {
      let targetMsg = msg;
      if (msg.hasQuotedMsg) {
        targetMsg = await msg.getQuotedMessage();
      }

      if (targetMsg.hasMedia) {
        const media = await targetMsg.downloadMedia();
        await client.sendMessage(msg.from, media, {
          sendMediaAsSticker: true,
          stickerAuthor: "Perkeo Bot",
          stickerName: "Sticker",
        });
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
});

client.initialize();

/**
 * Generates the Brat-styled image with specific justification and blur
 */
async function generateBratImage(text: string): Promise<Buffer> {
  const width = 480;
  const height = 480;

  const scaleFactor = 0.5;
  const smallWidth = width * scaleFactor;
  const smallHeight = height * scaleFactor;

  const canvas = createCanvas(smallWidth, smallHeight);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, smallWidth, smallHeight);

  const fontSize = Math.floor(65 * scaleFactor);
  ctx.fillStyle = "#000000";
  ctx.font = `bold ${fontSize}px arialnarrow`;
  ctx.textBaseline = "middle";

  const margin = 30 * scaleFactor;
  const maxWidth = smallWidth - margin * 2;
  const lines = wrapText(ctx, text, maxWidth);

  const lineHeight = fontSize * 1.1;
  const totalHeight = lines.length * lineHeight;
  let currentY = (smallHeight - totalHeight) / 2 + lineHeight / 2;

  lines.forEach((line, i) => {
    const words = line.split(" ");

    if (i === lines.length - 1 || words.length <= 1) {
      ctx.textAlign = "left";
      ctx.fillText(line, margin, currentY);
    } else {
      const totalWordsWidth = words.reduce(
        (sum, word) => sum + ctx.measureText(word).width,
        0,
      );
      const extraSpace = (maxWidth - totalWordsWidth) / (words.length - 1);

      let currentX = margin;
      ctx.textAlign = "left";
      words.forEach((word) => {
        ctx.fillText(word, currentX, currentY);
        currentX += ctx.measureText(word).width + extraSpace;
      });
    }
    currentY += lineHeight;
  });

  const finalCanvas = createCanvas(width, height);
  const finalCtx = finalCanvas.getContext("2d");
  finalCtx.imageSmoothingEnabled = true;
  finalCtx.drawImage(canvas, 0, 0, width, height);

  return finalCanvas.toBuffer("image/png");
}

/**
 * Helper to wrap text into an array of lines
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}
