#!/usr/bin/env node
// PreToolUse hook: block dangerous shell commands before they execute
// Exit 2 = block the tool call and show reason to Claude
const chunks = [];
process.stdin.on('data', (d) => chunks.push(d));
process.stdin.on('end', () => {
  let data;
  try { data = JSON.parse(Buffer.concat(chunks).toString()); } catch { process.exit(0); }

  const cmd = data?.tool_input?.command ?? '';

  const rules = [
    { pattern: /rm\s+(-\w*r\w*f|-rf|-fr)\s/i,  reason: '`rm -rf` est bloqué (suppression récursive forcée)' },
    { pattern: /rm\s+(-\w*r\w*f|-rf|-fr)$/i,    reason: '`rm -rf` est bloqué (suppression récursive forcée)' },
    { pattern: /\bsudo\s/,                        reason: '`sudo` est bloqué (élévation de privilèges)' },
    { pattern: /\bsudo$/,                         reason: '`sudo` est bloqué (élévation de privilèges)' },
    { pattern: />\s*\/dev\/sd[a-z]/,             reason: 'Écriture directe sur device bloquée' },
    { pattern: /mkfs\./,                          reason: '`mkfs` (formatage disque) est bloqué' },
    { pattern: /:\s*\(\)\s*\{\s*:\s*\|\s*:\s*&/,reason: 'Fork bomb détectée et bloquée' },
  ];

  for (const { pattern, reason } of rules) {
    if (pattern.test(cmd)) {
      process.stdout.write(`🚫 BLOQUÉ PAR HOOK DE SÉCURITÉ\n\nCommande refusée : ${reason}\n\nCommande tentée :\n  ${cmd.split('\n')[0]}\n`);
      process.exit(2);
    }
  }

  process.exit(0);
});
