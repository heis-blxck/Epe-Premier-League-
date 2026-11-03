const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf8');

// I'll add `listenToFirestore` to `init` if it doesn't exist
if (content.includes('this.listenToFirestoreCollections();')) {
    console.log("Already listening");
    process.exit(0);
}

const targetInit = `    if (firestore) {
        this.syncFromFirestore();
    }
    return this.data;
  }`;

const replacementInit = `    if (firestore) {
        this.syncFromFirestore().then(() => {
            this.listenToFirestoreCollections();
        });
    }
    return this.data;
  }`;

if (content.includes(targetInit)) {
    content = content.replace(targetInit, replacementInit);
} else if (content.includes(targetInit.replace(/\n/g, '\r\n'))) {
    content = content.replace(targetInit.replace(/\n/g, '\r\n'), replacementInit.replace(/\n/g, '\r\n'));
} else {
    // maybe try to replace just `this.syncFromFirestore();`
    const targetInitAlt = `this.syncFromFirestore();`;
    const replacementInitAlt = `this.syncFromFirestore().then(() => { this.listenToFirestoreCollections(); });`;
    content = content.replace(targetInitAlt, replacementInitAlt);
}

const methodToAdd = `
  private listenToFirestoreCollections() {
      if (!firestore) return;
      const collections = ['settings', 'teams', 'players', 'matches', 'events', 'news', 'users', 'admins', 'notifications', 'ratings', 'predictions', 'fantasySquads', 'miniLeagues', 'advertisements', 'playerOfTheMonth', 'managerChips', 'match_videos', 'fixture_chats', 'epl_highlights'];
      
      collections.forEach(col => {
          firestore.collection(col).onSnapshot((querySnapshot: any) => {
              const items: any[] = [];
              querySnapshot.forEach((docSnap: any) => {
                  const data = docSnap.data();
                  this.lastFirestoreSyncState[\`\${col}_\${docSnap.id}\`] = stableStringify(data);
                  items.push(data);
              });
              
              if (col === 'settings') {
                  this.data.settings = items.length > 0 ? items[0] : INITIAL_SETTINGS;
              } else if (col === 'ratings') {
                  const ratingsObj: any = {};
                  items.forEach(item => { ratingsObj[item.id] = item.rating; });
                  this.data.ratings = ratingsObj;
              } else if (col === 'teams') {
                  this.data.teams = items.filter((t: any) =>
                      !DELETED_SEED_TEAM_IDS.has(t.id) &&
                      !DELETED_SEED_TEAM_NAMES.has((t.name || '').trim().toLowerCase())
                  );
              } else if (col === 'players') {
                  const validTeamIds = new Set((this.data.teams || []).map(t => t.id));
                  this.data.players = items.filter((p: any) =>
                      p.teamId && validTeamIds.has(p.teamId) && !DELETED_SEED_TEAM_IDS.has(p.teamId)
                  );
              } else {
                  (this.data as any)[col] = items;
              }
              this.recalculateLeagueStatsAndStandings();
              try {
                fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
              } catch (e) {}
          }, (err: any) => {
              console.error(\`Firestore onSnapshot error for \${col}:\`, err);
          });
      });
      console.log('Started listening to Firestore collections for real-time updates');
  }
`;

content = content.replace('private async syncFromFirestore() {', methodToAdd + '\n  private async syncFromFirestore() {');

fs.writeFileSync('src/server/db.ts', content, 'utf8');
console.log("Added listenToFirestoreCollections");
