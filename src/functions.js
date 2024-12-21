const { addalias,
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
  } = require("./botComponents")


const completionWithFunctions = async (options) => {
    const {
        openai,
        messages,
        model = "gpt-3.5-turbo",
        prompt,
        functions
    } = options;

    const tools = functions.map(({ definition }) => ({
        type: "function",
        function: definition
    }));

    // Add the prompt to the list of messages
    messages.push({
        role: "user",
        content: prompt
    });

    let firstCompletion = await openai.chat.completions.create({
        model,
        messages,
        tools
    });

    let firstMessage = firstCompletion.choices[0].message;
    let { tool_calls } = firstMessage;
    console.log('----------tool calls----------------')
    console.log(tool_calls)
    console.log('------------------------------------')

    // Add the message to the list of messages
    messages.push(firstMessage)

    let secondMessage = firstMessage

    while (true) {
        if (tool_calls) {
            // The assistant has requested one or more tool calls
            for (const toolCall of tool_calls) {
                const functionName = toolCall.function.name;
                const functionArguments = JSON.parse(toolCall.function.arguments);
    
                const targetFunction = functions.find(({ definition }) => definition.name === functionName);
                if (!targetFunction) {
                    throw new Error(`Function ${functionName} not found`);
                }
    
                const functionHandler = await targetFunction.handler;
    
                // Handle each call and continue processing the rest
                const result = functionHandler(functionArguments);
                console.log('----------result----------------')
                console.log(result)
                console.log('------------------------------------')
    
                // Add the result to the list of messages
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result)
                });
    
            }
    
            // next response
            const secondCompletion = await openai.chat.completions.create({
                model,
                messages,
                tools
            });
            
            secondMessage = secondCompletion.choices[0].message;

            tool_calls = secondMessage.tool_calls;

            console.log('----------tool calls----------------')
            console.log(tool_calls)
            console.log('------------------------------------')
    
            messages.push(secondMessage);
    
        } else {
            // The assistant has not requested any tool calls
            return secondMessage.content;
        }

    }
};





