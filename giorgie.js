const data=utils.loadData()

bot.command('addAlias', async (ctx) =>  {
    const chatID = ctx.chat.id
    const chat = data.find(chat => chat.chatID == chatID)
    let [, alias, newAlias] = (ctx.message.text).split(' ')
    const userID = userFromAlias(alias)
    if (!checkAlias(alias)) {
        await ctx.reply("Questo utente non esiste")
    } else if (checkAlias(newAlias)) {
        await ctx.reply("Questo alias esiste già")
    } else {
        let user = chat.users.find(user => user.userID == userID)
        user.aliases.push(newAlias)
        await ctx.reply("Alias aggiunto con successo!")
    }
})




bot.command('removeAlias', async (ctx) =>  {
    const chatID = ctx.chat.id
    const chat = data.find(chat => chat.chatID == chatID)
    let [, alias] = (ctx.message.text).split(' ')
    const userID = userFromAlias(alias)
    if (!checkAlias(alias)) {
        await ctx.reply("Questo utente non esiste")
    } else {
        let user = chat.users.find(user => user.userID == userID)ù
        if (user.aliases.length>1){
            user.aliases.remove(Alias)
            await ctx.reply("Alias rimosso con successo!")
        }
    }
})



bot.command('remAlias', (ctx, Alias) =>  {
    let userID=userFromAlias
    for (const chat of data) {
        if (chat.chatID === ctx.chatID) {
            for (const user of chat.users) {
                if (user.ID === userID) {
                    if (user.aliases.includes(Alias) && user.aliases.length>1) {
                        user.aliases.push(Alias) // Aggiungi il nuovo alias se non esiste
                        await ctx.reply("Alias rimosso!")
                    }else{
                        await ctx.reply("Questo utente non ha questo alias")
                    }
                }
            }
        }
    }
    return null; // Restituisce null se l'utente non è trovato
})



const mapGameResults = (W, L, chatID) => {
    W.map(alias => userFromAlias(alias, chatID))
    L.map(alias => userFromAlias(alias, chatID))
    if (W.length==1){
        return {W[0]:4, L[0]:-1, L[1]:-1, L[2]:-1, L[3]:-1}
    }else if (W.length==2){
        return {W[0]:3, W[1]:3, L[0]:-2, L[1]:-2, L[2]:-2}
    }else if (W.length==3){
        return {W[0]:2, W[1]:2, W[2]:2, L[0]:-3, L[1]:-3}
    }else if (W.length==4){
        return {W[0]:1, W[0]:1, W[1]:1, W[2]:1, L[3]:-4}
    }
}