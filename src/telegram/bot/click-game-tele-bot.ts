import { Markup, Scenes, Telegraf, session } from "telegraf";
import { logger } from "../../utils/logger";
import { SceneSession } from "telegraf/typings/scenes";
import broadcastMessageScene from "../scenes/broadcast-message-scene";
import { isAdmin, replyWithError } from "../../utils/tele-bot-utils";
import { BROADCAST_MESSAGE_SCENE, BROADCAST_TEST_MESSAGE_SCENE } from "../scenes/scenes";
import { getStartMessageHTML } from "./messages";
import { join } from "path";
import { DITTO_GUESS_LINK, NodeEnv, TMA_LINK_DEV, WEBHOOK_URL } from "../../utils/config";
import broadcastTestScene from "../scenes/broadcast-test-message-scene";
import { Input } from "telegraf";

interface ClickGameBotSession extends SceneSession {
    processingCallback?: boolean;
}

export interface ClickGameBotContext extends Scenes.SceneContext {
    session: ClickGameBotSession;
}

export const inlineKeyboardDefault = [
    [Markup.button.url('Play Ditto Quest 👾', "https://t.me/ditto_quest_bot/dqgame")],
    [Markup.button.url('Play Ditto Guess 🎮', DITTO_GUESS_LINK)],
    [
        Markup.button.url('X 👥', 'https://x.com/dittocoin'),
        Markup.button.url('Community 🗨', 'https://t.me/teamditto')
    ],
    [Markup.button.url('Website 📖', 'https://ditto-labs.super.site/')],
    ...(process.env.NODE_ENV !== NodeEnv.PRODUCTION
        ? [[Markup.button.webApp('🧪 DQ Dev Env', TMA_LINK_DEV)]]
        : [])
]

export type ButtonCallback = {
    method: string
    data?: string
}

export interface StickerImageData {
    buffer: string; // base64 encoded
    emoji: string;
}

export interface CreateStickerPackRequest {
    telegramId: string;
    slimeId: number;
    images: StickerImageData[];
    username?: string; // Add optional username
}

export interface CreateStickerPackResponse {
    success: boolean;
    stickerPackLink?: string;
    stickerSetName?: string;
    error?: string;
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

    // Getter to access the bot instance
    get bot() {
        return this.#bot;
    }

    // Launch the bot
    async launch() {
        logger.info('Launching Click Game Tele Bot');
        this.initListeners();
        await this.#bot.launch();
    }

