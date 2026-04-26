import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildMinerGlb } from './miner-glb.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const outputDirectory = path.join(projectRoot, 'public', 'assets', 'models');
const outputPath = path.join(outputDirectory, 'tempo-miner.glb');

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, buildMinerGlb());

console.log(outputPath);
