// Makes the Android project for ADROS from twa-manifest.json (used by the "Android app" GitHub workflow).
// Usage: node make-project.mjs <out-folder> [site-url]   (site-url is only for testing; default = live site)
import fs from 'fs';
import path from 'path';
import {TwaManifest, TwaGenerator, ConsoleLog} from '@bubblewrap/core';

const out = path.resolve(process.argv[2] || 'build');
const site = process.argv[3];
const here = path.dirname(new URL(import.meta.url).pathname);
const json = JSON.parse(fs.readFileSync(path.join(here, 'twa-manifest.json'), 'utf8'));
// Version code can be set from the workflow (each store upload needs a bigger number).
if (process.env.VERSION_CODE) json.appVersionCode = Number(process.env.VERSION_CODE);
if (process.env.VERSION_NAME) json.appVersionName = json.appVersion = process.env.VERSION_NAME;
if (site) {
  json.iconUrl = site + '/icons/icon-512.png';
  json.maskableIconUrl = site + '/icons/icon-maskable-512.png';
  json.webManifestUrl = site + '/manifest.json';
}
const manifest = new TwaManifest(json);
const problem = manifest.validate();
if (problem) { console.error('twa-manifest.json problem: ' + problem); process.exit(1); }
fs.mkdirSync(out, {recursive: true});
await new TwaGenerator().createTwaProject(out, manifest, new ConsoleLog('adros'));
// Google Play asks new apps to aim at the newest Android (API 36 = Android 16).
const gradleFile = path.join(out, 'app', 'build.gradle');
fs.writeFileSync(gradleFile, fs.readFileSync(gradleFile, 'utf8').replace(/targetSdkVersion \d+/, 'targetSdkVersion 36'));
fs.writeFileSync(path.join(out, 'twa-manifest.json'), JSON.stringify(manifest.toJson(), null, 2));
console.log('Android project ready in ' + out + ' (version ' + json.appVersionName + ', code ' + json.appVersionCode + ')');
