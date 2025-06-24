import * as fs from 'fs';
import * as path from 'path';

const sourceFile = path.resolve(__dirname, '../assets/banner.png');
const destFile = path.resolve(__dirname, '../../dist/src/assets/banner.png');

// Ensure destination directory exists
fs.mkdirSync(path.dirname(destFile), { recursive: true });

// Copy the file
fs.copyFileSync(sourceFile, destFile);

console.log('banner.png copied successfully.');