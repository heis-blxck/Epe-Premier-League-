const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf8');

const targetStr = `        t.goalDifference = computed.goalsFor - computed.goalsAgainst;
        t.points = Math.max(0, computed.points - (t.pointsDeduction || 0));
      }
    });

    // Recalculate Player Goals, Assists, Clean Sheets`;

const replacementStr = `        t.goalDifference = computed.goalsFor - computed.goalsAgainst;
        t.points = Math.max(0, computed.points - (t.pointsDeduction || 0));
      }
      
      if (firestore && this.isFirestoreSynced) {
        firestore.collection('teams').doc(t.id).set({
          matchesPlayed: t.matchesPlayed,
          won: t.won,
          drawn: t.drawn,
          lost: t.lost,
          goalsFor: t.goalsFor,
          goalsAgainst: t.goalsAgainst,
          goalDifference: t.goalDifference,
          points: t.points
        }, { merge: true }).catch(e => {});
      }
    });

    // Recalculate Player Goals, Assists, Clean Sheets`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/server/db.ts', content, 'utf8');
  console.log("Success");
} else {
  console.log("Not found");
}
