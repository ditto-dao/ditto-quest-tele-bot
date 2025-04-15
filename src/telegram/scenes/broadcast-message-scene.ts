import { Scenes } from "telegraf";
import { BROADCAST_MESSAGE_SCENE } from "./scenes";
import { logger } from "../../utils/logger";
import { replyWithError } from "../../utils/tele-bot-utils";
import { ClickGameBotContext } from "../bot/click-game-tele-bot";
import { getAllUserIdsFromRedis } from "../../redis/users";

const broadcastMessageScene = new Scenes.BaseScene<ClickGameBotContext>(BROADCAST_MESSAGE_SCENE);

broadcastMessageScene.enter(async (ctx) => {
    try {
        await ctx.reply(`What is the message you would like to broadcast?`);
    } catch (err) {
        logger.error(`Error in Broadcast Message Scene: ${err}`);
        replyWithError(ctx, 'An error occurred. Please try again later.');
    }
});

broadcastMessageScene.on('message', async (ctx) => {
    try {
        if (!('message' in ctx && ctx.message)) {
            throw new Error('No message field in context');
        }

        const userIds = await getAllUserIdsFromRedis();

        if ('text' in ctx.message) {
            await broadCastMessage(ctx, userIds, ctx.message.text);
            replyWithError(ctx, 'Message successfully broadcasted.');
        } else if ('photo' in ctx.message && ctx.message.photo.length > 0) {
            const message = ctx.message.caption || "";
            const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
            await broadCastMessage(ctx, userIds, message, fileId);
            replyWithError(ctx, 'Message successfully broadcasted.');
        } else {
            throw new Error('Unsupported broadcast message. Send text only OR single image AND caption');
        }
    } catch (err) {
        logger.error(`Error broadcasting message in Broadcast Message Scene: ${err}`);
        replyWithError(ctx, 'An error occurred. Please try again later.');
    } finally {
        ctx.scene.leave();
    }
});

broadcastMessageScene.command('exit', async (ctx) => {
    try {
        ctx.scene.leave();
    } catch (err) {
        logger.error(`Error exiting Broadcast Message Scene: ${err}`);
        replyWithError(ctx, 'An error occurred. Please try again later.');
    }
});

broadcastMessageScene.command('quit', async (ctx) => {
    try {
        ctx.scene.leave();
    } catch (err) {
        logger.error(`Error exiting Broadcast Message Scene: ${err}`);
        replyWithError(ctx, 'An error occurred. Please try again later.');
    }
});

broadcastMessageScene.command('back', async (ctx) => {
    try {
        ctx.scene.leave();
    } catch (err) {
        logger.error(`Error exiting Broadcast Message Scene: ${err}`);
        replyWithError(ctx, 'An error occurred. Please try again later.');
    }
});

async function broadCastMessage(ctx: ClickGameBotContext, users: string[], message: string, photo?: string) {
    try {
        const promises = users.map(async (userId) => {
            try {
                if (photo) {
                    await ctx.telegram.sendPhoto(userId, photo, { caption: message });
                } else {
                    await ctx.telegram.sendMessage(userId, message);
                }
                logger.info(`Message broadcasted to user ${userId}`);
            } catch (err) {
                logger.error(`Error sending message to user ${userId}: ${err}`);
            }
        });

        // Wait for all messages to be sent in parallel
        await Promise.all(promises);
    } catch (err) {
        logger.error(`Error in broadcasting messages: ${err}`);
    }
}


export default broadcastMessageScene;