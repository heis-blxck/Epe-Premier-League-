const fs = require('fs');
let code = fs.readFileSync('src/components/FantasyLeagueView.tsx', 'utf8');

const timerLogic = `
  // 1b. Calculate Next Deadline
  const [timeLeft, setTimeLeft] = useState<{d: number, h: number, m: number, s: number} | null>(null);
  
  useEffect(() => {
    const nextScheduledMatches = (matches || [])
      .filter(m => m.status === 'Scheduled' && m.date && m.time)
      .map(m => {
        const kickoff = new Date(\`\${m.date}T\${m.time}:00\`);
        return { ...m, deadline: new Date(kickoff.getTime() - 4 * 60 * 60 * 1000) };
      })
      .filter(m => !isNaN(m.deadline.getTime()) && m.deadline > new Date())
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
      
    const nextMatch = nextScheduledMatches[0];
    
    if (!nextMatch) {
      setTimeLeft(null);
      return;
    }
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = nextMatch.deadline.getTime() - now;
      
      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft(null);
      } else {
        setTimeLeft({
          d: Math.floor(distance / (1000 * 60 * 60 * 24)),
          h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [matches]);
`;

if (!code.includes('const [timeLeft, setTimeLeft]')) {
  code = code.replace(
    '  // 2. Load Fantasy Data from API',
    timerLogic + '\n  // 2. Load Fantasy Data from API'
  );
  fs.writeFileSync('src/components/FantasyLeagueView.tsx', code);
  console.log("Timer logic added.");
}

