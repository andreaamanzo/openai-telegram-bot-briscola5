const OpenAI = require("openai")
const configs = require("./configs.js")
const { Telegraf, Markup } = require("telegraf")
const { helpMessage, truncateAlias, checkChat } = require("./components.js")
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
      


const { completionWithFunctions, functions } = require("./functions")
const { loadData } = require("./utils.js")


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
        let usersString = ""
        usersObj.users.forEach(alias => {
            usersString += `- ${truncateAlias(alias, 15)}\n`
        })
        await ctx.reply('*Elenco degli utenti:*', { parse_mode: 'MarkdownV2' })
        await ctx.reply(usersString)
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

bot.use(async (ctx) => {
    const botUsername = ctx.botInfo.username
    const messageText = ctx.message.text
    const chatID = ctx.chat.id

    if (messageText.includes(`@${botUsername}`) || chatID > 0) { // nelle chat di gruppo il chatID è negativo
        let cleanMessage = messageText.replace(`@${botUsername}`, '').trim()
        let messages = [
            { 
                role: "system",
                content: `Sei un assistente che dovrà chiamare le funzioni necessarie a svolgere tutte le richieste di un utente, le quali possono essere anche più di una in un solo messaggio.
                Ciò che dovrai gestire sarà una chat in cui degli utenti si possono registrare (e ognuno di loro potrà essere conosciuto con più alias) e 
                registreranno qua le loro partite di "Briscola 5". "Briscola 5" è un gioco di carte che si gioca in 5 e le cui regole sono:
                1. Si gioca con un mazzo italiano di 40 carte.
                2. Ogni giocatore gioca una carta per turno, e il turno viene vinto dal giocatore che gioca la carta di valore più alto del seme dominante (briscola) o del seme iniziale.
                3. Prima dell'inizio della partita un giocatore "chiama" un altro giocatore e questi due saranno in squadra insieme.
                4. Il giocatore che "chiama" potrebbe anche decidere di "chiamarsi in mano", ovvero di chiamare sè stesso: se questo succede il giocatore giocherà da solo contro gli altri quattro giocatori.
                6. Al termine della partita, una squadrà avrà vinto e una squadra avrà perso.
                7. Le regole per l'assegnazione dei punti a fine partita sono le seguenti (a seconda dei casi che si possono presentare):
                    > caso 1: chi chiama vince:
                        - il giocatore che chiama  +2 punti 
                        - il giocatore che viene chiamato +1 punto
                        - chi non viene chiamato -1 punto 

                    > caso 2: chi chiama perde:
                        - il giocatore che chiama -2 punti
                        - il giocatore che viene chiamato -1 punto
                        - chi non viene chiamato +1 punto

                    > caso 3: chi chiama si chiama in mano e vince:
                        - il giocatore che chiama  +4 punti 
                        - chi non viene chiamato -1 punto 

                    > caso 4: chi chiama si chiama in mano e perde:
                        - il giocatore che chiama  -4 punti 
                        - chi non viene chiamato +1 punto

                8. Il sistema terrà traccia delle vittorie e delle sconfitte dei giocatori per calcolare una classifica generale.

                La tua responsabilità sarà interpretare i comandi dell'utente per gestire la registrazione degli utenti, gli alias, le partite e i risultati, e utilizzare le funzioni appropriate per soddisfare le richieste.`
            },
            {
                role: "user",
                content: `L'ID di questa chat è ${chatID} ` //e questa è la lista degli utenti e dei games: ${JSON.stringify(loadData().find(chat => chat.chatID == chatID))}
            }
        ]
    
        const finalMessage = await completionWithFunctions({openai, messages, model:`gpt-3.5-turbo`, prompt:cleanMessage, functions})
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