const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\/\/ Server-Sent Events for Real-Time Notifications\s+useEffect\(\(\) => \{\s+const sse = new EventSource\('\/api\/notifications\/stream'\);\s+sse\.onmessage = async \(event\) => \{\s+try \{\s+const notif = JSON\.parse\(event\.data\);\s+if \(!notif \|\| !notif\.id\) return;\s+setNotifications\(prev => \{\s+if \(prev\.some\(n => n\.id === notif\.id\)\) return prev;\s+return \[notif, \.\.\.prev\];\s+\}\);\s+displayToast\(notif, 4000\);/;

const replacement = `  // Server-Sent Events for Real-Time Notifications
  const processedNotifs = React.useRef(new Set<string>());

  useEffect(() => {
    try {
      const stored = localStorage.getItem('processedNotifs');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.forEach((id: string) => processedNotifs.current.add(id));
      }
    } catch(e) {}

    const sse = new EventSource('/api/notifications/stream');
    
    sse.onmessage = async (event) => {
      try {
        const notif = JSON.parse(event.data);
        if (!notif || !notif.id) return;

        if (processedNotifs.current.has(notif.id)) return;
        processedNotifs.current.add(notif.id);

        try {
          const arr = Array.from(processedNotifs.current).slice(-50);
          localStorage.setItem('processedNotifs', JSON.stringify(arr));
        } catch(e) {}

        setNotifications(prev => {
          if (prev.some(n => n.id === notif.id)) return prev;
          return [notif, ...prev];
        });
        displayToast(notif, 4000);`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('src/App.tsx', content, 'utf8');
    console.log("Patched App.tsx");
} else {
    console.error("Target not found!");
    process.exit(1);
}
