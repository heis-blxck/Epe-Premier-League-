const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

// I will remove the first public getPlayerOfTheWeek to end and append it freshly
const index = code.lastIndexOf('  public getPlayerOfTheWeek(): PlayerOfTheWeek[] {');
if (index !== -1) {
  code = code.substring(0, index);
  
  // now I expect code to end with `return league; \n  }\n}\n`
  // I will just strip trailing `}\n}\n` and append correctly.
  code = code.replace(/  \}\n\}\n*$/, '  }\n');
  
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
}

export const db = new DBStore();
`;
  
  code += potwMethods;
  fs.writeFileSync('src/server/db.ts', code);
}
