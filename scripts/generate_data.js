#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { resolve } from 'path';

// Directory containing the Python scripts
const scriptsDir = resolve(process.cwd(), 'scripts');
// List of Python scripts to execute in order
const scripts = ['preprocess_tree.py', 'genre_mass.py', 'better_positioning.py'];

for (const script of scripts) {
  console.log(`Running ${script}...`);
  const result = spawnSync('python3', [script], { cwd: scriptsDir, stdio: 'inherit' });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status);
  }
}

console.log('✅ Generated JSON at data/positioned_genres_final.json');