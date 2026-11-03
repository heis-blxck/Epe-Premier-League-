const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

const oldBlock = `  public async clearAllFantasySquads() {
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
  }`;

const newBlock = `  public async clearAllFantasySquads() {
    if (!firestore) {
      throw new Error("Firestore is not initialized.");
    }
    
    try {
      const querySnapshot = await firestore.collection('fantasySquads').get();
      const promises = querySnapshot.docs.map(doc => firestore.collection('fantasySquads').doc(doc.id).delete());
      await Promise.all(promises);
      console.log('Cleared fantasySquads from Firestore');
    } catch (err) {
      console.error('Failed to clear fantasySquads from Firestore', err);
      throw err;
    }

    // Update memory safely
    this.data.fantasySquads = [];
    if (this.data.users) {
      this.data.users = this.data.users.map(u => {
        delete u.fantasyTeamName;
        return u;
      });
    }
  }`;

code = code.replace(oldBlock, newBlock);
fs.writeFileSync('src/server/db.ts', code);
