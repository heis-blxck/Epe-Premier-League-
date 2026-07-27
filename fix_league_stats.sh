sed -i 's/interface LeagueStatsProps {/interface LeagueStatsProps {\n  competition?: "league" | "cup";/g' src/components/LeagueStats.tsx
sed -i 's/export const LeagueStats: React.FC<LeagueStatsProps> = ({ stats, teams }) => {/export const LeagueStats: React.FC<LeagueStatsProps> = ({ stats, teams, competition = "league" }) => {/g' src/components/LeagueStats.tsx
sed -i '/const \[activeCompetition, setActiveCompetition\] = useState<"league" | "cup">("league");/d' src/components/LeagueStats.tsx
sed -i 's/if (activeCompetition === "cup") {/if (competition === "cup") {/g' src/components/LeagueStats.tsx
sed -i '/<div className="flex gap-2 w-full sm:w-auto">/,/<\/div>/d' src/components/LeagueStats.tsx
