#!/usr/bin/env node

/**
 * scripts/release.mjs — Prepare a release locally (does NOT push).
 *
 * Usage:  node scripts/release.mjs <major|minor|patch|X.Y.Z>
 *
 * Detects the library project from angular.json automatically.
 *
 * Steps:
 *   1. Detect library project from angular.json
 *   2. Check for uncommitted changes
 *   3. Bump version in the library's package.json (via npm version)
 *   4. Build the library
 *   5. Commit and tag
 *   6. Print push command
 *
 * To publish, run:  npm run release:push
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ── Auto-detect library from angular.json ────────────────────────────────────

function detectLibrary() {
  const angular = JSON.parse(readFileSync(resolve(root, 'angular.json'), 'utf8'));
  const libs = Object.entries(angular.projects)
    .filter(([, p]) => p.projectType === 'library');

  if (libs.length === 0) {
    console.error('✗ No library project found in angular.json');
    process.exit(1);
  }
  if (libs.length > 1) {
    console.error('✗ Multiple library projects found:',
      libs.map(([n]) => n).join(', '));
    process.exit(1);
  }

  const [name, config] = libs[0];
  return { name, root: config.root, dist: `dist/${name}` };
}

const lib = detectLibrary();
console.log(`Detected library: ${lib.name} (${lib.root})\n`);

// ── Helpers ──────────────────────────────────────────────────────────────────

function run(cmd) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

function getLibVersion() {
  return JSON.parse(
    readFileSync(resolve(root, lib.root, 'package.json'), 'utf8')
  ).version;
}

// ── Parse argument ───────────────────────────────────────────────────────────

const bump = process.argv[2];
if (!bump) {
  console.error('Usage: node scripts/release.mjs <major|minor|patch|X.Y.Z>');
  process.exit(1);
}

// ── Step 1: Check uncommitted changes ────────────────────────────────────────

const status = execSync('git status --porcelain', { cwd: root, encoding: 'utf8' }).trim();
if (status) {
  console.error('✗ Uncommitted changes detected:\n');
  console.error(status);
  console.error('\nCommit or stash changes before releasing.');
  process.exit(1);
}
console.log('✔ Working tree is clean.\n');

const oldVersion = getLibVersion();

// ── Step 2: Bump version via npm version ─────────────────────────────────────

console.log(`Bumping ${oldVersion} → ${bump} in ${lib.root}/package.json …`);
run(`npm version ${bump} --no-git-tag-version --prefix ${lib.root}`);

const newVersion = getLibVersion();
const tag = `v${newVersion}`;
console.log(`\n✔ Version bumped: ${oldVersion} → ${newVersion}\n`);

// ── Step 3: Build ────────────────────────────────────────────────────────────

console.log('Building library …');
run(`npx ng build ${lib.name} --configuration production`);
console.log('\n✔ Build succeeded.\n');

// ── Step 4: Commit + tag ─────────────────────────────────────────────────────

run('git add -A');
run(`git commit -m "release: ${tag}"`);
run(`git tag ${tag}`);
console.log(`\n✔ Committed and tagged ${tag}.\n`);

// ── Done — print push instructions ──────────────────────────────────────────

console.log('─'.repeat(60));
console.log(`\n  Ready to publish! Run:\n`);
console.log(`    npm run release:push\n`);
console.log(`  This will push the branch and tag ${tag} to origin.`);
console.log(`  GitHub Actions will then publish to npm automatically.\n`);
console.log('─'.repeat(60));
