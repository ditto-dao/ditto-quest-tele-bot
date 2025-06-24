import { ClickGameBotContext } from "../telegram/bot/click-game-tele-bot";
import { logger } from "./logger";
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

interface BroadcastResult {
    success: number;
    failed: number;
}

interface BroadcastOptions {
    batchSize?: number;
    delayBetweenBatches?: number;
    yieldEveryNBatches?: number;
    enableProgressUpdates?: boolean;
}

// Main optimized broadcast function
export async function broadcastMessageOptimized(
    ctx: ClickGameBotContext, 
    userIds: string[], 
    message: string, 
    photo?: string,
    options: BroadcastOptions = {}
): Promise<BroadcastResult> {
    const {
        batchSize = 20,
        delayBetweenBatches = 1000,
        yieldEveryNBatches = 5,
        enableProgressUpdates = true
    } = options;
    
    let successfulCount = 0;
    let failedCount = 0;
    const totalUsers = userIds.length;
    
    logger.info(`Starting optimized broadcast to ${totalUsers} users (batch size: ${batchSize})`);

    // Process in batches
    for (let i = 0; i < totalUsers; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(totalUsers / batchSize);

        // Process current batch
        const batchResult = await processBatch(ctx, batch, message, photo, batchNumber);
        successfulCount += batchResult.success;
        failedCount += batchResult.failed;

        // Progress logging
        if (enableProgressUpdates && (batchNumber % 10 === 0 || batchNumber === totalBatches)) {
            logger.info(`Progress: ${batchNumber}/${totalBatches} batches. Success: ${successfulCount}, Failed: ${failedCount}`);
        }

        // Yield control to event loop periodically (CRITICAL for responsiveness)
        if (batchNumber % yieldEveryNBatches === 0) {
            await new Promise(resolve => setImmediate(resolve));
        }

        // Rate limiting delay (except for last batch)
        if (i + batchSize < totalUsers) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
    }

    logger.info(`Broadcast completed. Total success: ${successfulCount}, Total failed: ${failedCount}`);
    return { success: successfulCount, failed: failedCount };
}

// Streaming version for very large user lists (100k+)
export async function broadcastMessageStreaming(
    ctx: ClickGameBotContext,
    userFilePath: string,
    message: string,
    photo?: string,
    options: BroadcastOptions = {}
): Promise<BroadcastResult> {
    const {
        batchSize = 20,
        delayBetweenBatches = 1000,
        yieldEveryNBatches = 5,
        enableProgressUpdates = true
    } = options;
    
    let successfulCount = 0;
    let failedCount = 0;
    let currentBatch: string[] = [];
    let batchNumber = 0;
    let totalProcessed = 0;
    
    logger.info(`Starting streaming broadcast from ${userFilePath}`);

    try {
        for await (const userId of streamUserIds(userFilePath)) {
            currentBatch.push(userId);
            totalProcessed++;
            
            // Process when batch is full
            if (currentBatch.length >= batchSize) {
                batchNumber++;
                const batchResult = await processBatch(ctx, currentBatch, message, photo, batchNumber);
                successfulCount += batchResult.success;
                failedCount += batchResult.failed;
                
                // Progress update
                if (enableProgressUpdates && batchNumber % 10 === 0) {
                    logger.info(`Processed ${totalProcessed} users in ${batchNumber} batches. Success: ${successfulCount}, Failed: ${failedCount}`);
                }
                
                // Reset batch
                currentBatch = [];
                
                // Yield control periodically (CRITICAL)
                if (batchNumber % yieldEveryNBatches === 0) {
                    await new Promise(resolve => setImmediate(resolve));
                }
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }
        
        // Process remaining users
        if (currentBatch.length > 0) {
            batchNumber++;
            const batchResult = await processBatch(ctx, currentBatch, message, photo, batchNumber);
            successfulCount += batchResult.success;
            failedCount += batchResult.failed;
        }
        
    } catch (error) {
        logger.error(`Error in streaming broadcast: ${error}`);
        throw error;
    }

    logger.info(`Streaming broadcast completed. Total: ${totalProcessed} users, Success: ${successfulCount}, Failed: ${failedCount}`);
    return { success: successfulCount, failed: failedCount };
}

// Process a single batch of users
async function processBatch(
    ctx: ClickGameBotContext,
    batch: string[],
    message: string,
    photo: string | undefined,
    batchNumber: number
): Promise<BroadcastResult> {
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
            return { success: true, userId };
        } catch (err) {
            logger.error(`Failed to send to user ${userId}: ${err}`);
            return { success: false, userId, error: err };
        }
    });

    const results = await Promise.allSettled(sendTasks);
    
    let success = 0;
    let failed = 0;
    
    results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.success) {
            success++;
        } else {
            failed++;
        }
    });

    return { success, failed };
}

// Stream user IDs from file to avoid loading all into memory
async function* streamUserIds(filePath: string): AsyncGenerator<string, void, unknown> {
    const fileStream = createReadStream(filePath, { encoding: 'utf8' });
    const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let buffer = '';
    let inArray = false;
    
    for await (const line of rl) {
        buffer += line.trim();
        
        // Start reading when we find the opening bracket
        if (!inArray && buffer.includes('[')) {
            inArray = true;
            buffer = buffer.substring(buffer.indexOf('[') + 1);
        }
        
        if (inArray) {
            // Extract user IDs using regex
            const userIdMatches = buffer.match(/"(\d+)"/g);
            if (userIdMatches) {
                for (const match of userIdMatches) {
                    const userId = match.replace(/"/g, '');
                    if (userId && /^\d+$/.test(userId)) {
                        yield userId;
                    }
                }
                // Remove processed matches from buffer
                buffer = buffer.replace(/"(\d+)",?\s*/g, '');
            }
        }
        
        // Stop when we reach the end of the array
        if (buffer.includes(']')) {
            break;
        }
    }
}

// Auto-detect best broadcast method based on user count
export async function smartBroadcast(
    ctx: ClickGameBotContext,
    userFilePath: string,
    message: string,
    photo?: string
): Promise<BroadcastResult> {
    // Quick user count estimation
    const userCount = await estimateUserCount(userFilePath);
    
    if (userCount <= 50000) {
        // Load into memory for smaller lists
        logger.info(`Using memory-based broadcast for ${userCount} users`);
        const fs = await import('fs/promises');
        const userIds: string[] = JSON.parse(await fs.readFile(userFilePath, "utf-8"));
        return broadcastMessageOptimized(ctx, userIds, message, photo, {
            yieldEveryNBatches: 3,  // More frequent yielding for responsiveness
            enableProgressUpdates: true
        });
    } else {
        // Use streaming for larger lists
        logger.info(`Using streaming broadcast for ${userCount}+ users`);
        return broadcastMessageStreaming(ctx, userFilePath, message, photo, {
            batchSize: 15,  // Smaller batches for very large lists
            yieldEveryNBatches: 3,
            enableProgressUpdates: true
        });
    }
}

// Quick estimation of user count without loading full file
async function estimateUserCount(filePath: string): Promise<number> {
    try {
        const fs = await import('fs');
        const stats = fs.statSync(filePath);
        const fileSizeBytes = stats.size;
        
        // Rough estimation: each user ID is about 15-20 characters in JSON
        // ["1234567890",] = ~15 chars
        const estimatedUsers = Math.floor(fileSizeBytes / 15);
        
        logger.info(`Estimated ${estimatedUsers} users based on file size (${fileSizeBytes} bytes)`);
        return estimatedUsers;
    } catch (error) {
        logger.error(`Error estimating user count: ${error}`);
        return 0;
    }
}