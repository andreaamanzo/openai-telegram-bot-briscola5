

const aliasArr = ["abc", "def"]

function formatAliases(arr) {
    if (arr.length === 1) return `1- ${arr[0]}`
    else {
      let strAlias = ""
      for (let i = 0; i < arr.length; i++) {
        strAlias += `${i + 1}- ${arr[i]}\n`
      }
      return strAlias
    }
  }

console.log(formatAliasList(aliasArr))


/* */