import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { PUBLIC_PAGE_METADATA, injectPageMetadata } from '../server/pageMetadata';
const html = await readFile('dist/index.html', 'utf8');
await mkdir('dist/seo', { recursive: true });
await Promise.all(Object.keys(PUBLIC_PAGE_METADATA).map(path => writeFile(`dist/seo${path}.html`, injectPageMetadata(html, path))));
console.log('Generated metadata for public routes');
