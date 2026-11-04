const fs = require('fs');

let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

const oldCode = `      } else if (currentUser.fantasyTeamName && currentUser.fantasyTeamName.trim()) {
        // Fallback: User already has a registered Fantasy Team Name in profile
        setHasConfirmedParticipation(true);
        setSquadName(currentUser.fantasyTeamName.trim());
      }`;

const newCode = `      } else if (currentUser.fantasyTeamName && currentUser.fantasyTeamName.trim()) {
        // Fallback: User already has a registered Fantasy Team Name in profile
        setHasConfirmedParticipation(true);
        setSquadName(currentUser.fantasyTeamName.trim());
        setMySquad({
           id: 'new-squad',
           squadName: currentUser.fantasyTeamName.trim(),
           ownerId: currentUser.id,
           ownerName: currentUser.name || currentUser.email.split('@')[0],
           userEmail: currentUser.email,
           playerIds: [],
           startingPlayerIds: [],
           benchPlayerIds: [],
           totalPoints: 0,
           gameweekPoints: 0,
           remainingBudget: 100
        } as any);
      }`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
console.log('Fixed fantasy view');
