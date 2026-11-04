const http = require('http');

http.get('http://localhost:3000/api/admin/force-firestore-sync', { method: 'POST' }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Sync response:', data));
});
