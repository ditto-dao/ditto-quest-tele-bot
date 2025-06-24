
import { Scenes } from "telegraf";
import { BROADCAST_TEST_MESSAGE_SCENE } from "./scenes";
import { logger } from "../../utils/logger";
import { replyWithError } from "../../utils/tele-bot-utils";
import { ClickGameBotContext } from "../bot/click-game-tele-bot";
import { join } from "path";
import { broadcastMessageOptimized } from "../../utils/broadcast-message-optimised";
import fs from "fs/promises";

const broadcastTestScene = new Scenes.BaseScene<ClickGameBotContext>(BROADCAST_TEST_MESSAGE_SCENE);

broadcastTestScene.enter(async (ctx) => {
    try {
        await ctx.reply(`🧪 TEST BROADCAST\n\nThis will only broadcast to test users.\n\nWhat message would you like to test?`);
    } catch (err) {
        logger.error(`Error in Broadcast Test Scene: ${err}`);
        replyWithError(ctx, 'An error occurred. Please try again later.');
    }
});

broadcastTestScene.on('message', async (ctx) => {
    // Exit scene immediately
    await ctx.scene.leave();
    
    try {
        if (!('message' in ctx && ctx.message)) {
            throw new Error('No message field in context');
        }

        // Load test users
        const testUserIds: string[] = JSON.parse(await fs.readFile(join(__dirname, "../../assets/json/test.json"), "utf-8"));
        
        const statusMsg = await ctx.reply(`🧪 Starting TEST broadcast to ${testUserIds.length} users...`);

        let broadcastResult: { success: number; failed: number };

        if ('text' in ctx.message) {
            broadcastResult = await broadcastMessageOptimized(ctx, testUserIds, ctx.message.text, undefined, {
                batchSize: 10,  // Smaller batches for testing
                delayBetweenBatches: 500,  // Faster for testing
                yieldEveryNBatches: 2,
                enableProgressUpdates: false  // Less logging for test
            });
        } else if ('photo' in ctx.message && ctx.message.photo.length > 0) {
            const message = ctx.message.caption || "";
            const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
            broadcastResult = await broadcastMessageOptimized(ctx, testUserIds, message, fileId, {
                batchSize: 10,
                delayBetweenBatches: 500,
                yieldEveryNBatches: 2,
                enableProgressUpdates: false
            });
        } else {
            throw new Error('Unsupported message type. Send:\n• Plain text message\n• Photo with caption\n\nNot supported: stickers, voice notes, documents, videos');
        }

        await ctx.telegram.editMessageText(
            ctx.chat!.id,
            statusMsg.message_id,
            undefined,
            `✅ TEST Broadcast Completed!\n\n` +
            `📊 Results:\n` +
            `• ✅ Successfully sent: ${broadcastResult.success}\n` +
            `• ❌ Failed: ${broadcastResult.failed}\n` +
            `• 📋 Total test users: ${testUserIds.length}\n\n` +
            `🎯 Ready for production broadcast!`
        );

    } catch (err) {
        logger.error(`Error broadcasting message in Test Scene: ${err}`);
        await replyWithError(ctx, 'An error occurred during test broadcast. Please try again.');
    }
});

broadcastTestScene.command(['exit', 'quit', 'back'], async (ctx) => {
    try {
        await ctx.reply('❌ Exiting test broadcast scene...');
        ctx.scene.leave();
    } catch (err) {
        logger.error(`Error exiting Broadcast Test Scene: ${err}`);
        replyWithError(ctx, 'An error occurred. Please try again later.');
    }
});

export default broadcastTestScene;