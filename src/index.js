const OpenAI = require("openai")
const { Telegraf } = require("telegraf")
const { message } = require("telegraf/filters")
const {checkAlias, userFromAlias, randomAlias, formatAliases, formatRanking, ranking, pointsOfAlias, mapGameResults } = require("./components.js")

const configs = require("./configs")
const utils = require("./utils")

/* ===================== SETUP ===================== */

const data = utils.loadData()
setInterval(() => utils.saveData(data), 5000)

const bot = new Telegraf(configs.TELEGRAM_BOT_TOKEN)
const openai = new OpenAI({
    apiKey: configs.OPENAI_API_KEY
})

/* ===================== BOT ===================== */

bot.start(async (ctx) => {
    const chatID = ctx.chat.id
    if (data.find(chat => chat.chatID == ctx.chat.id)) {
        await ctx.reply(`Chat already created, chat id: ${chatID}`)
    } else {
        const newChat = {
            chatID,
            users : [],
            games : [],
        }
        data.push(newChat)
        await ctx.reply(`New chat created, chat id: ${chatID}`)
    }
})

bot.command('createUser', async (ctx) => {
    const chatID = ctx.chat.id
    let [, alias] = (ctx.message.text).split(' ')
    if (!alias) alias = "randomAlias"
    if (checkAlias(alias, chatID)) {
        await ctx.reply(`this alias already exists`)
    } else {
        const userID = Date.now()
        const newUser = {
            userID,
            aliases : [alias],
        }
        const chat = data.find(chat => chat.chatID == ctx.chat.id)
        chat.users.push(newUser)
        await ctx.reply(`your name: ${alias}`)
    }
})

bot.command('users', async (ctx) => {
    const aliasArr = [] //array finale
    const chatID = ctx.chat.id
    const chat = data.find(chat => chat.chatID == chatID)
    
    chat.users.map(user => {
        const randomIndex = Math.floor(Math.random() * user.aliases.length)
        aliasArr.push(user.aliases[randomIndex])
        }
    ).filter(alias => alias !== null)

    strAliases = formatAliases(aliasArr) //formattazione print
    await ctx.reply(strAliases)
        
})

bot.command('addAlias', async (ctx) =>  {
    const chatID = ctx.chat.id
    const chat = data.find(chat => chat.chatID == chatID)
    let [, alias, newAlias] = (ctx.message.text).split(' ')
    if (!checkAlias(alias, chatID)) {
        await ctx.reply("Questo utente non esiste")
    } else if (checkAlias(newAlias, chatID)) {
        await ctx.reply("Questo alias esiste già")
    } else {
        const userID = userFromAlias(alias, chatID).userID
        let user = chat.users.find(user => user.userID == userID)
        user.aliases.push(newAlias)
        await ctx.reply("Alias aggiunto con successo!")
    }
})


bot.command('removeAlias', async (ctx) =>  {
    const chatID = ctx.chat.id
    const chat = data.find(chat => chat.chatID == chatID)
    let [, alias] = (ctx.message.text).split(' ')
    if (!checkAlias(alias, chatID)) {
        await ctx.reply("Questo utente non esiste")
    } else {
        const userID = userFromAlias(alias, chatID).userID
        let user = chat.users.find(user => user.userID == userID)
        console.log(user)
        if (user.aliases.length>1){
            console.log(alias)
            user.aliases = user.aliases.filter(a => a != alias)
            console.log(user)
            await ctx.reply("Alias rimosso con successo!")
        } else {
            await ctx.reply("Impossibile rimuovere l'alias perché è l'unico presente")
        }
    }
})

bot.command('game', async (ctx) => {
    const chatID = ctx.chat.id
    const chat = data.find(chat => chat.chatID == chatID)
    let [, winners, losers] = (ctx.message.text).split('/')
    winners = winners.split(' ').slice(1, -1)
    losers = losers.split(' ').slice(1)
    const results = mapGameResults(winners, losers, chatID)
    const gameID = parseInt(chatID.toString() + (Date.now().toString()))
    const newGame = {
        gameID,
        results
    }
    chat.games.push(newGame)
    await ctx.reply('Partita registrata! Usa \\ranking per vedere la classifica aggiornata')
})


bot.command('ranking', async (ctx) => {
    const chatID = ctx.chat.id
    const rank = formatRanking(chatID)
    await ctx.reply(rank)
})

/*
bot.command('ranking', async (ctx) => {
    const chatID = ctx.chat.id
    const rank = formatRanking(chatID)
    await ctx.reply(rank)
})
*/

/* ===================== LAUNCH ===================== */

bot.launch(() => {
    console.log('Bot is up and running')
}).catch((err) => {
    console.error('Error starting bot', err)
})

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))