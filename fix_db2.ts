import { db } from './src/server/db.js';
async function fix() {
  const settings = await db.getSettings();
  settings.appLogoUrl = '/logo.png';
  await db.saveSettings(settings);
  console.log("Updated");
  process.exit(0);
}
fix();
