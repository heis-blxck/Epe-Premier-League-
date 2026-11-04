sed -i 's/<LeagueStats stats={stats} teams={teams} isCup={false} \/>/<LeagueStats stats={stats} teams={teams} competition="league" \/>/g' src/App.tsx
