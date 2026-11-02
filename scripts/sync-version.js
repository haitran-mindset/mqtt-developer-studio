import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Read version from package.json
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const newVersion = pkg.version;

console.log(`🔄 Syncing version ${newVersion} across project...`);

// 2. Sync into src-tauri/Cargo.toml
const cargoPath = path.join(rootDir, 'src-tauri', 'Cargo.toml');
if (fs.existsSync(cargoPath)) {
  let cargoContent = fs.readFileSync(cargoPath, 'utf8');
  cargoContent = cargoContent.replace(/^version = ".*?"/m, `version = "${newVersion}"`);
  fs.writeFileSync(cargoPath, cargoContent, 'utf8');
  console.log(`✅ Updated src-tauri/Cargo.toml to ${newVersion}`);
}

console.log(`✨ Single Source of Truth: All frontend UI & Tauri now use v${newVersion}!`);
