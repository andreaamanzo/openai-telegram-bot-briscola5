const OpenAI = require("openai")
const { Telegraf } = require("telegraf")
const { message } = require("telegraf/filters")
const {checkAlias, getUserFromAlias, getRandomAliasOfUserFromUserID, formatAliases, getRanking, mapGameResults, getAllAliasesOfAlias } = require("./components.js")

const configs = require("./configs")
const utils = require("./utils")

/* ===================== SETUP ===================== */

const data = utils.loadData()
setInterval(() => utils.saveData(data), 1000)
const getChatData = (chatID) => {
    return data.find(chat => chat.chatID == chatID)
}

const bot = new Telegraf(configs.TELEGRAM_BOT_TOKEN)
const openai = new OpenAI({
    apiKey: configs.OPENAI_API_KEY
})

/* ===================== BOT ===================== */

bot.start(async (ctx) => {
    const chatID = ctx.chat.id
    if (data.find(chat => chat.chatID == ctx.chat.id)) {
        await ctx.reply(`La chat è già avviata`)
    } else {
        const newChat = {
            chatID,
            users : [],
            games : [],
        }
        data.push(newChat)
        await ctx.reply(`Nuova chat avviavta con successo!`)
    }
})

bot.command('createuser', async (ctx) => {
    const chatID = ctx.chat.id
    let [, alias] = (ctx.message.text).split(' ')
    if (!alias) {
        await ctx.reply(`Deve essere fornito un nome per creare un nuovo utente`)
    } else if (checkAlias(alias, chatID)) {
        await ctx.reply(`Impossibile scegliere "${alias}" come nome perché è già l'alias di qualcun altro`)
    } else {
        const userID = Date.now()
        const newUser = {
            userID,
            aliases : [alias],
        }
        const users = data.find(chat => chat.chatID == ctx.chat.id).users
        users.push(newUser)
        await ctx.reply(`Ciao ${alias}, benvenuto in questa chat!`)
        console.log(users)
    }
})

bot.command('users', async (ctx) => {
    const chatID = ctx.chat.id
    const users = getChatData(chatID).users
    const aliasesArray = [] 
    users.forEach(user => aliasesArray.push(getRandomAliasOfUserFromUserID(user.userID, chatID)))
    const aliasesString = formatAliases(aliasesArray) 
    await ctx.reply(aliasesString)
        
})

bot.command('addalias', async (ctx) =>  {
    const chatID = ctx.chat.id
    let [, alias, newAlias] = (ctx.message.text).split(' ')
    if (!alias || !newAlias) {
        await ctx.reply(`Devono essere forniti un alias e un nuovo alias da aggiungere`)
    }else if (!checkAlias(alias, chatID)) {
        await ctx.reply(`"${alias}" non è l'alias di nessun utente`)
        await ctx.reply(`Utilizza il comando /createuser per creare un nuovo utente oppure /addalias per aggiungere un nuovo alias a un utente`)
    } else if (checkAlias(newAlias, chatID)) {
        await ctx.reply(`Impossibile assegnare "${newAlias}" come nuovo alias perché è già l'alias di qualcun altro`)
        await ctx.reply(`Utilizza il comando /whoisalias per vedere a chi appartiene un certo alias `)
    } else {
        const user = getChatData(chatID).users.find(user => user.userID == getUserFromAlias(alias, chatID).userID)
        user.aliases.push(newAlias)
        await ctx.reply(`"${newAlias}" aggiunto con successo come nuovo alias di "${alias}"`)
    }
})


bot.command('removealias', async (ctx) =>  {
    const chatID = ctx.chat.id
    let [, alias] = (ctx.message.text).split(' ')
    if (!alias) {
        await ctx.reply(`Deve essere fornito un alias per poterlo rimuovere`)
    } else if (!checkAlias(alias, chatID)) {
        await ctx.reply(`"${alias}" non è l'alias di nessun utente`)
    } else {
        const user = getChatData(chatID).users.find(user => user.userID == getUserFromAlias(alias, chatID).userID)
        if (user.aliases.length>1){
            user.aliases = user.aliases.filter(a => a != alias)
            await ctx.reply("Alias rimosso con successo!")
        } else {
            await ctx.reply("Impossibile rimuovere l'alias perché è l'unico presente")
        }
    }
})

