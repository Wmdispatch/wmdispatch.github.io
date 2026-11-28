// Copies the app's own files into www/ for the Android build.
// GitHub Pages keeps serving the same files from the repo root, untouched.
// sw.js is left out on purpose: inside the Android app the files ship with
// the app, and an offline worker would keep old files after an app update.
import { rmSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';

const FILES = [
  'index.html', 'manifest.webmanifest',
  'icon-192.png', 'icon-512.png', 'icon-maskable-512.png',
  'apple-touch-icon.png', 'favicon-48.png'
];
rmSync('www', { recursive: true, force: true });
mkdirSync('www');
for (const f of FILES) {
  if (!existsSync(f)) { console.error('Missing ' + f); process.exit(1); }
  copyFileSync(f, 'www/' + f);
}
console.log('www/ ready: ' + FILES.length + ' files');