const functions = [
    {
        definition: {
            name: "createuser",
            description: "Crea un nuovo utente in una chat specifica utilizzando un alias e restituisce un oggetto con i dettagli dell'utente creato o un messaggio di errore.",
            parameters: {
                type: "object",
                properties: {
                    alias: {
                        type: "string",
                        description: "Alias dell'utente da creare."
                    },
                    chatID: {
                        type: "number",
                        description: "ID della chat in cui creare l'utente."
                    }
                }
            }
        },
        handler: (options) => {
            const { alias, chatID } = options;
            const userObj = createuser(alias, chatID);
            return userObj;
        }
    },
    {
        definition: {
            name: "users",
            description: "Restituisce l'elenco degli utenti di una chat specifica o un messaggio di errore.",
            parameters: {
                type: "object",
                properties: {
                    chatID: {
                        type: "number",
                        description: "ID della chat da cui recuperare l'elenco degli utenti."
                    }
                }
            }
        },
        handler: (options) => {
            const { chatID } = options;
            const usersObj = users(chatID);
            return usersObj;
        }
    },
    {
        definition: {
            name: "addalias",
            description: "Aggiunge un nuovo alias a un utente esistente e restituisce l'utente aggiornato o un messaggio di errore.",
            parameters: {
                type: "object",
                properties: {
                    alias: {
                        type: "string",
                        description: "Alias esistente dell'utente."
                    },
                    newAlias: {
                        type: "string",
                        description: "Nuovo alias da aggiungere."
                    },
                    chatID: {
                        type: "number",
                        description: "ID della chat in cui aggiornare l'alias."
                    }
                }
            }
        },
        handler: (options) => {
            const { alias, newAlias, chatID } = options;
            const addaliasObj = addalias(alias, newAlias, chatID);
            return addaliasObj;
        }
    },
    {
        definition: {
            name: "removealias",
            description: "Rimuove un alias da un utente e restituisce l'utente aggiornato o un messaggio di errore.",
            parameters: {
                type: "object",
                properties: {
                    alias: {
                        type: "string",
                        description: "Alias da rimuovere."
                    },
                    chatID: {
                        type: "number",
                        description: "ID della chat in cui rimuovere l'alias."
                    }
                }
            }
        },
        handler: (options) => {
            const { alias, chatID } = options;
            const removealiasObj = removealias(alias, chatID);
            return removealiasObj;
        }
    },
    {
        definition: {
            name: "ranking",
            description: "Restituisce la classifica attuale di una chat specifica o un messaggio di errore.",
            parameters: {
                type: "object",
                properties: {
                    chatID: {
                        type: "number",
                        description: "ID della chat da cui recuperare la classifica."
                    }
                }
            }
        },
        handler: (options) => {
            const { chatID } = options;
            const rankStr = ranking(chatID);
            return rankStr;
        }
    },
    {
        definition: {
            name: "whoisalias",
            description: "Restituisce tutti gli alias di un utente dato un alias esistente o un messaggio di errore.",
            parameters: {
                type: "object",
                properties: {
                    alias: {
                        type: "string",
                        description: "Alias dell'utente di cui recuperare tutti gli alias."
                    },
                    chatID: {
                        type: "number",
                        description: "ID della chat in cui cercare l'alias."
                    }
                }
            }
        },
        handler: (options) => {
            const { alias, chatID } = options;
            const aliasesObj = whoisalias(alias, chatID);
            return aliasesObj;
        }
    },
    {
        definition: {
            name: "pointsof",
            description: "Restituisce i punti attuali di un utente dato un alias o un messaggio di errore.",
            parameters: {
                type: "object",
                properties: {
                    alias: {
                        type: "string",
                        description: "Alias dell'utente di cui recuperare i punti."
                    },
                    chatID: {
                        type: "number",
                        description: "ID della chat in cui cercare l'alias."
                    }
                }
            }
        },
        handler: (options) => {
            const { alias, chatID } = options;
            const pointsStr = pointsof(alias, chatID);
            return pointsStr;
        }
    },
    {
        definition: {
            name: "head2head",
            description: "Confronta due utenti in base ai punti accumulati nelle partite in cui hanno giocato insieme e restituisce il vincitore, il perdente e i punti, o un messaggio di errore.",
            parameters: {
                type: "object",
                properties: {
                    alias1: {
                        type: "string",
                        description: "Alias del primo utente."
                    },
                    alias2: {
                        type: "string",
                        description: "Alias del secondo utente."
                    },
                    chatID: {
                        type: "number",
                        description: "ID della chat in cui effettuare il confronto."
                    }
                }
            }
        },
        handler: (options) => {
            const { alias1, alias2, chatID } = options;
            const head2headObj = head2head(alias1, alias2, chatID);
            return head2headObj;
        }
    },
    {
        definition: {
            name: "game",
            description: "Registra i risultati di una partita dato un elenco di vincitori e perdenti e aggiorna la classifica, oppure restituisce un messaggio di errore.",
            parameters: {
                type: "object",
                properties: {
                    winners: {
                        type: "array",
                        items: {
                            type: "string",
                            description: "Alias dei vincitori."
                        }
                    },
                    loosers: {
                        type: "array",
                        items: {
                            type: "string",
                            description: "Alias dei perdenti."
                        }
                    },
                    chatID: {
                        type: "number",
                        description: "ID della chat in cui registrare la partita."
                    }
                }
            }
        },
        handler: (options) => {
            const { winners, loosers, chatID } = options;
            const gameObj = game(winners, loosers, chatID);
            return gameObj;
        }
    },
    {
        definition: {
            name: "removegame",
            description: "Rimuove una partita registrata dato l'elenco di vincitori e perdenti, oppure restituisce un messaggio di errore.",
            parameters: {
                type: "object",
                properties: {
                    winners: {
                        type: "array",
                        items: {
                            type: "string",
                            description: "Alias dei vincitori."
                        }
                    },
                    loosers: {
                        type: "array",
                        items: {
                            type: "string",
                            description: "Alias dei perdenti."
                        }
                    },
                    chatID: {
                        type: "number",
                        description: "ID della chat in cui cercare e rimuovere la partita."
                    }
                }
            }
        },
        handler: (options) => {
            const { winners, loosers, chatID } = options;
            const gameObj = removegame(winners, loosers, chatID);
            return gameObj;
        }
    },
    {
        definition: {
            name: "undo",
            description: "Annulla l'ultima partita registrata nella chat specificata.",
            parameters: {
                type: "object",
                properties: {
                    chatID: {
                        type: "number",
                        description: "ID della chat in cui annullare l'ultima partita."
                    }
                }
            }
        },
        handler: (options) => {
            const { chatID } = options;
            const undoObj = undo(chatID);
            return undoObj;
        }
    }
];



module.exports = {
    functions,
    completionWithFunctions
}