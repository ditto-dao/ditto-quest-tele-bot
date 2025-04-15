import { Context } from 'telegraf';

export function getStartMessageHTML(ctx: Context) {
    const username = ctx.chat?.type === 'private' && 'username' in ctx.chat ? ctx.chat.username : 'there';

    return `
<b>Hi @${username || 'there'}!</b> 👋

Welcome to the Ditto Arcade's debut Accumulation Game!

Tap the ➕ and ➖ buttons and complete combos to influence the global counter.  
Try our <b>Guess</b> and <b>Leverage</b> modes to stack more $DITTO.

🚨 <b>NEW:</b> We've just launched the <b>Ditto Quest Idle RPG</b> beta!  
Battle monsters, craft gear, and breed your slime in this idle RPG adventure 👾⚔️

<i>Ditto can be whatever. You can be ANYTHING! 🚀✨</i>
    `;
}