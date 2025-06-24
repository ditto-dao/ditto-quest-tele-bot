import { Markup, Scenes, Telegraf, session } from "telegraf";
import { logger } from "../../utils/logger";
import { SceneSession } from "telegraf/typings/scenes";
import broadcastMessageScene from "../scenes/broadcast-message-scene";
import { isAdmin, replyWithError } from "../../utils/tele-bot-utils";
import { BROADCAST_MESSAGE_SCENE, BROADCAST_TEST_MESSAGE_SCENE } from "../scenes/scenes";
import { getStartMessageHTML } from "./messages";
import { join } from "path";
import { DITTO_QUEST_LINK, TMA_LINK } from "../../utils/config";
import broadcastTestScene from "../scenes/broadcast-test-message-scene";

interface ClickGameBotSession extends SceneSession {
    processingCallback?: boolean;
}

export interface ClickGameBotContext extends Scenes.SceneContext {
    session: ClickGameBotSession;
}

export const inlineKeyboardDefault = [
    [Markup.button.webApp('Game 1: Ditto Guess 🎮', TMA_LINK)],
    [Markup.button.url('Game 2: Ditto Quest 👾', DITTO_QUEST_LINK)],
    [
        Markup.button.url('X 👥', 'https://x.com/dittocoin'),
        Markup.button.url('Community 🗨', 'https://t.me/teamditto')
    ],
    [Markup.button.url('Website 📖', 'https://ditto-labs.super.site/')],
]

export type ButtonCallback = {
    method: string
    data?: string
}

export class ClickGameTeleBot {
    #bot: Telegraf<ClickGameBotContext>;

    constructor({
        bot,
    }: {
        bot: Telegraf<ClickGameBotContext>;
    }) {
        this.#bot = bot;
    }

    // Launch the bot
    async launch() {
        logger.info('Launching Click Game Tele Bot');
        this.initListeners();
        await this.#bot.launch();
    }

    private initListeners() {
        this.#bot.use(session());

        // Add both scenes to the stage
        const stage = new Scenes.Stage<ClickGameBotContext>([
            broadcastMessageScene,
            broadcastTestScene
        ]);
        this.#bot.use(stage.middleware());

        // On start command
        this.#bot.start(async ctx => {
            const bannerImagePath = join(__dirname, '../../assets/banner.png');
            await ctx.replyWithPhoto(
                { source: bannerImagePath },
                {
                    caption: getStartMessageHTML(ctx),
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: inlineKeyboardDefault
                    }
                }
            );
        });

        this.#bot.command('broadcast', async ctx => {
            if (isAdmin(ctx)) {
                logger.info(`Entering broadcast scene.`);
                ctx.scene.enter(BROADCAST_MESSAGE_SCENE);
            }
        });

        this.#bot.command('broadcasttest', async ctx => {
            if (isAdmin(ctx)) {
                logger.info(`Entering broadcast test scene.`);
                ctx.scene.enter(BROADCAST_TEST_MESSAGE_SCENE);
            }
        });

        this.#bot.catch(async (err, ctx) => {
            const parsedErr = err as Error;
            logger.error(`[Bot Error] ${parsedErr.message}`);
            logger.trace(parsedErr.stack);
            await replyWithError(ctx, 'Something went wrong.');
        });

        // Handle bot termination signals
        process.once('SIGINT', () => this.#bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.#bot.stop('SIGTERM'));
    }

}