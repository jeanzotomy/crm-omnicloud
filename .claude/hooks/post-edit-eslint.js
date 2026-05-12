#!/usr/bin/env node
// PostToolUse hook: run eslint --fix on the edited file
const chunks = [];
process.stdin.on('data', (d) => chunks.push(d));
process.stdin.on('end', () => {
  let data;
  try { data = JSON.parse(Buffer.concat(chunks).toString()); } catch { process.exit(0); }

  const file = data?.tool_input?.file_path ?? '';
  if (!file || !/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file)) process.exit(0);

  const { spawnSync } = require('child_process');
  const result = spawnSync('npx', ['eslint', '--fix', '--max-warnings=0', file], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.stdout?.trim()) process.stdout.write(result.stdout);
  if (result.stderr?.trim()) process.stderr.write(result.stderr);
  process.exit(0); // non-blocking: ESLint errors are warnings, not blockers
});
