#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.env.HERDR_ENV !== '1') {
  throw new Error('Run this command inside a Herdr-managed pane (HERDR_ENV=1).');
}

if (process.argv.length > 2) {
  throw new Error('Usage: choopan-layout.mjs');
}

const herdr = process.env.HERDR_BIN_PATH || 'herdr';
const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');
const runtimePath = resolve(root, '.choopan', 'runtime', 'choopanlayout.json');
const memoryScript = resolve(scriptDir, 'choopan-session-memory.mjs');
const overviewScript = resolve(scriptDir, 'choopan-overview.mjs');

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

function runNode(script, args = []) {
  const result = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr.trim() || result.stdout.trim() || `${script} failed`);
  return result.stdout.trim();
}

function readRuntime() {
  if (!existsSync(runtimePath)) return { sessions: {} };
  try {
    const parsed = JSON.parse(readFileSync(runtimePath, 'utf8'));
    return parsed && typeof parsed === 'object' && parsed.sessions ? parsed : { sessions: {} };
  } catch {
    return { sessions: {} };
  }
}

function writeRuntime(runtime) {
  mkdirSync(dirname(runtimePath), { recursive: true });
  writeFileSync(runtimePath, `${JSON.stringify(runtime, null, 2)}\n`);
}

function sessionKey(agent) {
  return agent.name || `unnamed-${agent.terminal_id || agent.pane_id}`;
}

function workspaceLabel(agent) {
  return `choopan:claude:${sessionKey(agent)}`.slice(0, 80);
}

const listed = command(['agent', 'list']);
const claudeAgents = (listed.agents || []).filter((agent) => agent.agent === 'claude');
if (claudeAgents.length === 0) {
  process.stdout.write('No live Claude Code agents found; no layout changes were made.\n');
  process.exit(0);
}

const runtime = readRuntime();
const moved = [];
const skipped = [];
for (const agent of claudeAgents) {
  const key = sessionKey(agent);
  const previous = runtime.sessions[key];
  if (previous?.workspace_id === agent.workspace_id && previous?.pane_id === agent.pane_id) {
    skipped.push({ key, workspaceId: agent.workspace_id });
    continue;
  }

  const move = command([
    'pane',
    'move',
    agent.pane_id,
    '--new-workspace',
    '--label',
    workspaceLabel(agent),
    '--no-focus',
  ]);
  const claudePane = move.move_result?.pane?.pane_id;
  const workspaceId = move.move_result?.created_workspace?.workspace_id || move.move_result?.target_layout?.workspace_id;
  if (!claudePane || !workspaceId) {
    throw new Error(`Herdr did not return the moved pane and workspace for ${key}.`);
  }

  const split = command([
    'pane',
    'split',
    claudePane,
    '--direction',
    'right',
    '--ratio',
    '0.72',
    '--no-focus',
  ]);
  const yPane = split.pane?.pane_id;
  if (!yPane) throw new Error(`Herdr did not return the y pane for ${key}.`);
  command(['pane', 'rename', yPane, 'y']);
  command(['pane', 'run', yPane, 'y']);

  runtime.sessions[key] = {
    workspace_id: workspaceId,
    pane_id: claudePane,
    y_pane_id: yPane,
    terminal_id: agent.terminal_id,
    arranged_at: new Date().toISOString(),
  };
  moved.push({ key, workspaceId, claudePane, yPane });
}

writeRuntime(runtime);
const memoryResult = runNode(memoryScript, ['sync']);
const overviewResult = runNode(overviewScript, ['--label', 'choopan-overview']);

for (const entry of moved) {
  process.stdout.write(`Arranged ${entry.key}: workspace ${entry.workspaceId}, Claude ${entry.claudePane}, y ${entry.yPane}.\n`);
}
for (const entry of skipped) {
  process.stdout.write(`Kept existing layout for ${entry.key}: workspace ${entry.workspaceId}.\n`);
}
if (memoryResult) process.stdout.write(`${memoryResult}\n`);
if (overviewResult) process.stdout.write(`${overviewResult}\n`);
