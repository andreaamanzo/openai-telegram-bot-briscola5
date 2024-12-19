const { readFileSync, writeFileSync } = require("fs")
const { DATA_PATH } = require("./configs")

const loadData = () => {
    try {
        const data = readFileSync(DATA_PATH)
        return JSON.parse(data)
    } catch (_) {
        // Error loading data
        return {}
    }
}

const saveData = (data) => {
    writeFileSync(DATA_PATH, JSON.stringify(data, null, 2))
}

module.exports = {
    loadData,
    saveData
}