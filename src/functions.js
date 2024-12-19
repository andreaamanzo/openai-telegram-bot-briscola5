const functions = [{
    definition: {
        name: "createuser",
        description: `Dato una stringa che rappresenta un nome utente, 
        aggiunge tale user all'elenco degli utenti che partecipano, controllando se esiste già`,
        parameters: {
            type: "object",
            properties: {
                alias: {
                    type: "string"
                }
            },
        }
    },
    handler: (options) => {
        const userObj = createuser(alias, chatID) //aggiungi i due parametri
        return userObj
    }
}, {
    definition: {
        name: "users",
        description: `Stampa l'elenco degli utenti partecipanti`,
    },
    handler: (options) => {
        const usersStr = users(chatID)
        //const { n } = options
        return usersStr
    }
}, {
    definition: {
        name: "addalias",
        description: `Date una stringa rappresentante un alias (soprannome di un utente) di un utente e una seconda stringa rappresentate
        un nuovo alias di quell'utente, aggiunge il nuovo alias all'elenco degli aliases totali dell'utente stesso.`,
        parameters: {
            type: "object",
            properties: {
                alias1: {
                    type: "string"
                },
                alias2 : {
                    type: "string"
                }
            },
        }
    },
    handler: (options) => {
        const addaliasObj = addalias(alias, newAlias, chatID)
        return addaliasObj
    }
}, {
    definition: {
        name: "removealias",
        description: `Data una stringa rappresentante un alias (soprannome di un utente) di un utente, elimina tale alias
        dalla lista degli aliases dell'utente`,
        parameters: {
            type: "object",
            properties: {
                alias: {
                    type: "string"
                }
            },
        }
    },
    handler: (options) => {
        const removealiasObj = removealias(alias, chatID)
        return removealiasObj
    }
}, {
    definition: {
        name: "ranking",
        description: `Stampa la classifica della partita in cui stiamo giocando, mostrando i punti totali di ogni giocatore`,
    },
    handler: (options) => {
        const rankStr = ranking()
        return rankStr
    }
}, {
    definition: {
        name: "whoisalias",
        description: `Data una stringa rappresentante un alias (soprannome di un utente), stampa tutti gli aliases di quell'utente`,
        parameters: {
            type: "object",
            properties: {
                alias: {
                    type: "string"
                }
            },
        }
    },
    handler: (options) => {
        const aliasesObj = whoisalias(alias, chatID)
        return aliasesObj
    }
}, {
    definition: {
        name: "mypoints",
        description: `Data una stringa rappresentante un alias (soprannome di un utente), stampa solameente i punti dell'utente
        collegato a quell'alias`,
        parameters: {
            type: "object",
            properties: {
                alias: {
                    type: "string"
                }
            },
        }
    },
    handler: (options) => {
        const pointsStr = mypoints(alias, chatID)
        return pointsStr
    }
}, {
    definition: {
        name: "head2head",
        description: `Date due stringhe rappresentanti due aliases (soprannome di un utente) diversi, stampa chi è in vantaggio
        tra i due utenti calcolando i punti delle partite in cui hanno giocato entrambi`,
        parameters: {
            type: "object",
            properties: {
                alias1: {
                    type: "string"
                },
                alias2: {
                    type: "string"
                }
            },
        }
    },
    handler: (options) => {
        const head2headObj = head2head(alias1, alias2, chatID)
        return head2headObj
    },{
    definition: {
        name: "game",
        description: `Dati due array di stringhe, gli aliases (soprannome di un utente), uno dei vincitori e uno dei perdenti,
        separati da un "/", salva la partita e assegna i determinati punti. è necessario che il primo alias dell'array con lunghezza di 1 o 2,
        sarà chi ha chiamato, se con lui c'é un altro alias, questo è il suo alleato.`,
        parameters: {
            type: "object",
            properties: {
                winners: {
                    type: "array"
                },
                loosers: {
                    type: "array"
                }
                }
            },
        }
    },
    handler: (options) => {
        const gameObj = game(winners, loosers, chatID)
        return gameObj
    }
}
]

module.exports = {
    functions
}