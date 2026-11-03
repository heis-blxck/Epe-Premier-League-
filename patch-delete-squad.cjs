const fs = require('fs');

// 1. Update server.ts
let serverCode = fs.readFileSync('server.ts', 'utf8');
const serverApiCode = `  app.post("/api/admin/clear-fantasy", async (req, res) => {`;
const newServerApiCode = `  app.post("/api/fantasy/reset-my-squad", async (req, res) => {
    try {
      const { squadId, userId } = req.body;
      if (!squadId || !userId) {
        return res.status(400).json({ error: 'Missing squadId or userId' });
      }
      await db.deleteFantasySquad(squadId, userId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/clear-fantasy", async (req, res) => {`;
serverCode = serverCode.replace(serverApiCode, newServerApiCode);
fs.writeFileSync('server.ts', serverCode);

// 2. Update src/server/db.ts
let dbCode = fs.readFileSync('src/server/db.ts', 'utf8');
const dbCodeAnchor = `  public async clearAllFantasySquads() {`;
const newDbCode = `  public async deleteFantasySquad(squadId: string, userId: string) {
    // 1. Remove from local memory
    if (this.data.fantasySquads) {
      this.data.fantasySquads = this.data.fantasySquads.filter(s => s.id !== squadId);
    }
    
    // 2. Update user profile to remove fantasy fields
    let updatedEmail = '';
    if (this.data.users) {
      this.data.users = this.data.users.map(u => {
        if (u.id === userId) {
          updatedEmail = u.email;
          delete u.fantasyTeamName;
          delete (u as any).fantasySquadId;
          delete (u as any).hasFantasyTeam;
          delete (u as any).onboardingCompleted;
        }
        return u;
      });
    }
    
    this.saveData(this.data);

    // 3. Sync to Firestore
    if (firestore) {
      try {
        await firestore.collection('fantasySquads').doc(squadId).delete();
        await firestore.collection('users').doc(userId).update({
          fantasyTeamName: FieldValue.delete(),
          fantasySquadId: FieldValue.delete(),
          hasFantasyTeam: FieldValue.delete(),
          onboardingCompleted: FieldValue.delete()
        });
      } catch (err) {
        console.error('Failed to delete squad in Firestore', err);
      }
    }
  }

  public async clearAllFantasySquads() {`;
dbCode = dbCode.replace(dbCodeAnchor, newDbCode);
fs.writeFileSync('src/server/db.ts', dbCode);

// 3. Update src/services/api.ts
let apiCode = fs.readFileSync('src/services/api.ts', 'utf8');
const apiCodeAnchor = `  async getMiniLeagues(): Promise<MiniLeague[]> {`;
const newApiCode = `  async resetMySquad(squadId: string, userId: string): Promise<void> {
    const res = await fetch('/api/fantasy/reset-my-squad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ squadId, userId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete fantasy squad');
    }
  },

  async getMiniLeagues(): Promise<MiniLeague[]> {`;
apiCode = apiCode.replace(apiCodeAnchor, newApiCode);
fs.writeFileSync('src/services/api.ts', apiCode);

// 4. Update src/components/FantasyLeagueView.tsx
let viewCode = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');
viewCode = viewCode.replace(
  `import { db } from '../firebase';\nimport { doc, deleteDoc, updateDoc, deleteField } from 'firebase/firestore';`,
  ``
);
viewCode = viewCode.replace(
  `      await deleteDoc(doc(db, 'fantasySquads', mySquad.id));
      await updateDoc(doc(db, 'users', currentUser.id), {
        hasFantasyTeam: false,
        onboardingCompleted: false,
        fantasySquadId: deleteField(),
        fantasyTeamName: deleteField()
      });`,
  `      await api.resetMySquad(mySquad.id, currentUser.id);`
);
fs.writeFileSync('src/components/FantasyLeagueView.tsx', viewCode);

