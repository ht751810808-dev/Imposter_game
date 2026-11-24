import { cp, mkdir, rm } from 'node:fs/promises';

const output = new URL('./.cloudflare-assets/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const publicFiles = [
  "index.html",
  "examples.html",
  "rules.html",
  "words.html",
  "script.js",
  "style.css",
  "words.json",
  "sitemap.xml",
  "robots.txt",
  "_headers"
];
for (const file of publicFiles) {
  await cp(new URL(file, import.meta.url), new URL(file, output));
}
