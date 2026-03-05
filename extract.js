const { execSync } = require('child_process');
const path = require('path');

const zipPath = "C:\\Users\\afifr\\AppData\\Local\\electron-builder\\Cache\\winCodeSign\\091138519.7z";
const outPath = "C:\\Users\\afifr\\AppData\\Local\\electron-builder\\Cache\\winCodeSign\\winCodeSign-2.6.0";
const exe = "C:\\Users\\afifr\\Nodinapp\\node_modules\\7zip-bin\\win\\x64\\7za.exe";

try {
    console.log("Extracting...");
    execSync(`"${exe}" x "${zipPath}" -o"${outPath}" -y -aoa`, { stdio: 'inherit' });
    console.log("Done extracting!");
} catch (e) {
    console.error("Failed", e);
}
