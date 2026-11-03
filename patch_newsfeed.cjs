const fs = require('fs');
let content = fs.readFileSync('src/components/NewsFeed.tsx', 'utf8');

const target = `{selectedArticle.authorTitle ||
                        "Senior Football Writer, Epe Dispatch"}`;
const targetWindows = target.replace(/\n/g, '\r\n');

const replacement = `{(selectedArticle.authorRole?.toUpperCase() === 'LEAGUE_OFFICIAL' || selectedArticle.authorRole?.toUpperCase() === 'OFFICIAL_LEAGUE') ? 'Football Association' : (selectedArticle.customReporterRole || selectedArticle.authorTitle || 'Reporter')}`;
const replacementWindows = replacement.replace(/\n/g, '\r\n');

if (content.includes(target)) {
    content = content.replace(target, replacement);
    console.log("Patched NewsFeed.tsx");
} else if (content.includes(targetWindows)) {
    content = content.replace(targetWindows, replacementWindows);
    console.log("Patched NewsFeed.tsx (Windows)");
} else {
    console.error("Target not found!");
}
fs.writeFileSync('src/components/NewsFeed.tsx', content, 'utf8');
