import { Markup, Scenes, Telegraf, session } from "telegraf";
import { logger } from "../../utils/logger";
import { SceneSession } from "telegraf/typings/scenes";
import broadcastMessageScene from "../scenes/broadcast-message-scene";
import { isAdmin, replyWithError } from "../../utils/tele-bot-utils";
import { BROADCAST_MESSAGE_SCENE } from "../scenes/scenes";
import { getStartMessageHTML } from "./messages";
import { join } from "path";
import { TMA_LINK } from "../../utils/config";

interface ClickGameBotSession extends SceneSession {
    processingCallback?: boolean;
}

export interface ClickGameBotContext extends Scenes.SceneContext {
    session: ClickGameBotSession;
}

export const inlineKeyboardDefault = [
    [Markup.button.webApp('Play 🎮', TMA_LINK)],
    [
        Markup.button.url('X 🌐', 'https://x.com/dittocoin'),
        Markup.button.url('Community 👥', 'https://t.me/teamditto')
    ],
    [Markup.button.url('How to Play 📖', 'https://team-ditto.notion.site/How-to-play-8b333d0cf2c14ff6975681fa731b539b')],
    [Markup.button.url('About DITTO 📘', 'https://team-ditto.notion.site/ABOUT-DITTO-2fb550fd465b4cc08a95d359b7d5809c')],
    [Markup.button.url('Launch Event Details 🚀', 'https://team-ditto.notion.site/DITTO-LAUNCH-EVENT-f38cd9341b8e449e9fd5cbb785139be1')]
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

    // Initialize listeners for the bot
    private initListeners() {
        this.#bot.use(session());
        const stage = new Scenes.Stage<ClickGameBotContext>([broadcastMessageScene]);
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
                ctx.scene.enter(BROADCAST_MESSAGE_SCENE);
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