    // Create sticker pack for user
    async createStickerPack(request: CreateStickerPackRequest): Promise<CreateStickerPackResponse> {
        const { telegramId, slimeId, images, username } = request;

        try {
            if (!telegramId || !images || !Array.isArray(images)) {
                throw new Error('Missing required fields: telegramId, images');
            }

            if (images.length === 0) {
                throw new Error('No images provided');
            }

            logger.info(`Creating sticker pack for user ${telegramId}, slime ${slimeId} with ${images.length} stickers`);

            const botInfo = await this.#bot.telegram.getMe();
            const stickerSetName = `slimes_${telegramId}_by_${botInfo.username}`;

            // Generate sticker pack title
            const stickerPackTitle = username
                ? `@${username}'s DQ Sticker Pack`
                : `User ${telegramId}'s DQ Sticker Pack`;

            let isNewStickerSet = false;
            const uploadedStickers: Array<{ file_id: string; emoji: string }> = [];

            // Upload all sticker files first
            logger.info(`Uploading ${images.length} sticker files...`);
            for (let i = 0; i < images.length; i++) {
                const imageData = images[i];
                const buffer = Buffer.from(imageData.buffer, 'base64');

                const file = await this.#bot.telegram.uploadStickerFile(
                    parseInt(telegramId),
                    Input.fromBuffer(buffer, `slime_${slimeId}_${i}.webp`),
                    'static'
                );

                uploadedStickers.push({
                    file_id: file.file_id,
                    emoji: imageData.emoji || '🟢'
                });

                logger.info(`Uploaded sticker ${i + 1}/${images.length}`);
            }

            // Check if sticker set exists
            let stickerSetExists = false;
            try {
                await this.getStickerSet(stickerSetName);
                stickerSetExists = true;
                logger.info(`Sticker set ${stickerSetName} exists, adding new stickers`);
            } catch (error) {
                logger.info(`Sticker set ${stickerSetName} doesn't exist, will create new one`);
            }

            if (stickerSetExists) {
                // Add all stickers to existing set
                for (let i = 0; i < uploadedStickers.length; i++) {
                    const sticker = uploadedStickers[i];

                    await this.#bot.telegram.addStickerToSet(
                        parseInt(telegramId),
                        stickerSetName,
                        {
                            sticker: {
                                sticker: sticker.file_id,
                                emoji_list: [sticker.emoji]
                            }
                        }
                    );
                    logger.info(`Added sticker ${i + 1}/${uploadedStickers.length} to existing set`);
                }
            } else {
                // Create new sticker set with all stickers
                const stickerArray = uploadedStickers.map(sticker => ({
                    sticker: sticker.file_id,
                    emoji_list: [sticker.emoji]
                }));

                await this.#bot.telegram.createNewStickerSet(
                    parseInt(telegramId),
                    stickerSetName,
                    stickerPackTitle,
                    {
                        stickers: stickerArray,
                        sticker_format: 'static'
                    }
                );
                isNewStickerSet = true;
                logger.info(`Created new sticker set "${stickerPackTitle}" with ${uploadedStickers.length} stickers`);
            }

            // Set thumbnail for the sticker pack (new or existing)
            try {
                const thumbnailPath = join(__dirname, '../../assets/dq-sticker-thumbnail.png');
                await this.#bot.telegram.setStickerSetThumbnail(
                    stickerSetName,
                    parseInt(telegramId),
                    Input.fromLocalFile(thumbnailPath)
                );
                logger.info(`Set thumbnail for sticker pack ${stickerSetName}`);
            } catch (error: any) {
                logger.warn(`Failed to set thumbnail for sticker pack: ${error.message}`);
            }

            const stickerPackLink = `t.me/addstickers/${stickerSetName}`;
            logger.info(`Sticker pack operation completed: ${stickerPackLink}`);

            // Send message to user with the sticker pack link
            try {
                const stickerCount = uploadedStickers.length;
                const message = isNewStickerSet
                    ? `🎉 Your DQ Sticker Pack has been created with ${stickerCount} slime stickers!\n\n📦 Tap the button below to add them to Telegram:`
                    : `✨ Added ${stickerCount} new stickers to your DQ Sticker Pack!\n\nIf you have already added the sticker pack, you need to remove it first before downloading the updated one.\n\n📦 Check out your updated collection:`;

                await this.#bot.telegram.sendMessage(
                    parseInt(telegramId),
                    message,
                    {
                        reply_markup: {
                            inline_keyboard: [[
                                Markup.button.url('Add Sticker Pack 📦', stickerPackLink)
                            ]]
                        }
                    }
                );
                logger.info(`Sent sticker pack message to user ${telegramId}`);
            } catch (error: any) {
                logger.error(`Failed to send sticker pack message to user: ${error.message}`);
            }

            return {
                success: true
            };

        } catch (error: any) {
            logger.error(`Error creating sticker pack: ${error.message}`);

            // Send error message to user
            try {
                await this.#bot.telegram.sendMessage(
                    parseInt(telegramId),
                    `❌ Failed to create your sticker pack. Please try again later.\n\nError: ${error.message}`
                );
            } catch (msgError: any) {
                logger.error(`Failed to send error message to user: ${msgError.message}`);
            }

            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get sticker set info
    async getStickerSet(stickerSetName: string) {
        try {
            return await this.#bot.telegram.getStickerSet(stickerSetName);
        } catch (error: any) {
            logger.error(`Error getting sticker set ${stickerSetName}: ${error.message}`);
            throw error;
        }
    }

    // Check if user has a sticker pack
    async getUserStickerPackExists(telegramId: string): Promise<boolean> {
        try {
            const botInfo = await this.#bot.telegram.getMe();
            const stickerSetName = `slimes_${telegramId}_by_${botInfo.username}`;
            await this.getStickerSet(stickerSetName);
            return true;
        } catch (error) {
            return false;
        }
    }

    // Set sticker pack thumbnail (for existing sets)
    async setStickerPackThumbnail(telegramId: string): Promise<void> {
        try {
            const botInfo = await this.#bot.telegram.getMe();
            const stickerSetName = `slimes_${telegramId}_by_${botInfo.username}`;
            const thumbnailPath = join(__dirname, '../../assets/dq-sticker-thumbnail.png');

            await this.#bot.telegram.setStickerSetThumbnail(
                stickerSetName,
                parseInt(telegramId),
                Input.fromLocalFile(thumbnailPath)
            );

            logger.info(`Set thumbnail for sticker pack ${stickerSetName}`);
        } catch (error: any) {
            logger.error(`Error setting sticker pack thumbnail: ${error.message}`);
            throw error;
        }
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

        this.#bot.on('message', async ctx => {
            const msg = ctx.message as any;
            if (msg.successful_payment) {
                try {
                    const payment = msg.successful_payment;
                    const payload = JSON.parse(payment.invoice_payload);
                    const { userId, shopItemId, quantity } = payload;

                    logger.info(`💫 [Bot] Payment received from user ${userId}: ${quantity}x shop item ${shopItemId}`);

                    // Send POST to Stars payment webhook
                    const res = await fetch(WEBHOOK_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ message: { successful_payment: payment } }),
                        signal: AbortSignal.timeout(4000)
                    });

                    if (!res.ok) {
                        throw new Error(`Failed to POST payment to webhook: ${res.status} ${res.statusText}`);
                    }

                    logger.info(`📡 [Bot] Forwarded payment to webhook successfully`);
                } catch (err) {
                    logger.error(`❌ [Bot] Failed to process payment: ${err}`);
                }
            }
        });

        this.#bot.on('pre_checkout_query', async ctx => {
            const query = ctx.preCheckoutQuery;
            const id = query.id;
            try {
                logger.info(`🔍 [Bot] Received pre-checkout query: ${id}`);
                await ctx.answerPreCheckoutQuery(true);
                logger.info(`✅ [Bot] Approved pre-checkout query: ${id}`);
            } catch (err) {
                logger.error(`❌ [Bot] Failed to answer pre-checkout query: ${err}`);
                await ctx.answerPreCheckoutQuery(false, 'Something went wrong. Please try again later.');
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