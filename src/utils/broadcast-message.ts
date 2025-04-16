import { Telegraf, Markup } from "telegraf";
import { BOT_TOKEN, DITTO_QUEST_LINK } from "./config";
import { getAllUserIdsFromRedis } from "../redis/users";
import { join } from "path";

const bot = new Telegraf(BOT_TOKEN);

const inlineKeyboard = Markup.inlineKeyboard([
    [Markup.button.url("Play Ditto Quest 👾⚔️", DITTO_QUEST_LINK)],
    [Markup.button.url("Ditto Quest Guide 📖", "https://team-ditto.notion.site/Ditto-Quest-Beginner-Guide-1d759184254f806cbbeafabba0734ddc")],
]);

async function broadcast() {
    // const userIds = await getAllUserIdsFromRedis();
    const userIds = ["138050881", "34860195", "6712681725"];
    const imagePath = join(__dirname, "../assets/dq-promo-banner-crop.png"); // Update path as needed
    const caption = `
<b>🚨 DITTO QUEST BETA IS LIVE 🚨</b>  

The portal has opened. The Beta era begins.

Welcome to <b>Ditto Quest</b> — an idle/AFK RPG where you’ll <b>farm</b>, <b>craft</b>, <b>breed slimes</b>, <b>battle monsters</b>, and earn <b>$DITTO</b>… even while offline. 💰

🧪 <b>This is an open Beta testing phase — available to everyone!</b>  
Play, explore, and help us polish the game for official release (coming soon with the $DITTO token launch).

<b>🎯 What’s live in Beta:</b>  
⛏ Farming  
🛠 Crafting  
🐣 Breeding  
⚔ Combat (Domains)  
💸 Gacha pulls  
… and of course, $DITTO accumulation.

🐞 <b>Spotted a bug or got a suggestion?</b>  
Report bugs, win rewards, and help shape the Dittoverse.

<i>Ditto can be whatever. You can be ANYTHING!</i>  
`

    console.log(`Attempting to broadcast to ${userIds.length} users.`);

    const sendTasks = userIds.map((userId) =>
        bot.telegram
            .sendPhoto(userId, { source: imagePath }, {
                caption,
                parse_mode: "HTML",
                reply_markup: inlineKeyboard.reply_markup,
            })
            .then(() => {
                console.log(`Broadcast sent to ${userId}`);
            })
            .catch((err) => {
                console.error(`Failed to send to ${userId}: ${err}`);
            })
    );

    await Promise.allSettled(sendTasks);

    process.exit(0);
}

broadcast();