// Run after "npx cap add android": declares what the app uses on the phone.
// Camera: the in-app camera (getUserMedia). No location, no microphone.
import { readFileSync, writeFileSync } from 'node:fs';

const p = 'android/app/src/main/AndroidManifest.xml';
let x = readFileSync(p, 'utf8');
const perms = [
  '<uses-permission android:name="android.permission.INTERNET" />',
  '<uses-permission android:name="android.permission.CAMERA" />',
  '<uses-feature android:name="android.hardware.camera" android:required="false" />'
];
for (const line of perms) {
  const name = line.match(/android:name="([^"]+)"/)[1];
  if (!x.includes('"' + name + '"')) x = x.replace('</manifest>', '    ' + line + '\n</manifest>');
}
if (!x.includes('android:usesCleartextTraffic')) x = x.replace('<application', '<application\n        android:usesCleartextTraffic="false"');
writeFileSync(p, x);
console.log('AndroidManifest.xml patched');

// Version number: each cloud build gets a higher number, so Android installs it as an update.
const g = 'android/app/build.gradle';
const run = parseInt(process.env.BUILD_NUMBER || '1', 10);
let b = readFileSync(g, 'utf8');
b = b.replace(/versionCode\s+\d+/, 'versionCode ' + run).replace(/versionName\s+"[^"]*"/, 'versionName "1.0.' + run + '"');
writeFileSync(g, b);
console.log('build.gradle version set to 1.0.' + run + ' (' + run + ')');
