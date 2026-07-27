const fs = require('fs');

const dist = fs.readFileSync('dist/server.cjs', 'utf8');

const match = dist.match(/async function startServer\(\) \{([\s\S]*)\}\nstartServer\(\);/);
let body = match[1];

body = body.replace(/import_vite\.createServer/g, 'createViteServer');
body = body.replace(/import_path2\.default\.join/g, 'path.join');
body = body.replace(/import_express\.default\.static/g, 'express.static');
body = body.replace(/import_fs2\.default\.existsSync/g, 'fs.existsSync');
body = body.replace(/import_fs2\.default\.readFileSync/g, 'fs.readFileSync');

const newServer = `import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { DBStore } from './src/server/db';

const PORT = 3000;

async function startServer() {
` + body + `
}

startServer();
`;

fs.writeFileSync('server.ts', newServer);
