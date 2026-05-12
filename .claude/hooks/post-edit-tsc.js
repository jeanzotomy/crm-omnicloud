#!/usr/bin/env node
// PostToolUse hook: run tsc --noEmit after editing a TypeScript file
const { existsSync } = require('fs');
const { join, dirname } = require('path');
const chunks = [];
process.stdin.on('data', (d) => chunks.push(d));
process.stdin.on('end', () => {
  let data;
  try { data = JSON.parse(Buffer.concat(chunks).toString()); } catch { process.exit(0); }

  const file = data?.tool_input?.file_path ?? '';
  if (!file || !/\.(ts|tsx)$/.test(file)) process.exit(0);

  // Find the nearest tsconfig.json walking up from the edited file
  let dir = dirname(file);
  let tsconfig = null;
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, 'tsconfig.json');
    if (existsSync(candidate)) { tsconfig = candidate; break; }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  if (!tsconfig) process.exit(0);

  const { spawnSync } = require('child_process');
  const result = spawnSync('npx', ['tsc', '--noEmit', '--project', tsconfig], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 60_000,
  });

  if (result.stdout?.trim()) process.stdout.write(`[tsc] ${result.stdout}`);
  if (result.stderr?.trim()) process.stderr.write(`[tsc] ${result.stderr}`);

  // Exit 0 always: type errors are informational for Claude, not blockers
  process.exit(0);
});
