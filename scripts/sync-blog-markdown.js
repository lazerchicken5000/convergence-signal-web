#!/usr/bin/env node
/**
 * Copy content/blog/*.md → public/blog/<slug>.md
 * Runs before build so agents can fetch raw markdown at /blog/<slug>.md
 *
 * This is a Node.js build script that runs OUTSIDE the Next.js bundler.
 * Stays as CommonJS because the web project's package.json doesn't set
 * "type": "module" — switching this one file to ESM would require either
 * a .mjs rename or a project-wide module type change. The eslint-disable
 * keeps the no-require-imports rule (a sensible default for source code)
 * without flagging this build helper.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
/* eslint-enable @typescript-eslint/no-require-imports */

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'blog');
const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'blog');

if (!fs.existsSync(CONTENT_DIR)) {
  console.log('No content/blog directory — skipping');
  process.exit(0);
}

// Clean and recreate public/blog
if (fs.existsSync(PUBLIC_DIR)) {
  fs.rmSync(PUBLIC_DIR, { recursive: true });
}
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
let copied = 0;

for (const file of files) {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
  const slugMatch = raw.match(/^slug:\s*(.+)$/m);
  const slug = slugMatch ? slugMatch[1].trim() : file.replace('.md', '');

  fs.writeFileSync(path.join(PUBLIC_DIR, `${slug}.md`), raw);
  copied++;
}

console.log(`Synced ${copied} blog markdown files → public/blog/`);
