# Perkeo WhatsApp Bot

A WhatsApp bot built on `whatsapp-web.js` that generates stickers and a Brat-style text sticker.

## Features
- `!brat <text>` generates a Brat-style sticker.
- `!sticker` or `!s` turns quoted media into a sticker.
- `!sticker <image_url>` or `!s <image_url>` turns an image link into a sticker.
- `!sticker temp` or `!s temp` deletes the source media and the sticker after 10 seconds.
- `!sticker temp <image_url>` or `!s temp <image_url>` sends a temporary sticker from an image link.
- `!help` lists available commands.
- `!ping` replies with `The fool lives!`.

## Commands
- `!help`
- `!ping`
- `!brat <text>`
- `!sticker`
- `!s`
- `!sticker <image_url>`
- `!s <image_url>`
- `!sticker temp`
- `!s temp`
- `!sticker temp <image_url>`
- `!s temp <image_url>`

## Setup

Install dependencies:
```bash
bun install
```

Create `.env` from the example:
```bash
cp .env.example .env
```

Then set:
- `FFMPEG_PATH` - full path to `ffmpeg`
- `FFPROBE_PATH` - full path to `ffprobe`
- `PUPPETEER_EXECUTABLE_PATH` - full path to your Chrome/Chromium binary

Example:
```bash
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
```

Run the bot:
```bash
bun run start
```

## Project Structure
- `src/index.ts` entrypoint
- `src/bot` WhatsApp client setup and wiring
- `src/commands` command handlers
- `assets/fonts` font assets

## Notes
- The bot must be an admin in a group to delete other users' messages.
- Temporary deletes are best-effort and may not succeed if WhatsApp blocks revoke.
