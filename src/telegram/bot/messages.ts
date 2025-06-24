import { Context } from 'telegraf';

export function getStartMessageHTML(ctx: Context) {
    const username = ctx.chat?.type === 'private' && 'username' in ctx.chat ? ctx.chat.username : 'there';

    return `
<b>Hi @${username || 'there'}!</b> 👋

Welcome to <b>Ditto Games Ecosystem</b> — a growing world of Telegram games powered by $DITTO.

🎮 <b>Ditto Guess</b>  
Tap ➕ and ➖ to complete combos and push the global counter.  
Try <b>Guess</b> & <b>Leverage</b> modes to multiply your $DITTO.

🧪 <b>Ditto Quest Idle RPG</b>  
Battle monsters, craft gear, and breed your slime in this idle RPG adventure 👾⚔️

<i>Ditto can be whatever. You can be ANYTHING! 🚀✨</i>
    `;
}