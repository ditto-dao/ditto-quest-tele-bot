import { Telegraf } from "telegraf";
import { ClickGameBotContext, ClickGameTeleBot } from "./src/telegram/bot/click-game-tele-bot";
import { setupGlobalErrorHandlers } from "./src/utils/global-error-handler";
import { logger } from "./src/utils/logger";
import { BOT_TOKEN } from "./src/utils/config";
import { setDefaultResultOrder } from "node:dns";
import express from "express";

async function main() {
    // Telegraf
    setDefaultResultOrder("ipv4first");
    const bot = new ClickGameTeleBot({
        bot: new Telegraf<ClickGameBotContext>(BOT_TOKEN),
    });

    // Express server for sticker API
    const app = express();
    app.use(express.json({ limit: '50mb' }));

    // Sticker pack creation endpoint
    app.post('/create-sticker-pack', async (req, res) => {
        try {
            const result = await bot.createStickerPack(req.body);

            if (result.success) {
                res.json(result);
            } else {
                res.status(500).json(result);
            }
        } catch (error: any) {
            logger.error(`Error in sticker pack endpoint: ${error.message}`);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', service: 'telegram-bot-sticker-service' });
    });

    // Start Express server
    const PORT = process.env.EXPRESS_PORT || 3001;
    app.listen(PORT, () => {
        logger.info(`Express server listening on port ${PORT}`);
    });

    // Launch Telegraf bot
    bot.launch();

    setupGlobalErrorHandlers();

    process.on('SIGINT', () => gracefulShutdown());
    process.on('SIGTERM', () => gracefulShutdown());
}

async function gracefulShutdown() {
    logger.info(`Graceful shutdown.`);
    process.exit(0);
}

main();