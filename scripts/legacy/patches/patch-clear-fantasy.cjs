const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

const newMethod = `
  public async clearAllFantasySquads() {
    this.data.fantasySquads = [];
    if (this.data.users) {
      this.data.users = this.data.users.map(u => {
        delete u.fantasyTeamName;
        return u;
      });
    }
    this.saveData(this.data);
    
    if (firestore) {
      try {
        const querySnapshot = await firestore.collection('fantasySquads').get();
        const promises = querySnapshot.docs.map(doc => firestore.collection('fantasySquads').doc(doc.id).delete());
        await Promise.all(promises);
        console.log('Cleared fantasySquads from Firestore');
      } catch (err) {
        console.error('Failed to clear fantasySquads from Firestore', err);
      }
    }
  }

  public getMiniLeagues(): MiniLeague[] {`;

code = code.replace(/public getMiniLeagues\(\): MiniLeague\[\] \{/, newMethod);
fs.writeFileSync('src/server/db.ts', code);
