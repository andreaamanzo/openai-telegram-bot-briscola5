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
    head2head
  } = require("./botComponents")


const completionWithFunctions = async (options) => {
    const {
        openai,
        messages,
        model = "gpt-4",
        prompt
    } = options

    const tools = functions.map(({ definition }) => ({
        type: "function",
        function: definition
    }))

    // Add the prompt to the list of messages
    messages.push({
        role: "user",
        content: prompt
    })

    const firstCompletion = await openai.chat.completions.create({
        model,
        messages,
        tools
    })

    const firstMessage = firstCompletion.choices[0].message
    const { tool_calls } = firstMessage

    // Add the message to the list of messages
    messages.push(firstMessage)
    if (tool_calls) {
        // The assistant has requested one or more tool calls
        for (const toolCall of tool_calls) {
            const functionName = toolCall.function.name
            const functionArguments = JSON.parse(toolCall.function.arguments)

            const targetFunction = functions.find(({ definition }) => definition.name === functionName)
            if (!targetFunction) {
                throw new Error(`Function ${functionName} not found`)
            }

            const functionHandler = targetFunction.handler
            const result = functionHandler(functionArguments)

            // Add the result to the list of messages
            messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(result)
            })
        }
    }

    const secondCompletion = await openai.chat.completions.create({
        model,
        messages,
        tools
    })

    return secondCompletion.choices[0].message.content
}


const functions = [{
    definition: {
        name: "createuser",
        description: `Data una stringa che rappresenta un nome utente, 
        aggiunge tale user all'elenco degli utenti che partecipano nella stessa chat, controllando se esiste già`,
        parameters: {
            type: "object",
            properties: {
                alias: {
                    type: "string"
                },
                chatID: {
                    type: "string"
                }
            },
        }
    },
    handler: (options) => {
        const {
            alias,
            chatID,
        } = options
        const userObj = createuser(alias, chatID)
        console.log("qua") //aggiungi i due parametri
        return userObj
    }
}, {
    definition: {
        name: "users",
        description: `Dato un chatID, stampa l'elenco degli utenti nella chat con il chatID passato, mostrando uno dei suoi alias.`,
        parameters: {
            type: "object",
            properties: {
                chatID: {
                    type: "string",
                },
            },
        },
    },
    handler: (options) => {
        const {
            chatID
        } = options
        const usersObj = users(chatID)
        return usersObj
    }
}, {
    definition: {
        name: "addalias",
        description: `la funzione accetta una stringa che rappresenta un alias(il soprannome di un utente) e almeno un'altra stringa
        che rappresenta un nuovo alias di quell'utente. la funzione non può registrare più stringhe come nuovo alias
        quindi devi chiamare più volte la funzione una volta per ogni nuovo alias`,
        parameters: {
            type: "object",
            properties: {
                alias: {
                    type: "string"
                },
                newAlias : {
                    type: "string"
                },
                chatID: {
                    type: "string"
                }
            },
        }
    },
    handler: (options) => {
        const {
            alias,
            newAlias, 
            chatID
        } = options
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
                },
                chatID: {
                    type: "string"
                }
            },
        }
    },
    handler: (options) => {
        const {
            alias,
            chatID
        } = options
        const removealiasObj = removealias(alias, chatID)
        return removealiasObj
    }
}, {
    definition: {
        name: "ranking",
        description: ` La funzione chiamata stampa la classifica della partita in cui 
        stiamo giocando, mostrando i punti totali di ogni giocatore.
        Non mostrare mai il chatID`,
        parameters: {
            type: "object",
            properties: {
                chatID: {
                    type: "string"
                }
            }
        },
    },
    handler: (options) => {
        const {
            chatID
        } = options
        const rankStr = ranking(chatID)
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
                },
                chatID: {
                    type: "string"
                }
            },
        }
    },
    handler: (options) => {
        const {
            alias,
            chatID
        } = options
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
                },
                chatID: {
                    type: "string"
                }
            },
        }
    },
    handler: (options) => {
        const {
            alias,
            chatID
        } = options
        const pointsStr = pointsof(alias, chatID)
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
                },
                chatID: {
                    type: "string"
                }
            },
        }
    },
    handler: (options) => {
        const {
            alias1,
            alias2,
            chatID
        } = options
        const head2headObj = head2head(alias1, alias2, chatID)
        return head2headObj
    }
    }
    ,{
    definition: {
        name: "game",
        description:`
        Sono dati due array, uno dei vincitori e uno dei perdenti contenenti uno degli alias dei vincitori 
        o dei perdenti. Dati questi dati deve 
        salvare i punteggi della partita sapendo che chi ha chiamato è il primo del suo gruppo, che sarà quello più piccolo.
        Questa non darà la classifica generale, ma solo quella della partita appena giocata.
        `,
        parameters: {
            type: "object",
            properties: {
                winners: {
                    type: "array",
                    items: {type: "string"}
                },
                loosers: {
                    type: "array",
                    items: {type: "string"}
                },
                chatID: {
                    type: "string"
                }
                }
            },
        }
    ,
    handler: (options) => {
        const {
            winners,
            loosers,
            chatID
        } = options
        const gameObj = game(winners, loosers, chatID)
        return gameObj
    }
    },{
        definition: {
            name: "removegame",
            description:`
            data la descrizione di un game ( due array, uno dei vincitori e uno dei perdenti contenenti uno degli alias dei vincitori
            o dei perdenti.) rimuove se esiste la partita giocata corrispondente.
            Se viene chiesto da eliminare l'ultimo game, allora prendi come array quelli del gameID con posizione [-1].
            `,
            parameters: {
                type: "object",
                properties: {
                    winners: {
                        type: "array",
                        items: {type: "string"}
                    },
                    loosers: {
                        type: "array",
                        items: {type: "string"}
                    },
                    chatID: {
                        type: "string"
                    }
                    }
                },
            }
        ,
        handler: (options) => {
            const {
                winners,
                loosers,
                chatID
            } = options
            const gameObj = removegame(winners, loosers, chatID)
            return gameObj
        }
    },{
        definition: {
            name: "undo",
            description:`
            elimina l'ultima partita giocata, chiede
            `,
            parameters: {
                type: "object",
                properties: {
                    winners: {
                        type: "array",
                        items: {type: "string"}
                    },
                    loosers: {
                        type: "array",
                        items: {type: "string"}
                    },
                    chatID: {
                        type: "string"
                    }
                    }
                },
            }
        ,
        handler: (options) => {
            const {
                winners,
                loosers,
                chatID
            } = options
            const gameObj = removegame(winners, loosers, chatID)
            return gameObj
        }
    },
]

module.exports = {
    functions,
    completionWithFunctions
}