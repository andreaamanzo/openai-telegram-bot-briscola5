const OpenAI = require("openai")
const configs = require("./configs.js")
const { Telegraf, Markup } = require("telegraf")
const { message } = require("telegraf/filters")
const { helpMessage } = require("./components.js")
const { addalias,
        createchat,
        createuser,
        users,
        game,
        ranking,
        removealias,
        removegame, 
        whoisalias,
        pointsof,
        head2head,
        undo
      } = require("./botComponents.js")
      


const { completionWithFunctions } = require("./functions")
const {loadData} = require("./utils.js")


/* ===================== SETUP ===================== */

const bot = new Telegraf(configs.TELEGRAM_BOT_TOKEN)
const openai = new OpenAI({
    apiKey: configs.OPENAI_API_KEY
})


/* ===================== BOT ===================== */


bot.start(async (ctx) => {
    const chatID = ctx.chat.id
    const chatObj = createchat(chatID)
    if (chatObj.validation) {
        await ctx.reply(`Nuova chat avviata con successo!`)
    } else {
        await ctx.reply(chatObj.errMessage)
    }
})

bot.command('createuser', async (ctx) => {
    const chatID = ctx.chat.id
    let [, alias] = (ctx.message.text).split(' ')
    const createUserObj = createuser(alias, chatID)
    if (createUserObj.status) {
        ctx.reply(`Ciao ${createUserObj.user.aliases[0]}, benvenuto in questa chat!`)
    } else {
        ctx.reply(createUserObj.errMessage)
    }
})

bot.command('users', async (ctx) => {
    const chatID = ctx.chat.id
    const aliasesString = users(chatID) 
    await ctx.reply(aliasesString)
})

bot.command('addalias', async (ctx) =>  {
    const chatID = ctx.chat.id
    let [, alias, newAlias] = (ctx.message.text).split(' ')
    const addAliasObj = addalias(alias, newAlias, chatID);
    if (addAliasObj.validation) {
        await ctx.reply(`"${newAlias}" aggiunto con successo come nuovo alias di "${alias}"`)
    } else {
        await ctx.reply(addAliasObj.errMessage)
    }
})

bot.command('removealias', async (ctx) =>  {
    const chatID = ctx.chat.id
    let [, alias] = (ctx.message.text).split(' ')
    const remmoveAliasObj = removealias(alias, chatID)
    if (remmoveAliasObj.validation) {
        await ctx.reply(`Alias rimosso con successo`)
    } else {
        await ctx.reply(remmoveAliasObj.errMessage)
    }
})

bot.command('game', async (ctx) => {
    const chatID = ctx.chat.id
    let [, winners, loosers] = (ctx.message.text).split('/')
    try {
        winners = winners.split(' ').slice(1, -1)
        loosers = loosers.split(' ').slice(1)
        if (winners.length + loosers.length != 5 || winners.length < 1) throw new Error('Dati non validi')
    } catch {
        await ctx.reply('Partita inserita in modo non valido')
        return 
    }
    const gameObj = game(winners, loosers, chatID)
    if (!gameObj.validation) {
        await ctx.reply(gameObj.errMessage)
    } else {
        await ctx.reply('Partita registrata! Usa /ranking per vedere la classifica aggiornata')
    }
})


bot.command('removegame', async (ctx) => {
    const chatID = ctx.chat.id
    let [, winners, loosers] = (ctx.message.text).split('/')
    try {
        winners = winners.split(' ').slice(1, -1)
        loosers = loosers.split(' ').slice(1)
        if (winners.length + loosers.length != 5 || winners.length < 1) throw new Error('Dati non validi')
    } catch {
        await ctx.reply('Partita inserita in modo non valido')
        return 
    }
    const removeGameObj = removegame(winners, loosers, chatID)
    if (!removeGameObj.validation) {
        await ctx.reply(removeGameObj.errMessage)
    } else {
        await ctx.reply('Partita rimossa con successo')
    }
})

