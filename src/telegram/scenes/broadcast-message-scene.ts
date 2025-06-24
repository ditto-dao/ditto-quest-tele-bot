import { Scenes } from "telegraf";
import { BROADCAST_MESSAGE_SCENE } from "./scenes";
import { logger } from "../../utils/logger";
import { replyWithError } from "../../utils/tele-bot-utils";
import { ClickGameBotContext } from "../bot/click-game-tele-bot";
import { join } from "path";
import { smartBroadcast } from "../../utils/broadcast-message-optimised";

const broadcastMessageScene = new Scenes.BaseScene<ClickGameBotContext>(BROADCAST_MESSAGE_SCENE);

broadcastMessageScene.enter(async (ctx) => {
    try {
        await ctx.reply(`📢 PRODUCTION BROADCAST\n\n⚠️ This will broadcast to ALL users!\n\nWhat message would you like to broadcast?`);
    } catch (err) {
        logger.error(`Error in Broadcast Message Scene: ${err}`);
        replyWithError(ctx, 'An error occurred. Please try again later.');
    }
});

broadcastMessageScene.on('message', async (ctx) => {
    // Exit scene immediately to prevent multiple messages
    await ctx.scene.leave();
    
    try {
        if (!('message' in ctx && ctx.message)) {
            throw new Error('No message field in context');
        }

        const userFilePath = join(__dirname, "../../assets/json/user-ids.json");
        
        // Send initial status message
        const statusMsg = await ctx.reply(`🚀 Starting PRODUCTION broadcast...\n\n⏳ Analyzing user list and selecting optimal method...`);

        let broadcastResult: { success: number; failed: number };

        if ('text' in ctx.message) {
            // Auto-detect best method based on user count
            broadcastResult = await smartBroadcast(ctx, userFilePath, ctx.message.text);
        } else if ('photo' in ctx.message && ctx.message.photo.length > 0) {
            const message = ctx.message.caption || "";
            const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
            broadcastResult = await smartBroadcast(ctx, userFilePath, message, fileId);
        } else {
            throw new Error('Unsupported message type. Send:\n• Plain text message\n• Photo with caption\n\nNot supported: stickers, voice notes, documents, videos');
        }

        // Update with final results
        await ctx.telegram.editMessageText(
            ctx.chat!.id,
            statusMsg.message_id,
            undefined,
            `✅ PRODUCTION Broadcast Completed!\n\n` +
            `📊 Final Results:\n` +
            `• ✅ Successfully sent: ${broadcastResult.success.toLocaleString()}\n` +
            `• ❌ Failed: ${broadcastResult.failed.toLocaleString()}\n` +
            `• 📈 Success rate: ${((broadcastResult.success / (broadcastResult.success + broadcastResult.failed)) * 100).toFixed(1)}%\n\n` +
            `🎯 Broadcast completed using optimized delivery system.`
        );

    } catch (err) {
        logger.error(`Error broadcasting message in Production Scene: ${err}`);
        await replyWithError(ctx, 'An error occurred during production broadcast. Please check logs and try again.');
    }
});

broadcastMessageScene.command(['exit', 'quit', 'back'], async (ctx) => {
    try {
        await ctx.reply('❌ Exiting production broadcast scene...');
        ctx.scene.leave();
    } catch (err) {
        logger.error(`Error exiting Broadcast Message Scene: ${err}`);
        replyWithError(ctx, 'An error occurred. Please try again later.');
    }
});

export default broadcastMessageScene;