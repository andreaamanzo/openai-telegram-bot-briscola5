const utils = require("./utils")
const lodash = require('lodash')


const getChatData = (chatID) => {
    const data = utils.loadData()
    return data.find(chat => chat.chatID == chatID)
}

function checkChat(chatID) {
    return !!getChatData(chatID)
}

const checkAlias = (alias, chatID) => {
    const chat = getChatData(chatID)
    alias = parseAlias(alias)
    return !!(chat?.users.find(user => user.aliases.includes(alias)))
}

const getUserFromAlias = (alias, chatID) => {
    const chat = getChatData(chatID)
    const user = chat.users.find(user => user.aliases.includes(alias))
    return user
}

const getUserFromUserID = (userID, chatID) => {
    const chat = getChatData(chatID)
    const finalUser = chat.users.find(user => user.userID == userID) 
    return finalUser
}

const getRandomAliasOfUserFromUserID = (userID, chatID) => {
    const user = getUserFromUserID(userID, chatID)
    return user.aliases[Math.floor(Math.random() * user.aliases.length)] 
}

const getPointsOfUserFromUserID = (userID, chatID) => {
    const user = getUserFromUserID(userID, chatID)
    const games = getChatData(chatID).games
    let points = 0
    games.forEach(game => {
        if (Object.keys(game.results).includes(user.userID.toString())) { 
            points += game.results[user.userID]
        }
        })
    return points
}

const getRanking = (chatID) => {
    const users = getChatData(chatID).users
    const result = []
    users.forEach( user => {
        const randomAlias = getRandomAliasOfUserFromUserID(user.userID, chatID)
        const points = getPointsOfUserFromUserID(user.userID, chatID)
        result.push([randomAlias, points])
    })
    const sortedResult = result.sort((a, b) => b[1] - a[1])
    return sortedResult
}

const getAllAliasesOfAlias = (alias, chatID) => {
    const user = getUserFromAlias(alias, chatID)
    return user.aliases
}

const validateGame = (winners, loosers, chatID) => {
    const validationObj = {
        validation : false,
        errMessage : null,
        winners: null,
        loosers: null
    }
    if (!winners || !loosers || winners.length + loosers.length != 5) {
        validationObj.errMessage = "Partita inserita in modo non valido"
        return validationObj
    }
    winners = winners.map(alias => parseAlias(alias))
    loosers = loosers.map(alias => parseAlias(alias))
    
    const userIDs = new Set() // Per verificare duplicati
    for (let alias of winners.concat(loosers)) {
        const user = getUserFromAlias(alias, chatID) 
        if (!user) {
            validationObj.errMessage = `"${alias}" non è l'alias di nessun utente nella chat.`
            return validationObj
        }
        if (userIDs.has(user.userID)) {
            validationObj.errMessage = 'Lo stesso utente non può essere presente più volte nella stessa partita'
            return validationObj
        }
        userIDs.add(user.userID)
    }
    validationObj.validation = true
    validationObj.winners = winners
    validationObj.loosers = loosers
    return validationObj
}

const getGameFromGameResult = (result, chatID) => {
    const games = getChatData(chatID).games
    return games.find(game => lodash.isEqual(result, game.results))
}

const mapGameResults = (winners, loosers, chatID) => {
    winners = winners.map(alias => getUserFromAlias(parseAlias(alias), chatID).userID)
    loosers = loosers.map(alias => getUserFromAlias(parseAlias(alias), chatID).userID)
    if (winners.length==1){
        return {[winners[0]]:4, [loosers[0]]:-1, [loosers[1]]:-1, [loosers[2]]:-1, [loosers[3]]:-1}
    }else if (winners.length == 2){
        return {[winners[0]]:2, [winners[1]]:1, [loosers[0]]:-1, [loosers[1]]:-1, [loosers[2]]:-1}
    }else if (winners.length == 3){
        return {[winners[0]]:1, [winners[1]]:1, [winners[2]]:1, [loosers[0]]:-2, [loosers[1]]:-1}
    }else if (winners.length == 4){
        return {[winners[0]]:1, [winners[0]]:1, [winners[1]]:1, [winners[2]]:1, [loosers[3]]:-4}
    }
}

const parseAlias = (alias) => {
    return alias.toLowerCase()
}

const getGames = (chatID) => {
    const games = getChatData(chatID).games 
    return games
}

const truncateAlias = (alias, maxLength) => {
    if (alias.length > maxLength) {
        return alias.slice(0, maxLength - 1) + '…'
    }
    return alias
}

const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).slice(2)

    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${day}/${month}/${year}, ${hours}:${minutes}`
}

const helpMessage = `
Benvenuto! Ecco la lista dei comandi disponibili:

/start - Inizializza una nuova chat o riconosce una chat esistente
/createuser [alias] - Crea un nuovo utente con l'alias specificato
/addalias [alias] [nuovoAlias] - Aggiunge un nuovo alias all'utente esistente
/removealias [alias] - Rimuove un alias esistente (se l'utente ne ha più di uno)
/users - Mostra la lista degli utenti
/game [vincitori]/[perdenti] - Registra una partita indicando i vincitori e i perdenti (chi ha chimato deve essere il primo del suo gruppo)
/removegame [vincitori]/[perdenti] - Elimina la partita specificata
/undo - Elimina l'ultima partita giocata
/gamelog - Mostra il registro delle partite
/ranking - Mostra la classifica aggiornata della chat
/whoisalias [alias] - Mostra tutti gli alias associati a un alias specifico
/pointsof [alias] - Mostra i punti di un utente
/head2head [alias1] [alias2] - Mostra chi è in vantaggio tra due utenti nelle partite in cui hanno giocato entrambi
/help - Mostra questo messaggio di aiuto
`

module.exports = {
    helpMessage,
    checkAlias,
    checkChat,
    getAllAliasesOfAlias,
    getGameFromGameResult,    
    getRandomAliasOfUserFromUserID,
    getRanking,
    getUserFromAlias,
    mapGameResults,
    parseAlias,
    truncateAlias,
    validateGame,
    getPointsOfUserFromUserID,
    getGames,
    formatTimestamp
}