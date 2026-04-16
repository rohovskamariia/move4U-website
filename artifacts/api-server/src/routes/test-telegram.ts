// GET /api/test-telegram
// Fires a test Telegram message and returns a detailed diagnostic JSON response.
// Used to verify TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are correctly configured.

import { Router, type Request, type Response } from "express";
import { testTelegram } from "../lib/telegram";
import { logger } from "../lib/logger";

const testTelegramRouter = Router();

testTelegramRouter.get("/test-telegram", async (_req: Request, res: Response) => {
  const botTokenPresent = !!process.env["TELEGRAM_BOT_TOKEN"];
  const chatIdPresent   = !!process.env["TELEGRAM_CHAT_ID"];
  const chatIdValue     = process.env["TELEGRAM_CHAT_ID"] ?? null;

  logger.info(
    { botTokenPresent, chatIdPresent, chatIdValue },
    "test-telegram: endpoint called",
  );

  const result = await testTelegram();

  res.status(result.ok ? 200 : 500).json({
    success:          result.ok,
    botTokenPresent,
    chatIdPresent,
    chatIdValue,
    messageId:        result.messageId,
    telegramResponse: result.responseBody ? (() => {
      try { return JSON.parse(result.responseBody!) as unknown; }
      catch { return result.responseBody; }
    })() : null,
    error:            result.error,
    hint: !botTokenPresent
      ? "Add TELEGRAM_BOT_TOKEN to your environment secrets"
      : !chatIdPresent
        ? "Add TELEGRAM_CHAT_ID to your environment secrets"
        : result.ok
          ? "All good — message sent successfully"
          : "Credentials present but Telegram API returned an error — see telegramResponse for details",
  });
});

export default testTelegramRouter;
