const fs = require('fs');
let content = fs.readFileSync('src/server/db.ts', 'utf8');

const target = `  public deleteNews(id: string) {
    this.data.news = this.data.news.filter(n => n.id !== id);
    this.saveData(this.data);
    if (firestore && this.isFirestoreSynced) {
      firestore.collection('news').doc(id).delete().catch(e => console.error(e));
    }
  }`;

const targetAlt = `  public deleteNews(id: string) {
    this.data.news = this.data.news.filter(n => n.id !== id);
    this.saveData(this.data);
    if (firestore) {
      firestore.collection('news').doc(id).delete().then(() => console.log('Deleted from Firestore: ', id)).catch(e => console.error(e));
    }
  }`;

const replacement = `  public deleteNews(id: string) {
    if (this.data.news) {
        this.data.news = this.data.news.filter(n => n.id !== id);
    }
    this.saveData(this.data);
    if (firestore) {
      firestore.collection('news').doc(id).delete().then(() => console.log('Deleted from Firestore: ', id)).catch(e => console.error(e));
    }
  }`;

if (content.includes(targetAlt)) {
    content = content.replace(targetAlt, replacement);
    console.log("Patched db.ts by wrapping in if(this.data.news)");
} else if (content.includes(targetAlt.replace(/\n/g, '\r\n'))) {
    content = content.replace(targetAlt.replace(/\n/g, '\r\n'), replacement.replace(/\n/g, '\r\n'));
    console.log("Patched db.ts (Windows)");
} else {
    console.error("Target not found!");
}
fs.writeFileSync('src/server/db.ts', content, 'utf8');
