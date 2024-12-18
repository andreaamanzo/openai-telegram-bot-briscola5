const OpenAI = require("openai")
const { Telegraf } = require("telegraf")
const { message } = require("telegraf/filters")
const {checkAlias, userFromAlias, randomAlias, formatAliases, ranking, pointsOfAlias, mapGameResults, getAllAliasesOfAlias } = require("./components.js")

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
    if (!alias) {
        await ctx.reply(`Deve essere fornito un nome`)
    } else if (checkAlias(alias, chatID)) {
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
    try {
        winners = winners.split(' ').slice(1, -1)
        losers = losers.split(' ').slice(1)
        if (winners.length + losers.length != 5) throw new Error('Dati non validi')
    } catch {
        await ctx.reply('Partita inserita in modo non valido')
        return
    }
    const results = mapGameResults(winners, losers, chatID)
    const gameID = Date.now()
    const newGame = {
        gameID,
        results
    }
    chat.games.push(newGame)
    await ctx.reply('Partita registrata! Usa /ranking per vedere la classifica aggiornata')
})


bot.command('ranking', async (ctx) => {
    const chatID = ctx.chat.id;
    const rank = ranking(chatID); // Ottieni la classifica come array [alias, punti]

    if (rank.length === 0) {
        await ctx.reply('Nessun dato disponibile per la classifica.');
        return;
    }

    // Calcola le larghezze massime per ogni colonna
    const maxAliasLength = Math.max(...rank.map(entry => entry[0].length), 5); // Almeno 'Alias'
    const maxPointsLength = Math.max(...rank.map(entry => entry[1].toString().length), 5); // Almeno 'Punti'

    let table = ""; // Intestazione della classifica
    table += `Posizione | ${'Alias'.padEnd(maxAliasLength)} | Punti\n`;
    table += `${'═'.repeat(9)} | ${'═'.repeat(maxAliasLength)} | ${''.repeat(maxPointsLength)}\n`;

    rank.forEach((entry, index) => {
        const position = `${index + 1}°`.padEnd(9);
        const alias = entry[0].padEnd(maxAliasLength);
        const points = entry[1].toString().padEnd(maxPointsLength);
        table += `${position} | ${alias} | ${points}\n`;
    });

    // Usa il metodo di formattazione Markdown per inviare il messaggio
    await ctx.reply('*Classifica attuale:*', { parse_mode: 'MarkdownV2' });
    await ctx.reply(`\`\`\`\n${table}\n\`\`\``, { parse_mode: 'MarkdownV2' })
})

bot.command('whoHisAlias', async (ctx) => {
    let [, alias] = (ctx.message.text).split(' ')
    const chatID = ctx.chat.id;
    const aliases = getAllAliasesOfAlias(alias, chatID)
    let aliasesString = "*Aliases:*\n"
    aliases.forEach(alias => {
        aliasesString += (alias + "\n")
    })
    await ctx.reply(aliasesString, { parse_mode: 'MarkdownV2' });
})


bot.command('help', async (ctx) => {
    const helpMessage = `
Benvenuto! Ecco la lista dei comandi disponibili:

/start - Inizializza una nuova chat o riconosce una chat esistente
/createUser [alias] - Crea un nuovo utente con l'alias specificato
/addAlias [alias] [nuovoAlias] - Aggiunge un nuovo alias all'utente esistente
/removeAlias [alias] - Rimuove un alias esistente (se l'utente ne ha più di uno)
/users - Mostra una lista casuale di alias degli utenti
/game [vincitori]/[perdenti] - Registra una partita indicando i vincitori e i perdenti (chi ha chimato deve essere il primo del suo gruppo)
/ranking - Mostra la classifica aggiornata della chat
/whoHisAlias [alias] - Mostra tutti gli alias associati a un alias specifico
/help - Mostra questo messaggio di aiuto

    `;
    await ctx.reply(helpMessage);
});

/* ===================== LAUNCH ===================== */

// bot.telegram.setMyCommands([
//     { command: 'start', description: 'Inizializza una nuova chat o riconosce una chat esistente' },
//     { command: 'createuser', description: 'Crea un nuovo utente con un alias specificato' },
//     { command: 'addalias', description: 'Aggiunge un nuovo alias all\'utente esistente' },
//     { command: 'removealias', description: 'Rimuove un alias esistente (se l\'utente ne ha più di uno)' },
//     { command: 'users', description: 'Mostra una lista casuale di alias degli utenti' },
//     { command: 'game', description: 'Registra una partita indicando i vincitori e i perdenti' },
//     { command: 'ranking', description: 'Mostra la classifica aggiornata della chat' },
//     { command: 'whohisalias', description: 'Mostra tutti gli alias associati a un alias specifico' },
//     { command: 'help', description: 'Mostra questo messaggio di aiuto' },
// ]).then(() => {
//     console.log("Comandi impostati con successo");
// }).catch((err) => {
//     console.error("Errore impostando i comandi", err);
// });





bot.launch(() => {
    console.log('Bot is up and running')
}).catch((err) => {
    console.error('Error starting bot', err)
})

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))