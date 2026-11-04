const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf8');

content = content.replace(
  /public deleteNews\(id: string\) \{\n    this.data.news = this.data.news.filter\(n => n.id !== id\);\n    this.saveData\(this.data\);\n  \}/,
  `public deleteNews(id: string) {
    this.data.news = this.data.news.filter(n => n.id !== id);
    this.saveData(this.data);
    if (firestore && this.isFirestoreSynced) {
      deleteDoc(doc(firestore, 'news', id)).catch(e => console.error(e));
    }
  }`
);

content = content.replace(
  /public deleteAdvertisement\(id: string\): void \{\n    if \(\!this.data.advertisements\) return;\n    this.data.advertisements = this.data.advertisements.filter\(a => a.id !== id\);\n    this.saveData\(this.data\);\n  \}/,
  `public deleteAdvertisement(id: string): void {
    if (!this.data.advertisements) return;
    this.data.advertisements = this.data.advertisements.filter(a => a.id !== id);
    this.saveData(this.data);
    if (firestore && this.isFirestoreSynced) {
      deleteDoc(doc(firestore, 'advertisements', id)).catch(e => console.error(e));
    }
  }`
);

content = content.replace(
  /public deleteFixtureMessage\(chatId: string\): boolean \{\n    if \(\!this.data.fixture_chats\) return false;\n    const initialLen = this.data.fixture_chats.length;\n    this.data.fixture_chats = this.data.fixture_chats.filter\(c => c.id !== chatId\);\n    const deleted = this.data.fixture_chats.length < initialLen;\n    if \(deleted\) \{\n      this.saveData\(this.data\);\n    \}\n    return deleted;\n  \}/,
  `public deleteFixtureMessage(chatId: string): boolean {
    if (!this.data.fixture_chats) return false;
    const initialLen = this.data.fixture_chats.length;
    this.data.fixture_chats = this.data.fixture_chats.filter(c => c.id !== chatId);
    const deleted = this.data.fixture_chats.length < initialLen;
    if (deleted) {
      this.saveData(this.data);
      if (firestore && this.isFirestoreSynced) {
        deleteDoc(doc(firestore, 'fixture_chats', chatId)).catch(e => console.error(e));
      }
    }
    return deleted;
  }`
);

content = content.replace(
  /public deleteMatchVideo\(id: string\): boolean \{\n    if \(\!this.data.match_videos\) return false;\n    const initialLen = this.data.match_videos.length;\n    this.data.match_videos = this.data.match_videos.filter\(v => v.id !== id\);\n    const deleted = this.data.match_videos.length < initialLen;\n    if \(deleted\) \{\n      this.saveData\(this.data\);\n    \}\n    return deleted;\n  \}/,
  `public deleteMatchVideo(id: string): boolean {
    if (!this.data.match_videos) return false;
    const initialLen = this.data.match_videos.length;
    this.data.match_videos = this.data.match_videos.filter(v => v.id !== id);
    const deleted = this.data.match_videos.length < initialLen;
    if (deleted) {
      this.saveData(this.data);
      if (firestore && this.isFirestoreSynced) {
        deleteDoc(doc(firestore, 'match_videos', id)).catch(e => console.error(e));
      }
    }
    return deleted;
  }`
);

fs.writeFileSync('src/server/db.ts', content, 'utf8');
console.log('patched');
