import { ClickGameBotContext } from "../telegram/bot/click-game-tele-bot";
import { logger } from "./logger";

export async function broadcastMessageOptimized(
    ctx: ClickGameBotContext, 
    userIds: string[], 
    message: string, 
    photo?: string
): Promise<{ success: number; failed: number }> {
    const BATCH_SIZE = 20;
    const DELAY_BETWEEN_BATCHES = 1000;
    
    let successfulCount = 0;
    let failedCount = 0;
    
    logger.info(`Starting optimized broadcast to ${userIds.length} users.`);

    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
        const batch = userIds.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(userIds.length / BATCH_SIZE);

        logger.info(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} users)`);

        const sendTasks = batch.map(async (userId) => {
            try {
                if (photo) {
                    await ctx.telegram.sendPhoto(userId, photo, { 
                        caption: message,
                        parse_mode: 'HTML'
                    });
                } else {
                    await ctx.telegram.sendMessage(userId, message, {
                        parse_mode: 'HTML'
                    });
                }
                logger.info(`Message sent to user ${userId}`);
                return { success: true, userId };
            } catch (err) {
                logger.error(`Failed to send message to user ${userId}: ${err}`);
                return { success: false, userId, error: err };
            }
        });

        const batchResults = await Promise.allSettled(sendTasks);
        
        batchResults.forEach((result) => {
            if (result.status === 'fulfilled') {
                if (result.value.success) {
                    successfulCount++;
                } else {
                    failedCount++;
                }
            } else {
                failedCount++;
                logger.error(`Batch task failed: ${result.reason}`);
            }
        });

        if (batchNumber % 5 === 0 || batchNumber === totalBatches) {
            logger.info(`Progress: ${batchNumber}/${totalBatches} batches completed. Success: ${successfulCount}, Failed: ${failedCount}`);
        }

        if (i + BATCH_SIZE < userIds.length) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
    }

    logger.info(`Broadcast completed. Successfully sent: ${successfulCount}, Failed: ${failedCount}`);
    
    return {
        success: successfulCount,
        failed: failedCount
    };
}