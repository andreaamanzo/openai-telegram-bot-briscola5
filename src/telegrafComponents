const { Telegraf, Markup } = require('telegraf')
const { formatTimestamp, truncateAlias } = require('./components')

const gameLogMessage = (options, itemsPerPage, currentPage = 1) => {
    const totalPages = Math.ceil(options.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const optionsToShow = options.slice(startIndex, endIndex)

    let message = `*Registro partite - Pagina ${currentPage} di ${totalPages}*\n\n`
    optionsToShow.forEach((option, index) => {
        message += `*${formatTimestamp(option.timestamp)}*\n`
        for (let [alias, score] of Object.entries(option.results)) {
            message += ` ${alias}: ${score >= 0 ? "+" : ""}${score} ${score == 1 || score == -1 ? "punto" : "punti" }\n`
        }
        message += "\n"
    })
    
    return message
}

const useresMessage = (options, itemsPerPage, currentPage = 1) => {
    const totalPages = Math.ceil(options.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const optionsToShow = options.slice(startIndex, endIndex)

    let message = `* Elenco degli utenti - Pagina ${currentPage} di ${totalPages}*\n\n`
    optionsToShow.forEach((option, index) => {
        message += `- ${truncateAlias(option, 20)}\n`
    })

    return message

}

const sendPaginatedList = async (ctx, options, itemsPerPage, currentPage, type) => {
    const totalPages = Math.ceil(options.length / itemsPerPage)

    let message

    if (type === 'gamelog') {
        message = gameLogMessage(options, itemsPerPage, currentPage)
    } else if (type === 'users') {
        message = useresMessage(options, itemsPerPage, currentPage)
    } else {
        await ctx.answerCbQuery('Opzioni non valide!')
        return
    }
    // Inline keyboard con i pulsanti per navigare tra le pagine
    const navigationButtons = []
    if (currentPage > 1) {
        navigationButtons.push(Markup.button.callback('⬅️ Indietro', `PAGE_${type}_${currentPage - 1}`))
    }
    if (currentPage < totalPages) {
        navigationButtons.push(Markup.button.callback('Avanti ➡️', `PAGE_${type}_${currentPage + 1}`))
    }

    if (ctx.update.callback_query) {
        await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([navigationButtons]),
        })
    } else {
        await ctx.reply(message, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([navigationButtons]),
        })
    }
}



module.exports = {
    sendPaginatedList
}

