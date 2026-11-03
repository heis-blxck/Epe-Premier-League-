const code = `
const querySnapshot = await getDocs(collection(firestore, col));
const teamsSnap = await getDocs(collection(firestore, 'teams'));
`;
const res = code.replace(/getDocs\(\s*collection\(\s*firestore\s*,\s*([^)]+)\s*\)\s*\)/g, (match, p1) => {
    return `firestore.collection(${p1.trim()}).get()`;
});
console.log(res);
