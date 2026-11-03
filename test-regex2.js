const code = `
deleteDoc(doc(firestore, 'teams', id)).catch(e => console.error('Error deleting team doc:', e));
promises.push(deleteDoc(doc(firestore, colMap.col, docId)).catch(e => console.error(e)));
`;

const res = code.replace(/deleteDoc\(\s*doc\(\s*firestore\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*\)/g, (match, p1, p2) => {
    return `firestore.collection(${p1.trim()}).doc(${p2.trim()}).delete()`;
});
console.log(res);
