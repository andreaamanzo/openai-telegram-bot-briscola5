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
        if(Object.keys(game.results).includes(user.userID)){     //c'è user
            points += game.results.user.userID
            }
        })
    return points
}

const ranking = (chatID) => {
    const chat = data.find(chat => chat.chatID == chatID)
    const result = []
    for (const user of chat.users){
        result.push([(randomAlias(user.aliases[0],chatID)), pointsOfAlias(user.aliases[0].chatID)])
    }
    const sortedResult = result.sort((a, b) => b[1] - a[1])
    return sortedResult
}


/*
const whoIs = (alias, chatID) => {
    const chat = data.find(chat => chat.chatID == chatID)
    const user = chat.users.find(user => user.aliases.includes(alias))
    return user.aliases
}
*/

const formatRanking = (chatID) => {
    let strRank = ""
    const arr = ranking(chatID)
    for (let i = 0; i < arr.length; i++) {
        strRank += `${i + 1}°- ${arr[i][0]} -> ${arr[i][1]} points\n`
        }
    return strRank
}


const formatAliases = (arr) => {
    if (arr.length === 1) return `1- ${arr[0]}`
    else {
      let strAlias = ""
      for (let i = 0; i < arr.length; i++) {
        strAlias += `${i + 1}- ${arr[i]}\n`
      }
      return strAlias
    }
}

const mapGameResults = (W, L, chatID) => {
    console.log(userFromAlias(W[0], chatID).userID)
    W.map(alias => userFromAlias(alias, chatID).userID)
    L.map(alias => userFromAlias(alias, chatID).userID)
    console.log(W)
    if (W.length==1){
        return {[W[0]]:4, [L[0]]:-1, [L[1]]:-1, [L[2]]:-1, [L[3]]:-1}
    }else if (W.length==2){
        return {[W[0]]:3, [W[1]]:3, [L[0]]:-2, [L[1]]:-2, [L[2]]:-2}
    }else if (W.length==3){
        return {[W[0]]:2, [W[1]]:2, [W[2]]:2, [L[0]]:-3, [è]:-3}
    }else if (W.length==4){
        return {[W[0]]:1, [W[0]]:1, [W[1]]:1, [W[2]]:1, [L[3]]:-4}
    }
}

/*
const head2Head = (alias1, alias2, chatID) =>{

}
*/

module.exports = {
    checkAlias,
    userFromAlias,
    randomAlias,
    formatAliases,
    formatRanking,
    pointsOfAlias,
    ranking,
    mapGameResults
}