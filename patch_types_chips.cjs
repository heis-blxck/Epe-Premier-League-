const fs = require('fs');
let types = fs.readFileSync('src/types.ts', 'utf8');

if (!types.includes('export interface ManagerChips')) {
  types += `
export interface ManagerChips {
  userId: string;
  tripleCaptainAvailable: boolean;
  tripleCaptainUsedGw?: number;
  benchBoostAvailable: boolean;
  benchBoostUsedGw?: number;
  wildcardAvailable: boolean;
  wildcardUsedGw?: number;
}
`;
  fs.writeFileSync('src/types.ts', types);
}
console.log("Types patched");
