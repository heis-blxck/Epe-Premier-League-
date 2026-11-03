const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

const oldBlock = `  public async resetFantasyTest() {
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
        
        const usersSnap = await firestore.collection('users').get();
        const userUpdatePromises = usersSnap.docs.map(doc => {
          return firestore.collection('users').doc(doc.id).update({
            fantasyTeamName: FieldValue.delete(),
            fantasySquadId: FieldValue.delete(),
            hasFantasyTeam: FieldValue.delete(),
            onboardingCompleted: FieldValue.delete()
          }).catch(e => console.error('Failed to update user', e));
        });
        await Promise.all(userUpdatePromises);
      } catch (err) {
        console.error('Failed to reset fantasy test in Firestore', err);
      }
    }
  }`;

const newBlock = `  public async resetFantasyTest() {
    if (!firestore) {
      throw new Error("Firestore is not initialized.");
    }
    
    try {
      // 1. Query ONLY the fantasySquads collection.
      // 2. Loop through and delete the squad documents ONLY.
      const querySnapshot = await firestore.collection('fantasySquads').get();
      const promises = querySnapshot.docs.map(doc => firestore.collection('fantasySquads').doc(doc.id).delete());
      await Promise.all(promises);
      console.log('Cleared fantasySquads from Firestore');
      
      // 4. Update the users collection to remove fantasy fields.
      const usersSnap = await firestore.collection('users').get();
      const userUpdatePromises = usersSnap.docs.map(doc => {
        return firestore.collection('users').doc(doc.id).update({
          fantasyTeamName: FieldValue.delete(),
          fantasySquadId: FieldValue.delete(),
          hasFantasyTeam: FieldValue.delete(),
          onboardingCompleted: FieldValue.delete()
        }).catch(e => console.error('Failed to update user', e));
      });
      await Promise.all(userUpdatePromises);
    } catch (err) {
      console.error('Failed to reset fantasy test in Firestore', err);
      throw err;
    }

    // Safely update memory without triggering global saveData which could wipe players
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