bot.command('undo', async (ctx) => {
    ctx.reply(
        `Sei sicuro di voler eliminare l'ultima partita?`,
        Markup.inlineKeyboard([
            [
                Markup.button.callback('Conferma', 'CONFIRM_UNDO'),
                Markup.button.callback('Annulla', 'CANCEL_UNDO')
            ]
        ])
    )
    
})
bot.action('CONFIRM_UNDO', (ctx) => {
    const chatID = ctx.chat.id

    ctx.answerCbQuery()
    const undoObj = undo(chatID)
    if (!undoObj.validation) {
        ctx.reply(undoObj.errMessage)
    } else {
        ctx.reply('Partita eliminata con successo!')
    }
})

bot.action('CANCEL_UNDO', (ctx) => {
    ctx.answerCbQuery()
    ctx.reply('Operazione annullata.')
});

bot.command('ranking', async (ctx) => {
    const chatID = ctx.chat.id
    const rankingString = ranking(chatID)

    await ctx.reply('*Classifica attuale:*', { parse_mode: 'MarkdownV2' })
    await ctx.reply(rankingString, { parse_mode: 'MarkdownV2' })
})


bot.command('whoisalias', async (ctx) => {
    const chatID = ctx.chat.id
    let [, alias] = (ctx.message.text).split(' ')
    const whoIsAliasObj = whoisalias(alias, chatID)
    if (!whoIsAliasObj.status){
        await ctx.reply(whoIsAliasObj.errMessage)
    }else{
        await ctx.reply(whoIsAliasObj.aliases, { parse_mode: 'MarkdownV2' })
    }
})

bot.command('head2head', async (ctx) => {
    const chatID = ctx.chat.id
    let [, ALIAS1, ALIAS2] = (ctx.message.text).split(' ')
    const {validation, points1, points2, alias1, alias2, counter, errMessage} = head2head(ALIAS1, ALIAS2, chatID)
    if (!validation) {
        await ctx.reply(errMessage)
        return
    }
    if (counter == 0){
        await ctx.reply(`"${alias1}" e "${alias2}" non hanno mai giocato nella stessa partita`)
    } else if (points1 == points2) {
        await ctx.reply(`"${alias1}" e "${alias2}" sono entrambi a ${points1} ${points1 == 1 ? "punto" : "punti"} dopo ${counter} ${counter == 1 ? "partita giocata" : " partite giocate"} insieme`)
    } else {
        await ctx.reply(`"${alias1}" è in vantaggio rispetto a "${alias2}" con ${points1} ${points1 == 1 ? "punto" : "punti"} contro ${points2} dopo ${counter} ${counter == 1 ? "partita giocata" : " partite giocate"} insieme`)
    }
})

bot.command('pointsof', async(ctx) => {
    const chatID = ctx.chat.id
    let [, alias] = (ctx.message.text).split(' ')
    const pointsOfObj = pointsof(alias, chatID);
    if (!pointsOfObj.validation) {
        await ctx.reply(pointsOfObj.errMessage)
    } else {
        await ctx.reply(`"${alias}" ha totalizzato ${pointsOfObj.points} ${pointsOfObj.points == 1 ? "punto" : "punti"} `)
    }
})

bot.command('help', async (ctx) => {
    await ctx.reply(helpMessage)
})

bot.use(async (ctx) => {
    const botUsername = ctx.botInfo.username
    const messageText = ctx.message.text
    const chatID = ctx.chat.id

    if (messageText.includes(`@${botUsername}`)) {
        let cleanMessage = `chatID é ${chatID} \n`
        cleanMessage += messageText.replace(`@${botUsername}`, '').trim()
        let messages = [
            {
                role: "user",
                content: `chatID è ${chatID} e questa è la lista degli utenti e dei games: ${JSON.stringify(loadData())}`
            }
        ]
    
        const finalMessage = await completionWithFunctions({openai, messages, model:`gpt-3.5-turbo`, prompt:cleanMessage})
        ctx.reply(finalMessage) 
    }
})


/* ===================== LAUNCH ===================== */


bot.launch(() => {
    console.log('Bot is up and running')
}).catch((err) => {
    console.error('Error starting bot', err)
})

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))