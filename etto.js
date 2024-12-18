

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

function generateAsciiTable(data) {
  const topBorder = "╔═════════════════╦══════════════╦═══════════╗";
  const header = "║ Posizione       ║ Giocatore    ║ Punteggio ║";
  const separator = "╠═════════════════╬══════════════╬═══════════╣";
  const bottomBorder = "╚═════════════════╩══════════════╩═══════════╝";

  // Funzione per formattare una riga
  function formatRow(position, player, score) {
      const posColumn = position.padEnd(16, ' ');
      const playerColumn = player.padEnd(12, ' ');
      const scoreColumn = score.toString().padStart(9, ' ');
      return `║ ${posColumn}║ ${playerColumn}║ ${scoreColumn} ║`;
  }

  // Costruisci il corpo della tabella
  const rows = data.map((entry, index) =>
      formatRow(`${index + 1}°`, entry.player, entry.score)
  );

  // Unisci tutte le parti
  return [
      topBorder,
      header,
      separator,
      ...rows,
      bottomBorder
  ].join("\n");
}

// Dati di esempio
const leaderboard = [
  { player: "RedCapybara69", score: 15 },
  { player: "Random1", score: 12 },
  { player: "Random2", score: 8 },
  { player: "Random3", score: 5 },
  { player: "Random4", score: 2 },
];

// Genera e stampa la tabella
console.log(generateAsciiTable(leaderboard));
