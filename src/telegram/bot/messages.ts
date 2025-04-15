import { Context } from 'telegraf';

export function getStartMessageHTML(ctx: Context) {
    const username = ctx.chat?.type === 'private' && 'username' in ctx.chat ? ctx.chat.username : 'there';

    return `
<b>Hi @${username || 'there'}!</b> 👋

Welcome to <b>Ditto Arcade</b> — your gateway to two ways to earn $DITTO!

🎮 <b>Guess and Leverage Game</b>  
Tap ➕ and ➖ to complete combos and push the global counter.  
Try <b>Guess</b> & <b>Leverage</b> modes to multiply your $DITTO.

🧪 <b>Ditto Quest Idle RPG (Beta)</b>  
Battle monsters, craft gear, and breed your slime in this idle RPG adventure 👾⚔️

<i>Ditto can be whatever. You can be ANYTHING! 🚀✨</i>
    `;
}