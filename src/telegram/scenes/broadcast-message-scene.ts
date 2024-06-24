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
        if (!('message' in ctx && ctx.message && 'text' in ctx.message)) {
            throw new Error('No message field in context');
        }
        const userIds = await getAllUserIdsFromRedis();
        await broadCastMessage(ctx, userIds, ctx.message.text);
        replyWithError(ctx, 'Message successfully broadcasted.');
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

async function broadCastMessage(ctx: ClickGameBotContext, users: string[], message: string) {
    for (const userId of users) {
        try {
            await ctx.telegram.sendMessage(userId, message);
            logger.info(`Message broadcasted to user ${userId}`);
        } catch (err) {
            logger.error(`Error sending message to user ${userId}: ${err}`);
        }
    }
}

export default broadcastMessageScene;