bot.command('game', async (ctx) => {
    const chatID = ctx.chat.id
    let [, winners, losers] = (ctx.message.text).split('/')
    try {
        winners = winners.split(' ').slice(1, -1)
        losers = losers.split(' ').slice(1)
        if (winners.length + losers.length != 5 || winners.length < 1) throw new Error('Dati non validi')
    } catch {
        await ctx.reply('Partita inserita in modo non valido')
        return
    }
    const userIDs = new Set() // Per verificare duplicati
    for (const alias of winners.concat(losers)) {
        const user = getUserFromAlias(alias, chatID) 
        if (!user) {
            await ctx.reply(`"${alias}" non è l'alias di nessun utente nella chat.`)
            return
        }
        if (userIDs.has(user.userID)) {
            await ctx.reply(`Lo stesso utente non può essere presente più volte nella stessa partita`)
            return
        }
        userIDs.add(user.userID)
    }
    const results = mapGameResults(winners, losers, chatID)
    if (!results) {
        await ctx.reply("Errore durante la registrazione dei risultati...")
        return
    }
    const gameID = Date.now()
    const newGame = {
        gameID,
        results
    }
    const games = getChatData(chatID).games
    games.push(newGame)
    await ctx.reply('Partita registrata! Usa /ranking per vedere la classifica aggiornata')
})


bot.command('ranking', async (ctx) => {
    const chatID = ctx.chat.id
    const rank = getRanking(chatID)

    if (rank.length === 0) {
        await ctx.reply('Nessun dato disponibile per la classifica.')
        return
    }

    const truncateAlias = (alias, maxLength) => {
        if (alias.length > maxLength) {
            return alias.slice(0, maxLength - 1) + '…'
        }
        return alias
    }

    const RANK_LENGTH = 4
    const ALIAS_LENGTH = 10 
    const POINTS_LENGTH = 5

    let table = ""
    table += `Rank | ${'Alias'.padEnd(ALIAS_LENGTH)} | Punti\n`
    table += `${'-'.repeat(RANK_LENGTH)} | ${'-'.repeat(ALIAS_LENGTH)} | ${'-'.repeat(POINTS_LENGTH)}\n`

    rank.forEach((entry, index) => {
        const position = `${index + 1}°`.padEnd(RANK_LENGTH)
        const alias = truncateAlias(entry[0], ALIAS_LENGTH).padEnd(ALIAS_LENGTH)
        const points = entry[1].toString().padEnd(POINTS_LENGTH)
        table += `${position} | ${alias} | ${points}\n`
    })

    await ctx.reply('*Classifica attuale:*', { parse_mode: 'MarkdownV2' })
    await ctx.reply(`\`\`\`\n${table}\n\`\`\``, { parse_mode: 'MarkdownV2' })
})


bot.command('whoisalias', async (ctx) => {
    const chatID = ctx.chat.id
    let [, alias] = (ctx.message.text).split(' ')
    if (!alias) {
        await ctx.reply(`Deve essere fornito un alias per fare la ricerca`)
    } else if (!checkAlias(alias, chatID)) {
        await ctx.reply(`"${alias}" non è l'alias di nessun utente`)
    } else {
        const aliases = getAllAliasesOfAlias(alias, chatID)
        let aliasesString = `*Alias di "${alias}" :*\n`
        aliases.forEach(alias => {
            aliasesString += ("\\- " + alias + "\n")
        })
        await ctx.reply(aliasesString, { parse_mode: 'MarkdownV2' })
    }
})


bot.command('help', async (ctx) => {
    const helpMessage = `
Benvenuto! Ecco la lista dei comandi disponibili:

/start - Inizializza una nuova chat o riconosce una chat esistente
/createuser [alias] - Crea un nuovo utente con l'alias specificato
/addalias [alias] [nuovoAlias] - Aggiunge un nuovo alias all'utente esistente
/removealias [alias] - Rimuove un alias esistente (se l'utente ne ha più di uno)
/users - Mostra una lista casuale di alias degli utenti
/game [vincitori]/[perdenti] - Registra una partita indicando i vincitori e i perdenti (chi ha chimato deve essere il primo del suo gruppo)
/ranking - Mostra la classifica aggiornata della chat
/whoisalias [alias] - Mostra tutti gli alias associati a un alias specifico
/help - Mostra questo messaggio di aiuto

    `;
    await ctx.reply(helpMessage)
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