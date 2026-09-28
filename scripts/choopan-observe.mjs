#!/usr/bin/env node

import { spawn } from 'node:child_process';

const target = process.argv[2];
if (!target) {
  process.stderr.write('Usage: choopan-observe.mjs <agent-or-pane-target>\n');
  process.exit(2);
}

const herdr = process.env.HERDR_BIN_PATH || 'herdr';
const cols = Number(process.env.COLUMNS || process.stdout.columns || 80);
const rows = Number(process.env.LINES || process.stdout.rows || 24);
const child = spawn(
  herdr,
  ['terminal', 'session', 'observe', target, '--cols', String(cols), '--rows', String(rows)],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);

let pending = '';
child.stdout.setEncoding('utf8');
child.stdout.on('data', (chunk) => {
  pending += chunk;
  let newline;
  while ((newline = pending.indexOf('\n')) >= 0) {
    const line = pending.slice(0, newline);
    pending = pending.slice(newline + 1);
    if (!line) continue;
    try {
      const frame = JSON.parse(line);
      if (frame.type === 'terminal.frame' && frame.encoding === 'ansi' && typeof frame.bytes === 'string') {
        if (frame.full) process.stdout.write('\x1b[2J\x1b[H');
        process.stdout.write(Buffer.from(frame.bytes, 'base64'));
      } else if (frame.type === 'terminal.closed') {
        process.stdout.write(`\r\n[observer closed: ${frame.reason || 'terminal closed'}]\r\n`);
      }
    } catch {
      process.stderr.write(`[observer] ignored malformed frame for ${target}\n`);
    }
  }
});

child.stderr.on('data', (chunk) => process.stderr.write(chunk));
child.on('error', (error) => {
  process.stderr.write(`Unable to start Herdr observer: ${error.message}\n`);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  if (signal) process.stderr.write(`Observer ended by ${signal}\n`);
  process.exitCode = code ?? 1;
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
