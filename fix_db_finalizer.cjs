const fs = require('fs');
let code = fs.readFileSync('src/server/db.ts', 'utf8');

const regex = /    this\.data\.players\.forEach\(p => \{\n      p\.ownedByCount = ownershipCount\.get\(p\.id\) \|\| 0;\n      p\.captainedByCount = captaincyCount\.get\(p\.id\) \|\| 0;\n      if \(firestore && this\.isFirestoreSynced\) \{\n        \/\/ Fire & forget to Firestore\n        setDoc\(doc\(firestore, 'players', p\.id\), p, \{ merge: true \}\)\.catch\(e => console\.error\(e\)\);\n      \}\n    \}\);/g;

const replacement = `    this.data.players.forEach(p => {
      p.ownedByCount = ownershipCount.get(p.id) || 0;
      p.captainedByCount = captaincyCount.get(p.id) || 0;
      if (firestore && this.isFirestoreSynced) {
        // Fire & forget to Firestore
        setDoc(doc(firestore, 'players', p.id), p, { merge: true }).catch(e => console.error(e));
      }
    });

    // Calculate the single-read metadata payload
    const topPerformers = [...(this.data.players || [])].sort((a, b) => (b.fantasyPoints || 0) - (a.fantasyPoints || 0)).slice(0, 10);
    const mostOwnedPlayers = [...(this.data.players || [])].sort((a, b) => (b.ownedByCount || 0) - (a.ownedByCount || 0)).slice(0, 5);
    const mostCaptainedPlayers = [...(this.data.players || [])].sort((a, b) => (b.captainedByCount || 0) - (a.captainedByCount || 0)).slice(0, 5);
    
    if (firestore && this.isFirestoreSynced) {
       setDoc(doc(firestore, 'system_configs', 'fantasy_dashboard_stats'), {
           topPerformers,
           mostOwnedPlayers,
           mostCaptainedPlayers,
           lastUpdated: Date.now()
       }, { merge: true }).catch(e => console.error(e));

       setDoc(doc(firestore, 'system_configs', 'player_version'), {
           last_updated: Date.now()
       }, { merge: true }).catch(e => console.error(e));
    }`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/server/db.ts', code);
