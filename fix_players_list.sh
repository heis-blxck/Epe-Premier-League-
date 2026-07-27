# Remove the leftover lines from the old getPlayersList
sed -i '/if (activeCategory === '"'"'assists'"'"') {/,/  };/d' src/components/LeagueStats.tsx
