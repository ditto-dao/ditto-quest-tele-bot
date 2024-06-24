import { Context } from 'telegraf';

export function getStartMessageHTML(ctx: Context) {
    const username = ctx.chat?.type === 'private' && 'username' in ctx.chat ? ctx.chat.username : 'there';

    return `
<b>Hi @${username || 'there'}!</b> 👋

Simply tap the ➕ and ➖ buttons to contribute to the global number. 

Try our <b>Guess</b> and <b>Leverage</b> modes to earn more $DITTO.

Ditto can be whatever. You can be ANYTHING! 🚀✨

<i>Join the fun and start playing now!</i> 🎉
    `;
}
