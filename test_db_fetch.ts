import { initializeApp, cert } from 'firebase-admin/app';
import { getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.projectId
});

async function test() {
    try {
        const dbDefault = getFirestore();
        const snapDefault = await dbDefault.collection('teams').get();
        console.log("Default DB teams count:", snapDefault.size);
    } catch (e) {
        console.error("Default DB error:", e);
    }

    try {
        const dbCustom = getFirestore(getApp(), serviceAccount.firestoreDatabaseId);
        const snapCustom = await dbCustom.collection('teams').get();
        console.log("Custom DB teams count:", snapCustom.size);
    } catch (e) {
        console.error("Custom DB error:", e);
    }
}
test().catch(console.error);
