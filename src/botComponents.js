const {loadData, saveData} = require("./utils")
const {
    checkAlias,
    getAllAliasesOfAlias,
    getGameFromGameResult,
    getRanking,
    getUserFromAlias,
    getPointsOfUserFromUserID,
    getRandomAliasOfUserFromUserID,
    mapGameResults,
    parseAlias,
    truncateAlias,
    validateGame
} = require("./components")

const data = loadData()
setInterval(() => saveData(data), 1000)

const getChatData = (chatID) => {
    return data.find(chat => chat.chatID == chatID)
}

const createchat = (chatID) => {
    const obj = {validation: false, errMessage: null, chat: null}
    if (getChatData(chatID)) {
        obj.errMessage = `La chat è già avviata`
        return obj
    } else {
        const newChat = {
            chatID,
            users : [],
            games : [],
        }
        data.push(newChat)
        obj.validation = true
        obj.chat = newChat
        return obj
    }
}

const createuser = (alias, chatID) => {
    const obj = {validation : false, user : undefined, errMessage : undefined}
    if (!alias) {
        obj.errMessage = `Deve essere fornito un nome per creare un nuovo utente`
        return obj
    }
    alias = parseAlias(alias)
    if (checkAlias(alias, chatID)) {
        obj.errMessage = `Impossibile scegliere "${alias}" come nome perché è già l'alias di qualcun altro`
        return obj
    }
    const userID = parseInt(Date.now().toString() + (Math.floor(Math.random() * 900) + 100).toString())
    const newUser = {
        userID,
        aliases : [alias],
    }
    const users = getChatData(chatID).users
    users.push(newUser)
    obj.validation = true
    obj.user = newUser
    return obj
}

const addalias = (alias, newAlias, chatID) => {
    const obj = {validation : false, user : null, errMessage : null}
    if (!alias || !newAlias) {
        obj.errMessage = `Devono essere forniti un alias e un nuovo alias da aggiungere`
        return obj
    }
    alias = parseAlias(alias)
    if (!checkAlias(alias, chatID)) {
        obj.errMessage = `"${alias}" non è l'alias di nessun utente
        Utilizza il comando /createuser per creare un nuovo utente oppure /addalias per aggiungere un nuovo alias a un utente`
        return obj
    }
    newAlias = parseAlias(newAlias)
    if (checkAlias(newAlias, chatID)) {
        obj.errMessage = `Impossibile assegnare "${newAlias}" come nuovo alias perché è già l'alias di qualcun altro
        Utilizza il comando /whoisalias per vedere a chi appartiene un certo alias`
        return obj
    } 
    const user = getChatData(chatID).users.find(user => user.userID == getUserFromAlias(alias, chatID).userID)
    user.aliases.push(newAlias)
    obj.validation = true
    obj.user = user
    return obj
}

const removealias = (alias, chatID) => {
    const obj = {validation : false, user : null, errMessage : null}
    if (!alias) {
        obj.errMessage = `Deve essere fornito un alias per poterlo rimuovere`
        return obj
    } 
    alias = parseAlias(alias)
    if (!checkAlias(alias, chatID)) {
        obj.errMessage = `"${alias}" non è l'alias di nessun utente`
        return obj
    } 
    const user = getChatData(chatID).users.find(user => user.userID == getUserFromAlias(alias, chatID).userID)
    if (user.aliases.length>1){
        user.aliases = user.aliases.filter(a => a != alias)
        obj.validation = true
        obj.user = user
    } else {
        obj.errMessage = "Impossibile rimuovere l'alias perché è l'unico presente"
    }
    return obj
}

const whoisalias = (alias, chatID) => {
    const obj = {validation : false, aliases : null, errMessage : null }
    if (!alias) {
        obj.errMessage = `Deve essere fornito un alias per fare la ricerca`
        return obj
    }
    alias = parseAlias(alias)
    if (!checkAlias(alias, chatID)) {
        obj.errMessage = `"${alias}" non è l'alias di nessun utente`
        return obj
    } 
    const aliases = getAllAliasesOfAlias(alias, chatID)
    obj.validation = true
    obj.aliases = aliases
    return obj
}

const users = (chatID) => {
    const obj = {validation : false, users : null, errMessage : null}
    const users = getChatData(chatID).users
    if (users.length === 0) {
        obj.errMessage = "Nessun utente presente. Usa il comando /createuser per aggiungere un nuovo giocatore"
        return obj
    }
    const aliasesArray = [] 
    users.forEach(user => aliasesArray.push(getRandomAliasOfUserFromUserID(user.userID, chatID)))
    obj.users = aliasesArray
    obj.validation = true
    return obj
}

