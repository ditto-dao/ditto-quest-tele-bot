import { Telegraf } from "telegraf";
import { ClickGameBotContext, ClickGameTeleBot } from "./src/telegram/bot/click-game-tele-bot";
import { setupGlobalErrorHandlers } from "./src/utils/global-error-handler";
import { logger } from "./src/utils/logger";
import { BOT_TOKEN } from "./src/utils/config";
import { setDefaultResultOrder } from "node:dns";

/**
 * NOTE: TELEGRAF REQUIRES NODE V18
 * 
 * Dev env: nvm use 18
 * Prod env: pm2 config already defines node v18.x
 */

async function main() {
    // Telegraf
    setDefaultResultOrder("ipv4first");
    const bot = new ClickGameTeleBot({
        bot: new Telegraf<ClickGameBotContext>(BOT_TOKEN),
    })
    bot.launch()

    setupGlobalErrorHandlers();

    process.on('SIGINT', () => gracefulShutdown());
    process.on('SIGTERM', () => gracefulShutdown());
}

async function gracefulShutdown(
) {
    logger.info(`Graceful shutdown.`);
    process.exit(0);
}

main();