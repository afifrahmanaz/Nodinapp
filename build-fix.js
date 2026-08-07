/**
 * Build helper: Pre-extracts winCodeSign ignoring symlink errors,
 * then runs electron-builder.
 */
const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const CACHE_DIR = path.join(process.env.LOCALAPPDATA, 'electron-builder', 'Cache', 'winCodeSign');
const WINCSP_URL = 'https://github.com/electron-userland/electron-builder-binaries/releases/download/winCodeSign-2.6.0/winCodeSign-2.6.0.7z';
const SEVENZ = path.join(__dirname, 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe');

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const follow = (url) => {
            const proto = url.startsWith('https') ? https : http;
            proto.get(url, { headers: { 'User-Agent': 'electron-builder' } }, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    follow(res.headers.location);
                    return;
                }
                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode}`));
                    return;
                }
                const file = fs.createWriteStream(dest);
                res.pipe(file);
                file.on('finish', () => { file.close(); resolve(); });
            }).on('error', reject);
        };
        follow(url);
    });
}

async function main() {
    console.log('=== Nodin Widget Build Script ===\n');

    // Step 1: Prepare winCodeSign cache
    console.log('[1/3] Preparing winCodeSign cache...');
    
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    // Check if already extracted correctly (rcedit-x64.exe must exist)
    const extractedDirs = fs.readdirSync(CACHE_DIR).filter(f => {
        const fullPath = path.join(CACHE_DIR, f);
        return fs.statSync(fullPath).isDirectory() && 
               fs.existsSync(path.join(fullPath, 'rcedit-x64.exe'));
    });

    if (extractedDirs.length > 0) {
        console.log('   winCodeSign already cached, skipping...');
    } else {
        // Clean up any failed attempts
        const oldFiles = fs.readdirSync(CACHE_DIR);
        for (const f of oldFiles) {
            const fp = path.join(CACHE_DIR, f);
            try {
                if (fs.statSync(fp).isDirectory()) {
                    fs.rmSync(fp, { recursive: true, force: true });
                } else {
                    fs.unlinkSync(fp);
                }
            } catch (e) { /* ignore */ }
        }

        const archivePath = path.join(CACHE_DIR, 'winCodeSign.7z');
        const extractDir = path.join(CACHE_DIR, 'winCodeSign-2.6.0');

        console.log('   Downloading winCodeSign-2.6.0...');
        await downloadFile(WINCSP_URL, archivePath);
        console.log('   Downloaded!');

        console.log('   Extracting all files (ignoring darwin symlink errors)...');
        fs.mkdirSync(extractDir, { recursive: true });
        
        // Extract everything - ignore exit code because darwin symlinks will fail
        // but all Windows-relevant files (rcedit, osslsigncode, etc.) will extract fine
        const result = spawnSync(SEVENZ, [
            'x', '-bd', '-y',
            archivePath,
            `-o${extractDir}`
        ], { stdio: 'pipe' });

        const stderr = result.stderr?.toString() || '';
        const stdout = result.stdout?.toString() || '';
        
        // Verify critical files exist despite symlink errors
        const rceditPath = path.join(extractDir, 'rcedit-x64.exe');
        const win10Dir = path.join(extractDir, 'windows-10');
        
        if (fs.existsSync(rceditPath) && fs.existsSync(win10Dir)) {
            console.log('   Extraction successful! (darwin symlink warnings ignored)');
        } else {
            console.error('   Critical files missing after extraction!');
            console.error('   rcedit-x64.exe exists:', fs.existsSync(rceditPath));
            console.error('   windows-10 dir exists:', fs.existsSync(win10Dir));
            console.error('   7z stdout:', stdout);
            console.error('   7z stderr:', stderr);
            process.exit(1);
        }
        
        // Clean up archive
        try { fs.unlinkSync(archivePath); } catch (e) { /* ignore */ }
    }

    // Step 2: Build
    console.log('\n[2/3] Building installer...');
    
    const env = { ...process.env };
    env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';
    env.WIN_CSC_LINK = '';

    try {
        execSync('npx electron-builder --win --x64', {
            cwd: __dirname,
            stdio: 'inherit',
            env,
        });
    } catch (err) {
        console.error('\nBuild failed!');
        process.exit(1);
    }

    // Step 3: Report
    console.log('\n[3/3] Build complete!');
    const distDir = path.join(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
        const exeFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.exe'));
        if (exeFiles.length > 0) {
            for (const exe of exeFiles) {
                const stats = fs.statSync(path.join(distDir, exe));
                const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
                console.log(`   ✓ ${exe} (${sizeMB} MB)`);
            }
            console.log(`\n   Output directory: ${distDir}`);
        }
    }
}

main().catch(err => {
    console.error('Build script error:', err);
    process.exit(1);
});
