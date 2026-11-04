const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');
const lines = code.split('\n');

const fixLine = (num) => {
    let index = num - 1; // 0-indexed
    if (lines[index].includes(')}')) {
        lines[index] = lines[index].replace(')}', '))}');
    }
}

fixLine(879);
fixLine(1131);
fixLine(1433);
fixLine(1452);
fixLine(1471);
fixLine(1490);
fixLine(1877);
fixLine(2145);
fixLine(2343);
fixLine(2449);

fs.writeFileSync('src/components/FantasyLeagueView.tsx', lines.join('\n'));
