const utils = require("./utils")
const data = utils.loadData()

const checkAlias = (alias, chatID) => {
    const chat = data.find(chat => chat.chatID == chatID)
    return !!(chat?.users.find(user => user.aliases.includes(alias)))
}

const userFromAlias = (alias, chatID) => {
    const chat = data.find(chat => chat.chatID == chatID)
    const user = chat.users.find(user => user.aliases.includes(alias))
    return user
}

const randomAlias = (alias, chatID) => {
    const user = userFromAlias(alias, chatID)
    return user.aliases[Math.floor(Math.random() * user.aliases.length)] 
}

const pointsOfAlias = (alias, chatID) => {
    const user = userFromAlias(alias, chatID)
    let points = 0
    const chat = data.find(chat => chat.chatID == chatID)
    chat.games.forEach(game => {
        if (Object.keys(game.results).includes(user.userID.toString())) { // c'è user
            points += game.results[user.userID];
        }
        })
    return points
}

const ranking = (chatID) => {
    const chat = data.find(chat => chat.chatID == chatID)
    const result = []
    for (const user of chat.users) {
        const aliasCasuale = randomAlias(user.aliases[0], chatID)
        const punti = pointsOfAlias(user.aliases[0], chatID)
        result.push([aliasCasuale, punti])
    }
    const sortedResult = result.sort((a, b) => b[1] - a[1])
    return sortedResult
}



const getAllAliasesOfAlias = (alias, chatID) => {
    const chat = data.find(chat => chat.chatID == chatID)
    const user = chat.users.find(user => user.aliases.includes(alias))
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

const mapGameResults = (W, L, chatID) => {
    W = W.map(alias => userFromAlias(alias, chatID).userID)
    L = L.map(alias => userFromAlias(alias, chatID).userID)
    if (W.length==1){
        return {[W[0]]:4, [L[0]]:-1, [L[1]]:-1, [L[2]]:-1, [L[3]]:-1}
    }else if (W.length == 2){
        return {[W[0]]:2, [W[1]]:1, [L[0]]:-1, [L[1]]:-1, [L[2]]:-1}
    }else if (W.length == 3){
        return {[W[0]]:1, [W[1]]:1, [W[2]]:1, [L[0]]:-2, [L[1]]:-1}
    }else if (W.length == 4){
        return {[W[0]]:1, [W[0]]:1, [W[1]]:1, [W[2]]:1, [L[3]]:-4}
    }
}

const getPointsFromHeadToHead = (alias1, alias2, chatID) => {
    const user1 = userFromAlias(alias1, chatID)
    const user2 = userFromAlias(alias2, chatID)
    let points1 = 0
    let points2 = 0

    const chat = data.find(chat => chat.chatID == chatID)
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
    userFromAlias,
    randomAlias,
    formatAliases,
    pointsOfAlias,
    ranking,
    mapGameResults,
    getAllAliasesOfAlias
}