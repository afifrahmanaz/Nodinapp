#!/usr/bin/env node

// Launcher: spawns electron.exe with ELECTRON_RUN_AS_NODE unset
// (the IDE sets this env var, which causes Electron to run as plain Node.js)
const { spawn } = require('child_process');
const path = require('path');

// Get the path to electron binary
const electronPath = require('electron');

// Remove ELECTRON_RUN_AS_NODE from environment so Electron starts properly
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, [path.join(__dirname, 'app')], {
    stdio: 'inherit',
    env,
    windowsHide: false,
});

child.on('close', (code) => process.exit(code || 0));
child.on('error', (err) => {
    console.error('Failed to start Electron:', err);
    process.exit(1);
});

process.on('SIGINT', () => child.kill());
process.on('SIGTERM', () => child.kill());
