const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

const potwMethods = `
  public getPlayerOfTheWeek(): PlayerOfTheWeek[] {
    return this.data.playerOfTheWeek || [];
  }

  public savePlayerOfTheWeek(potw: PlayerOfTheWeek) {
    if (!this.data.playerOfTheWeek) this.data.playerOfTheWeek = [];
    const index = this.data.playerOfTheWeek.findIndex(p => p.id === potw.id);
    if (index >= 0) {
      this.data.playerOfTheWeek[index] = potw;
    } else {
      this.data.playerOfTheWeek.push(potw);
    }
    this.saveData(this.data);
    return potw;
  }
`;

code = code.replace(
  'export const db = new DBStore();',
  potwMethods + '\n}\n\nexport const db = new DBStore();'
);

// We also need to remove the trailing '}' from the original file since we are injecting before '}'
code = code.replace(
  /  \}\n\}\n\nexport const db = new DBStore\(\);/,
  `  }\n${potwMethods}\n}\n\nexport const db = new DBStore();`
);

fs.writeFileSync('src/server/db.ts', code);
