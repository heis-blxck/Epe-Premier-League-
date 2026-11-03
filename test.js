function stableStringify(obj) {
    if (obj === undefined) return 'undefined';
    if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return `[${obj.map(item => item === undefined ? 'null' : stableStringify(item)).join(',')}]`;
    const keys = Object.keys(obj).sort();
    const parts = [];
    for (let i = 0; i < keys.length; i++) {
        const val = obj[keys[i]];
        if (val !== undefined) {
            parts.push(JSON.stringify(keys[i]) + ':' + stableStringify(val));
        }
    }
    return '{' + parts.join(',') + '}';
}

const obj1 = { b: 2, a: 1, c: undefined, d: [1, undefined, 2] };
const obj2 = { a: 1, b: 2, d: [1, null, 2] };
console.log(stableStringify(obj1) === stableStringify(obj2));