const game = (winners, loosers, chatID) => {
    const validationObj = validateGame(winners, loosers, chatID)
    const obj = {validation : false, game : null, errMessage : null}
    if (!validationObj.validation) {
        obj.errMessage = validationObj.errMessage
        return obj
    }
    winners = validationObj.winners
    loosers = validationObj.loosers
    const results = mapGameResults(winners, loosers, chatID)
    const gameID = Date.now()
    const newGame = {
        gameID,
        results
    }
    const games = getChatData(chatID).games
    games.push(newGame)
    obj.validation = true
    obj.game = newGame
    return obj
}

const removegame = (winners, loosers, chatID) => {
    const obj = {validation : false, game : null, errMessage : null}
    const validationObj = validateGame(winners, loosers, chatID)
    if (!validationObj.validation) {
        obj.validation=false
        obj.game=null
        obj.errMessage=validationObj.errMessage
        return obj
    }
    winners = validationObj.winners
    loosers = validationObj.loosers
    const results = mapGameResults(winners, loosers, chatID)
    let game = getGameFromGameResult(results, chatID)
    if (!game) {
        obj.validation=false
        obj.game=null
        obj.errMessage=`Partita non trovata, impossibile rimuoverla`
        return obj
    }
    let games = getChatData(chatID).games
    const gameID = game.gameID
    games = games.filter(g => g.gameID != gameID)
    getChatData(chatID).games = games
    obj.validation=true
    obj.game=game
    obj.errMessage=null
    return obj
}

const undo = (chatID) => {
    const obj = {validation : false, game : null, errMessage : null}
    const games = getChatData(chatID).games
    if (games.length == 0) {
        obj.errMessage = 'Nessuna partita presente. Usa il comando /game per registrare una partita'
        return obj
    }
    const lastGame = getChatData(chatID).games.pop()
    obj.validation = true
    obj.game = lastGame
    return obj
}

const ranking = (chatID) => {
    let rankingString = ""
    const rank = getRanking(chatID)

    if (rank.length === 0) {
        rankingString = 'Nessun dato disponibile per la classifica.'
        return rankingString
    }
    const RANK_LENGTH = 4
    const ALIAS_LENGTH = 10 
    const POINTS_LENGTH = 5

    rankingString += `Rank | ${'Alias'.padEnd(ALIAS_LENGTH)} | Punti\n`
    rankingString += `${'-'.repeat(RANK_LENGTH)} | ${'-'.repeat(ALIAS_LENGTH)} | ${'-'.repeat(POINTS_LENGTH)}\n`

    rank.forEach((entry, index) => {
        const position = `${index + 1}°`.padEnd(RANK_LENGTH)
        const alias = truncateAlias(entry[0], ALIAS_LENGTH).padEnd(ALIAS_LENGTH)
        const points = entry[1].toString().padEnd(POINTS_LENGTH)
        rankingString += `${position} | ${alias} | ${points}\n`
    })

    rankingString = `\`\`\`\n${rankingString}\n\`\`\``
    return rankingString
}

const head2head = (alias1, alias2, chatID) => {
    const obj = {validation : false, points1 : null, points2 : null, alias1 : null, alias2 : null, counter : null, errMessage : null}
    const user1 = getUserFromAlias(alias1, chatID)
    const user2 = getUserFromAlias(alias2, chatID)
    if (!user1) {
        obj.errMessage = `"${alias1}" non è l'alias di nessun utente`
        return obj
    }
    if (!user2) {
        obj.errMessage = `"${alias2}" non è l'alias di nessun utente`
        return obj
    }
    let points1 = 0
    let points2 = 0
    let counter = 0
    
    const chat = getChatData(chatID)
    chat.games.forEach(game => {
        if (Object.keys(game.results).includes(user1.userID.toString()) && Object.keys(game.results).includes(user2.userID.toString())) { // ci sono entrambi
            points1 += game.results[user1.userID]
            points2 += game.results[user2.userID]
            counter++
        }
    }) 
    if (points2 > points1) {
        [points2, points1] = [points1, points2]
        [alias2, alias1] = [alias1, alias2]
    }
    obj.validation = true
    obj.points1 = points1
    obj.points2 = points2
    obj.alias1 = alias1
    obj.alias2 = alias2
    obj.counter = counter
    return obj
}

const pointsof = (alias, chatID) => {
    const obj = {validation : false, user : null, points : null, errMessage : null}
    if (!checkAlias(alias, chatID)){
        obj.errMessage = `"${alias}" non è un utente di questa chat`
        return obj
    }
    const user = getUserFromAlias(alias, chatID)
    const points = getPointsOfUserFromUserID(user.userID, chatID)
    obj.points = points
    obj.user = user
    obj.validation = true
    return obj
}

module.exports = {
    addalias,
    createchat,
    createuser,
    game,
    head2head,
    pointsof,
    ranking,
    removealias,
    removegame,
    undo,
    users,
    whoisalias
}