import { Scenes } from "telegraf";
import { BROADCAST_TEST_MESSAGE_SCENE } from "./scenes";
import { logger } from "../../utils/logger";
import { replyWithError } from "../../utils/tele-bot-utils";
import { ClickGameBotContext } from "../bot/click-game-tele-bot";
import { join } from "path";
import fs from "fs/promises";
import { broadcastMessageOptimized } from "../../utils/broadcast-message-optimised";

const broadcastTestScene = new Scenes.BaseScene<ClickGameBotContext>(BROADCAST_TEST_MESSAGE_SCENE);

broadcastTestScene.enter(async (ctx) => {
    try {
        await ctx.reply(`🧪 TEST BROADCAST\n\nWhat message would you like to broadcast to TEST users only?`);
    } catch (err) {
        logger.error(`Error in Broadcast Test Scene: ${err}`);
        replyWithError(ctx, 'An error occurred. Please try again later.');
    }
});

broadcastTestScene.on('message', async (ctx) => {
    try {
        if (!('message' in ctx && ctx.message)) {
            throw new Error('No message field in context');
        }

        // TEST - Use test users only
        const userIds: string[] = JSON.parse(await fs.readFile(join(__dirname, "../../assets/json/test.json"), "utf-8"));

        // Send initial status message
        const statusMsg = await ctx.reply(`🚀 Starting TEST broadcast to ${userIds.length} users...`);

        let broadcastResult: { success: number; failed: number };

        if ('text' in ctx.message) {
            broadcastResult = await broadcastMessageOptimized(ctx, userIds, ctx.message.text);
        } else if ('photo' in ctx.message && ctx.message.photo.length > 0) {
            const message = ctx.message.caption || "";
            const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
            broadcastResult = await broadcastMessageOptimized(ctx, userIds, message, fileId);
        } else {
            throw new Error('Unsupported broadcast message. Send text only OR single image AND caption');
        }

        // Update status with final results
        await ctx.telegram.editMessageText(
            ctx.chat!.id,
            statusMsg.message_id,
            undefined,
            `✅ TEST Broadcast completed!\n\n` +
            `📊 Results:\n` +
            `• Successfully sent: ${broadcastResult.success}\n` +
            `• Failed: ${broadcastResult.failed}\n` +
            `• Total users: ${userIds.length}`
        );

    } catch (err) {
        logger.error(`Error broadcasting message in Broadcast Test Scene: ${err}`);
        replyWithError(ctx, 'An error occurred during test broadcast. Please try again later.');
    } finally {
        ctx.scene.leave();
        logger.info(`Leacing broadcast test scene`);
    }
});

broadcastTestScene.command(['exit', 'quit', 'back'], async (ctx) => {
    try {
        await ctx.reply('Exiting test broadcast scene...');
        ctx.scene.leave();
    } catch (err) {
        logger.error(`Error exiting Broadcast Test Scene: ${err}`);
        replyWithError(ctx, 'An error occurred. Please try again later.');
    }
});

export default broadcastTestScene;