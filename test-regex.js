const code = `
setDoc(doc(firestore, 'matches', matchId), {
        homeVotes: match.homeVotes,
        drawVotes: match.drawVotes,
        awayVotes: match.awayVotes
      }, { merge: true }).catch(e => console.error(e));

promises.push(setDoc(doc(firestore, colMap.col, id), item));

setDoc(doc(firestore, 'players', p.id), p, { merge: true }).catch(e => console.error(e));
`;

const res = code.replace(/setDoc\(\s*doc\(\s*firestore\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*,\s*([\s\S]*?)\)(?=\.catch|\s*;|\s*$)/g, (match, p1, p2, p3) => {
    return `firestore.collection(${p1.trim()}).doc(${p2.trim()}).set(${p3.trim()})`;
});
console.log(res);
