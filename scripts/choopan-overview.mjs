#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.env.HERDR_ENV !== '1') {
  throw new Error('Run this command inside a Herdr-managed pane (HERDR_ENV=1).');
}

const args = process.argv.slice(2);
let label = 'choopan-overview';
for (let index = 0; index < args.length; index += 1) {
  if (args[index] === '--label') {
    label = args[index + 1] || '';
    index += 1;
  } else {
    throw new Error(`Unknown argument: ${args[index]}`);
  }
}
if (!label) throw new Error('--label requires a value.');

const herdr = process.env.HERDR_BIN_PATH || 'herdr';
const scriptDir = dirname(fileURLToPath(import.meta.url));
const observer = resolve(scriptDir, 'choopan-observe.mjs');

function command(parts) {
  const result = spawnSync(herdr, parts, { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr.trim() || `herdr ${parts.join(' ')} failed`);
  try {
    return JSON.parse(result.stdout).result;
  } catch {
    throw new Error(`Expected JSON from herdr ${parts.join(' ')}, received: ${result.stdout}`);
  }
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\"'\"'")}'`;
}

function targetFor(agent) {
  return agent.name || agent.pane_id;
}

const listed = command(['agent', 'list']);
const agents = Array.isArray(listed.agents) ? listed.agents : [];
if (agents.length === 0) {
  throw new Error('No live Herdr-recognized agents found; no overview workspace was created.');
}

const created = command(['workspace', 'create', '--cwd', process.cwd(), '--label', label, '--no-focus']);
const rootPane = created.root_pane?.pane_id;
if (!rootPane) throw new Error('Herdr did not return the root pane for the overview workspace.');

const leaves = [];
function createBalancedGrid(paneId, entries, depth = 0) {
  if (entries.length === 1) {
    leaves.push({ paneId, agent: entries[0] });
    return;
  }
  const leftCount = Math.ceil(entries.length / 2);
  const ratio = leftCount / entries.length;
  const split = command([
    'pane',
    'split',
    paneId,
    '--direction',
    depth % 2 === 0 ? 'right' : 'down',
    '--ratio',
    ratio.toFixed(4),
    '--no-focus',
  ]);
  const secondPane = split.pane?.pane_id;
  if (!secondPane) throw new Error(`Herdr did not return a pane while creating the grid.`);
  createBalancedGrid(paneId, entries.slice(0, leftCount), depth + 1);
  createBalancedGrid(secondPane, entries.slice(leftCount), depth + 1);
}

createBalancedGrid(rootPane, agents);
for (const { paneId, agent } of leaves) {
  const target = targetFor(agent);
  const paneLabel = `view:${target}:${agent.agent_status}`.slice(0, 80);
  command(['pane', 'rename', paneId, paneLabel]);
  command(['pane', 'run', paneId, `${shellQuote(process.execPath)} ${shellQuote(observer)} ${shellQuote(target)}`]);
}

process.stdout.write(
  `Created ${label} with ${leaves.length} read-only observer pane${leaves.length === 1 ? '' : 's'}.\n`,
);
