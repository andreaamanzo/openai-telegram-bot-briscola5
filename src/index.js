const OpenAI = require("openai")
const configs = require("./configs")
const { Telegraf, Markup } = require("telegraf")
const { helpMessage, truncateAlias, checkChat, getGames } = require("./components")
const { completionWithFunctions, functions, instructionMessage } = require("./functions")
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
        undo,
        gamelog
      } = require("./botComponents")
const { sendPaginatedList } = require('./telegrafComponents')

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

bot.use(async (ctx, next) => {
    const chatID = ctx.chat.id
    const validation = checkChat(chatID)
    if (validation) {
        return next()
    } else {
        await ctx.reply("È necessario avviare il bot con il comando /start prima di poterlo usare")
    }
})

bot.command('createuser', async (ctx) => {
    const chatID = ctx.chat.id
    let [, alias] = (ctx.message.text).split(' ')
    const createUserObj = createuser(alias, chatID)
    if (createUserObj.validation) {
        ctx.reply(`Ciao ${createUserObj.user.aliases[0]}, benvenuto in questa chat!`)
    } else {
        ctx.reply(createUserObj.errMessage)
    }
})

bot.command('users', async (ctx) => {
    const chatID = ctx.chat.id
    const usersObj = users(chatID)
    if (usersObj.validation) {
        await sendPaginatedList(ctx, usersObj.users, 10, 1, 'users')
    } else {
        await ctx.reply(usersObj.errMessage)
    }
})

bot.command('addalias', async (ctx) =>  {
    const chatID = ctx.chat.id
    let [, alias, newAlias] = (ctx.message.text).split(' ')
    const addAliasObj = addalias(alias, newAlias, chatID)
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

bot.action('CONFIRM_UNDO', async (ctx) => {
    const chatID = ctx.chat.id

    await ctx.answerCbQuery()
    await ctx.deleteMessage()
    const undoObj = undo(chatID)
    if (!undoObj.validation) {
        await ctx.reply(undoObj.errMessage)
    } else {
        await ctx.reply('Partita eliminata con successo!')
    }
})

bot.action('CANCEL_UNDO', async (ctx) => {
    await ctx.deleteMessage()
    await ctx.answerCbQuery()
    await ctx.reply('Operazione annullata.')
})

bot.command('ranking', async (ctx) => {
    const chatID = ctx.chat.id
    const rankingObj = ranking(chatID)
    if (!rankingObj.validation) {
        await ctx.reply(rankingObj.errMessage)
        return
    }
    const rankingList = rankingObj.ranking
    const RANK_LENGTH = 4
    const ALIAS_LENGTH = 10 
    const POINTS_LENGTH = 5
    
    let rankingString = ""
    rankingString += `Rank | ${'Alias'.padEnd(ALIAS_LENGTH)} | Punti\n`
    rankingString += `${'-'.repeat(RANK_LENGTH)} | ${'-'.repeat(ALIAS_LENGTH)} | ${'-'.repeat(POINTS_LENGTH)}\n`

    rankingList.forEach((entry, index) => {
        const position = `${index + 1}°`.padEnd(RANK_LENGTH)
        const alias = truncateAlias(entry[0], ALIAS_LENGTH).padEnd(ALIAS_LENGTH)
        const points = entry[1].toString().padEnd(POINTS_LENGTH)
        rankingString += `${position} | ${alias} | ${points}\n`
    })

    rankingString = `\`\`\`\n${rankingString}\n\`\`\``
    await ctx.reply('*Classifica attuale:*', { parse_mode: 'MarkdownV2' })
    await ctx.reply(rankingString, { parse_mode: 'MarkdownV2' })
})

bot.command('whoisalias', async (ctx) => {
    const chatID = ctx.chat.id
    let [, alias] = (ctx.message.text).split(' ')
    const whoIsAliasObj = whoisalias(alias, chatID)
    if (!whoIsAliasObj.validation){
        await ctx.reply(whoIsAliasObj.errMessage)
    }else{
        let aliasesString = `*Alias di "${alias}" :*\n`
        whoIsAliasObj.aliases.forEach(alias => {
            aliasesString += ("\\- " + alias + "\n")
        })
        await ctx.reply(aliasesString, { parse_mode: 'MarkdownV2' })
    }
})

bot.command('head2head', async (ctx) => {
    const chatID = ctx.chat.id
    let [, alias1, alias2] = (ctx.message.text).split(' ')
    const {validation, pointsOfWinner, pointsOfLooser, winner, looser, gamesCounter, errMessage} = head2head(alias1, alias2, chatID)
    if (!validation) {
        await ctx.reply(errMessage)
        return
    }
    if (pointsOfWinner == pointsOfLooser) {
        await ctx.reply(`"${winner}" e "${looser}" sono entrambi a ${pointsOfWinner} ${pointsOfWinner == 1 ? "punto" : "punti"} dopo ${gamesCounter} ${gamesCounter == 1 ? "partita giocata" : " partite giocate"} insieme`)
    } else {
        await ctx.reply(`"${winner}" è in vantaggio rispetto a "${looser}" con ${pointsOfWinner} ${pointsOfWinner == 1 ? "punto" : "punti"} contro ${pointsOfLooser} dopo ${gamesCounter} ${gamesCounter == 1 ? "partita giocata" : " partite giocate"} insieme`)
    }
})

bot.command('pointsof', async(ctx) => {
    const chatID = ctx.chat.id
    let [, alias] = (ctx.message.text).split(' ')
    const pointsOfObj = pointsof(alias, chatID)
    if (!pointsOfObj.validation) {
        await ctx.reply(pointsOfObj.errMessage)
    } else {
        await ctx.reply(`"${alias}" ha totalizzato ${pointsOfObj.points} ${pointsOfObj.points == 1 ? "punto" : "punti"} `)
    }
})

bot.command('help', async (ctx) => {
    await ctx.reply(helpMessage)
})

bot.command('gamelog', async (ctx) => {
    const chatID = ctx.chat.id
    const gamelogObj = gamelog(chatID)
    if (!gamelogObj.validation) {
        await ctx.reply(gamelogObj.errMessage)
    } else {
        const options = gamelogObj.games
        await sendPaginatedList(ctx, options, 3, 1, 'gamelog')
    }
})

bot.action(/PAGE_(\w+)_(\d+)/, async (ctx) => {
    const chatID = ctx.chat.id
    const type = ctx.match[1]
    const currentPage = parseInt(ctx.match[2])


    let options
    let itemsPerPage
    if (type === 'gamelog') {
        options = gamelog(chatID).games
        itemsPerPage = 3
    } else if (type === 'users') {
        options = users(chatID).users
        itemsPerPage = 10
    } else {
        await ctx.answerCbQuery('Opzioni non valide!')
        return
    }
    await sendPaginatedList(ctx, options, itemsPerPage, currentPage, type)

    await ctx.answerCbQuery()
})

bot.use(async (ctx) => {
    const botUsername = ctx.botInfo.username
    const messageText = ctx.message.text
    const chatID = ctx.chat.id

    if (messageText.includes(`@${botUsername}`) || chatID > 0) { // nelle chat di gruppo il chatID è negativo
        let cleanMessage = messageText.replace(`@${botUsername}`, '').trim()
        let messages = [
            { 
                role: "system",
                content: instructionMessage
            },
            {
                role: "user",
                content: `L'ID di questa chat è ${chatID} `
            }
        ]
    
        const finalMessage = await completionWithFunctions({openai, messages, model:`gpt-3.5-turbo`, prompt:cleanMessage, functions})
        await ctx.reply(finalMessage) 
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