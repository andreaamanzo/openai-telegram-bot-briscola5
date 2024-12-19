const OpenAI = require("openai")
const configs = require("./configs")
const { Telegraf } = require("telegraf")
const { message } = require("telegraf/filters")
const { helpMessage } = require("./components")
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
        head2head
      } = require("./botComponents.js")


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
        await ctx.reply(`Nuova chat avviavta con successo!`)
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
    const removeGameObj = removegame(winners, loosers, chatID)
    if (!removeGameObj.validation) {
        await ctx.reply(removeGameObj.errMessage)
    } else {
        await ctx.reply('Partita rimossa con successo')
    }
})

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
    if (validation) {
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
        await ctx.reply(`${alias} ha totalizzato ${pointsOfObj.points} ${pointsOfObj.points == 1 ? "punto" : "punti"} `)
    }
})

bot.command('help', async (ctx) => {
    await ctx.reply(helpMessage)
})

bot.on('text', (ctx) => {
    const botUsername = ctx.botInfo.username
    const messageText = ctx.message.text
    const chatID = ctx.chat.id

    if (messageText.includes(`@${botUsername}`)) {
        const cleanMessage = messageText.replace(`@${botUsername}`, '').trim()
        completionWithFunctions(openai, Messages, Models, gpt-3.5-turbo, prompt)
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