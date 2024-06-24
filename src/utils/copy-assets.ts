import * as fs from 'fs';
import * as path from 'path';

const source = path.resolve(__dirname, '../assets');
const destination = path.resolve(__dirname, '../../dist/src/assets');

fs.mkdirSync(destination, { recursive: true });

fs.readdirSync(source).forEach(file => {
  const sourceFile = path.join(source, file);
  const destFile = path.join(destination, file);
  fs.copyFileSync(sourceFile, destFile);
});

console.log('Assets copied successfully.');
