import { Context } from "telegraf"
import { logger } from "./logger"
import { ADMIN_IDS } from "./config"

export async function replyWithError(ctx: Context, message: string): Promise<number | undefined> {
    try {
        const msg = await ctx.reply(message)
        return msg.message_id
    } catch (err) {
        const parsedErr = err as Error
        logger.error(`Error sending reply: ${parsedErr}`)
    }
}

export function isAdmin(ctx: Context): boolean {
    if (ctx.chat && ctx.chat.id) {
        return ADMIN_IDS.includes(ctx.chat.id.toString());
    } else {
        return false;
    }
}