const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf8');

const targetStr = `      p.fantasyPoints = this.calculatePlayerSeasonPoints(p);
    });

    // Recalculate Fantasy Squad points for all managers based on updated player stats`;

const replacementStr = `      p.fantasyPoints = this.calculatePlayerSeasonPoints(p);

      if (firestore && this.isFirestoreSynced) {
        firestore.collection('players').doc(p.id).set({
          goals: p.goals,
          assists: p.assists,
          cleanSheets: p.cleanSheets,
          cupGoals: p.cupGoals,
          cupAssists: p.cupAssists,
          cupCleanSheets: p.cupCleanSheets,
          bonusPoints: p.bonusPoints,
          fantasyPoints: p.fantasyPoints
        }, { merge: true }).catch(e => {});
      }
    });

    // Recalculate Fantasy Squad points for all managers based on updated player stats`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/server/db.ts', content, 'utf8');
  console.log("Success");
} else {
  console.log("Not found");
}
