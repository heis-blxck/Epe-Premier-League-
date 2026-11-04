const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf8');

const target1 = `              if (updates.miniLeagues) this.data.miniLeagues = updates.miniLeagues;
              this.data.matches = [];
              this.data.events = [];
              this.data.ratings = {};
              this.data.predictions = [];
              this.data.fixture_chats = [];
              this.recalculateLeagueStatsAndStandings();`;

const replacement1 = `              if (updates.miniLeagues) this.data.miniLeagues = updates.miniLeagues;
              if (updates.matches) this.data.matches = updates.matches;
              if (updates.events) this.data.events = updates.events;
              if (updates.ratings) this.data.ratings = updates.ratings;
              if (updates.predictions) this.data.predictions = updates.predictions;
              if (updates.fixture_chats) this.data.fixture_chats = updates.fixture_chats;
              if (updates.playerOfTheMonth) this.data.playerOfTheMonth = updates.playerOfTheMonth;
              if (updates.managerChips) this.data.managerChips = updates.managerChips;
              if (updates.match_videos) this.data.match_videos = updates.match_videos;
              if (updates.epl_highlights) this.data.epl_highlights = updates.epl_highlights;
              this.recalculateLeagueStatsAndStandings();`;

if (content.includes(target1)) {
    content = content.replace(target1, replacement1);
    console.log("Patched db.ts");
} else if (content.includes(target1.replace(/\n/g, '\r\n'))) {
    content = content.replace(target1.replace(/\n/g, '\r\n'), replacement1.replace(/\n/g, '\r\n'));
    console.log("Patched db.ts (Windows)");
} else {
    // try line by line
    let lines = content.split(/\r?\n/);
    let out = [];
    for(let i = 0; i < lines.length; i++) {
        if(lines[i].includes('this.data.matches = [];')) continue;
        if(lines[i].includes('this.data.events = [];')) continue;
        if(lines[i].includes('this.data.ratings = {};')) continue;
        if(lines[i].includes('this.data.predictions = [];')) continue;
        if(lines[i].includes('this.data.fixture_chats = [];')) continue;
        
        if(lines[i].includes('if (updates.miniLeagues) this.data.miniLeagues = updates.miniLeagues;')) {
            out.push(lines[i]);
            out.push('              if (updates.matches) this.data.matches = updates.matches;');
            out.push('              if (updates.events) this.data.events = updates.events;');
            out.push('              if (updates.ratings) this.data.ratings = updates.ratings;');
            out.push('              if (updates.predictions) this.data.predictions = updates.predictions;');
            out.push('              if (updates.fixture_chats) this.data.fixture_chats = updates.fixture_chats;');
            out.push('              if (updates.playerOfTheMonth) this.data.playerOfTheMonth = updates.playerOfTheMonth;');
            out.push('              if (updates.managerChips) this.data.managerChips = updates.managerChips;');
            out.push('              if (updates.match_videos) this.data.match_videos = updates.match_videos;');
            out.push('              if (updates.epl_highlights) this.data.epl_highlights = updates.epl_highlights;');
            continue;
        }
        out.push(lines[i]);
    }
    fs.writeFileSync('src/server/db.ts', out.join('\n'), 'utf8');
    console.log("Patched db.ts by line by line removal");
}

