const fs = require('fs');
let db = fs.readFileSync('src/server/db.ts', 'utf8');

if (!db.includes('getManagerChips')) {
  const newMethods = `
  public getManagerChips(userId: string): ManagerChips | null {
    if (!this.data.managerChips) return null;
    return this.data.managerChips.find(c => c.userId === userId) || null;
  }

  public saveManagerChips(chips: ManagerChips) {
    if (!this.data.managerChips) this.data.managerChips = [];
    const index = this.data.managerChips.findIndex(c => c.userId === chips.userId);
    if (index >= 0) {
      this.data.managerChips[index] = chips;
    } else {
      this.data.managerChips.push(chips);
    }
    this.saveData();
    if (firestore) {
      setDoc(doc(firestore, 'data', 'main'), { managerChips: this.data.managerChips }, { merge: true }).catch(e => console.error(e));
    }
    return chips;
  }
`;
  db = db.replace('public getPlayerOfTheWeek', newMethods + '\n  public getPlayerOfTheWeek');
  fs.writeFileSync('src/server/db.ts', db);
}
console.log("DB methods patched");
