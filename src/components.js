const utils = require("./utils")

const getChatData = (chatID) => {
    const data = utils.loadData()
    return data.find(chat => chat.chatID == chatID)
}

const checkAlias = (alias, chatID) => {
    const chat = getChatData(chatID)
    return !!(chat?.users.find(user => user.aliases.includes(alias)))
}

const getUserFromAlias = (alias, chatID) => {
    const chat = getChatData(chatID)
    const user = chat.users.find(user => user.aliases.includes(alias))
    return user
}

const getUserFromUserID = (userID, chatID) => {
    const chat = getChatData(chatID)
    const user = chat.users.find(user => user.userID == userID) 
    return user
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


const formatAliases = (arr) => {
    if (arr.length === 1) return `- ${arr[0]}`
    else {
      let strAlias = ""
      for (let i = 0; i < arr.length; i++) {
        strAlias += `- ${arr[i]}\n`
      }
      return strAlias
    }
}

const mapGameResults = (winners, losers, chatID) => {
    winners = winners.map(alias => getUserFromAlias(alias, chatID).userID)
    losers = losers.map(alias => getUserFromAlias(alias, chatID).userID)
    if (winners.length==1){
        return {[winners[0]]:4, [losers[0]]:-1, [losers[1]]:-1, [losers[2]]:-1, [losers[3]]:-1}
    }else if (winners.length == 2){
        return {[winners[0]]:2, [winners[1]]:1, [losers[0]]:-1, [losers[1]]:-1, [losers[2]]:-1}
    }else if (winners.length == 3){
        return {[winners[0]]:1, [winners[1]]:1, [winners[2]]:1, [losers[0]]:-2, [losers[1]]:-1}
    }else if (winners.length == 4){
        return {[winners[0]]:1, [winners[0]]:1, [winners[1]]:1, [winners[2]]:1, [losers[3]]:-4}
    }
}

const getPointsFromHeadToHead = (alias1, alias2, chatID) => {
    const user1 = getUserFromAlias(alias1, chatID)
    const user2 = getUserFromAlias(alias2, chatID)
    let points1 = 0
    let points2 = 0

    const chat = getChatData(chatID)
    chat.games.forEach(game => {
        if (Object.keys(game.results).includes(user1.userID.toString()) && Object.keys(game.results).includes(user2.userID.toString())) { // ci sono entrambi
            points1 += game.results[user1.userID]
            points2 += game.results[user2.userID]
        }
        })
    const points = [points1, points2]
    return points
}


module.exports = {
    checkAlias,
    getUserFromAlias,
    getRandomAliasOfUserFromUserID,
    formatAliases,
    getPointsOfUserFromUserID,
    getRanking,
    mapGameResults,
    getAllAliasesOfAlias
}