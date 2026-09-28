import { cp, mkdir, readdir, rm, copyFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const output = resolve(root, '.build', 'firefox');
const excluded = new Set(['.git', '.build', 'node_modules', 'LinkFlow.zip', 'LinkFlow.crx', 'manifest.firefox.json', 'build-firefox.mjs']);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const entry of await readdir(root, { withFileTypes: true })) {
  if (excluded.has(entry.name)) continue;
  const source = join(root, entry.name);
  const destination = join(output, entry.name);
  if (entry.isDirectory()) {
    await cp(source, destination, { recursive: true });
  } else {
    await copyFile(source, destination);
  }
}

await copyFile(join(root, 'manifest.firefox.json'), join(output, 'manifest.json'));
console.log(`Firefox package prepared at ${output}`);
