import { Telegraf, Markup } from "telegraf";
import { BOT_TOKEN, DITTO_GUESS_LINK } from "./config";
import { join } from "path";
import fs from "fs/promises";
import { logger } from "./logger";

const bot = new Telegraf(BOT_TOKEN);

const inlineKeyboard = Markup.inlineKeyboard([
    [Markup.button.webApp("Play Ditto Quest 👾⚔️", DITTO_GUESS_LINK)],
    [Markup.button.url("Ditto Quest Guide 📖", "https://team-ditto.notion.site/Ditto-Quest-Beginner-Guide-21359184254f803e8fcbc1c4783cd579")],
]);

async function broadcast() {
    const userIds: string[] = JSON.parse(await fs.readFile(join(__dirname, "../assets/json/test.json"), "utf-8"));
    //const userIds: string[] = JSON.parse(await fs.readFile(join(__dirname, "../assets/json/user-ids.json"), "utf-8"));
    const imagePath = join(__dirname, "../assets/promo/expedizion.jpg");
    const caption = `
<b>🎫 Ditto Pass: Expedition Season Zero is LIVE!</b>

Complete <b>5 in-game milestones</b> to earn <b>$DITTO rewards</b> — and unlock a chance at a <b>500 USDT raffle</b> <i>(plus a rumored exclusive item 👀)</i>.

<b>🏹 Milestones:</b>  
🛡 <b>Lv 50 Combat</b>  
🌾 <b>Lv 40 Farming</b>  
⚒️ <b>Lv 30 Crafting</b>  
🧬 <b>Gen 10 Slime</b>  
🤝 <b>Refer 10 friends</b>

💰 Each milestone = <b>100K $DITTO</b>  
📅 Ends Fri, 21 Jun @ 00:00 UTC

Track your progress. Claim your fate. 🗺
`

    logger.info(`Attempting to broadcast to ${userIds.length} users.`);

    const BATCH_SIZE = 20;
    let successfulCount = 0;

    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
        const batch = userIds.slice(i, i + BATCH_SIZE);

        const sendTasks = batch.map((userId) =>
            bot.telegram
                .sendPhoto(userId, { source: imagePath }, {
                    caption,
                    parse_mode: "HTML",
                    reply_markup: inlineKeyboard.reply_markup,
                })
                .then(() => {
                    logger.info(`Broadcast sent to ${userId}`);
                    successfulCount++;
                })
                .catch((err) => {
                    logger.error(`Failed to send to ${userId}: ${err}`);
                })
        );

        await Promise.allSettled(sendTasks);
    }

    logger.info(`Successfully broadcasted to ${successfulCount} users.`);

    process.exit(0);
}

broadcast();