#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [operation, targetOrKey, ...rest] = process.argv.slice(2);
if (!['record', 'start', 'sync'].includes(operation) || (operation !== 'sync' && !targetOrKey)) {
  throw new Error('Usage: choopan-session-memory.mjs sync | record <agent-target> --id <session-key> | start <session-key> --cwd <path> [--label <label>]');
}
if (process.env.HERDR_ENV !== '1') {
  throw new Error('Run this command inside a Herdr-managed pane (HERDR_ENV=1).');
}

const options = new Map();
for (let index = 0; index < rest.length; index += 1) {
  if (!rest[index].startsWith('--')) throw new Error(`Unexpected argument: ${rest[index]}`);
  const key = rest[index];
  const value = rest[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${key} requires a value.`);
  options.set(key, value);
  index += 1;
}

const herdr = process.env.HERDR_BIN_PATH || 'herdr';
const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');
const memoryDir = resolve(root, '.choopan', 'sessions');
const runtimeDir = resolve(root, '.choopan', 'runtime', 'sessions');

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

function safeKey(value) {
  if (!/^[a-z][a-z0-9_-]{0,31}$/.test(value)) {
    throw new Error('Session key must match Herdr agent-name syntax: lowercase letters, digits, _ or -, beginning with a letter.');
  }
  return value;
}

function memoryPath(key) {
  return resolve(memoryDir, `${key}.md`);
}

function runtimePath(key) {
  return resolve(runtimeDir, `${key}.json`);
}

function markdownSnapshot(key, agent) {
  const session = agent.agent_session;
  return `# Session Memory: ${key}\n\n## Identity\n\n- Session key / stable agent name: ${key}\n- Agent kind: ${agent.agent || 'unknown'}\n- Functional role: ${key}\n- Herdr server session: ${process.env.HERDR_SESSION || 'default'}\n- Workspace / worktree: ${agent.foreground_cwd || agent.cwd || 'unknown'}\n- Native session reference: ${session ? `${session.kind}:${session.value}` : 'not reported yet'}\n\n## Purpose and boundaries\n\n- Objective: Fill when assigning or adopting this session.\n- Allowed scope:\n- Excluded scope:\n- Ownership and coordination boundaries:\n\n## Durable context\n\n- Key facts:\n- Decisions that constrain this session:\n- Important files and artifacts:\n- Validation expectations:\n\n## Latest handoff\n\n- Status: ${agent.agent_status}\n- Summary: Fill from the worker's structured handoff.\n- Choices and consequences:\n- Recommendation and reasoning:\n- Changes and validation:\n- Risks and assumptions:\n- Next action:\n\n## Resume guidance\n\n- Preferred workspace path or worktree: ${agent.foreground_cwd || agent.cwd || 'unknown'}\n- Resume policy: prefer-live-then-native\n- Safe first prompt after resuming: Read this memory and the latest relevant artifact before changing work.\n- Do not duplicate while live agent exists: yes\n\n## Runtime snapshot (generated)\n\n${runtimeLines(agent)}\n`;
}

function runtimeLines(agent) {
  const session = agent.agent_session;
  return [
    `- Last observed: ${new Date().toISOString()}`,
    `- Stable name: ${agent.name || 'unnamed'}`,
    `- Agent status: ${agent.agent_status}`,
    `- Workspace ID: ${agent.workspace_id}`,
    `- Tab ID: ${agent.tab_id}`,
    `- Pane ID: ${agent.pane_id}`,
    `- CWD: ${agent.foreground_cwd || agent.cwd || 'unknown'}`,
    `- Native session: ${session ? `${session.source}/${session.agent}/${session.kind}:${session.value}` : 'not reported'}`,
  ].join('\n');
}

function updateGeneratedSnapshot(path, agent) {
  const marker = '## Runtime snapshot (generated)';
  const text = readFileSync(path, 'utf8');
  const next = `${marker}\n\n${runtimeLines(agent)}\n`;
  const start = text.indexOf(marker);
  if (start < 0) {
    writeFileSync(path, `${text.trimEnd()}\n\n${next}`);
    return;
  }
  const following = text.indexOf('\n## ', start + marker.length);
  const replacementEnd = following < 0 ? text.length : following + 1;
  writeFileSync(path, `${text.slice(0, start)}${next}${text.slice(replacementEnd)}`);
}

function resumeArgs(agent) {
  const session = agent.agent_session;
  if (!session?.value || !agent.agent) throw new Error('The remembered agent lacks an agent kind or native session reference; choose a fresh start or provide a resume target.');
  const value = session.value;
  const map = {
    pi: ['--session', value],
    claude: ['--resume', value],
    codex: ['resume', value],
    cursor: ['--resume', value],
    devin: ['--resume', value],
    droid: ['--resume', value],
    kimi: ['--session', value],
    qodercli: ['--resume', value],
    qwen: ['--resume', value],
    letta: ['--conversation', value],
    grok: ['--resume', value],
    copilot: ['--resume', value],
    opencode: ['--session', value],
    kilo: ['--session', value],
    hermes: ['--resume', value],
    mastracode: ['--thread', value],
    agy: ['--conversation', value],
  };
  const args = map[agent.agent];
  if (!args) throw new Error(`No configured resume syntax for agent kind ${agent.agent}. Ask the user whether to start fresh.`);
  return args;
}

function persistMemory(key, info) {
  mkdirSync(memoryDir, { recursive: true });
  mkdirSync(runtimeDir, { recursive: true });
  writeFileSync(runtimePath(key), `${JSON.stringify(info, null, 2)}\n`);
  if (existsSync(memoryPath(key))) updateGeneratedSnapshot(memoryPath(key), info);
  else writeFileSync(memoryPath(key), markdownSnapshot(key, info));
}

if (operation === 'record') {
  const info = command(['agent', 'get', targetOrKey]).agent;
  if (!info) throw new Error('Herdr did not return an agent record.');
  const key = safeKey(options.get('--id') || info.name || '');
  persistMemory(key, info);
  process.stdout.write(`Recorded local session memory: .choopan/sessions/${key}.md\n`);
} else if (operation === 'sync') {
  const agents = command(['agent', 'list']).agents || [];
  const skipped = [];
  for (const info of agents) {
    if (!info.name) {
      skipped.push(info.pane_id);
      continue;
    }
    persistMemory(safeKey(info.name), info);
  }
  process.stdout.write(`Synchronized memory for ${agents.length - skipped.length} named live session${agents.length - skipped.length === 1 ? '' : 's'}.\n`);
  if (skipped.length) process.stdout.write(`Skipped unnamed agent pane${skipped.length === 1 ? '' : 's'}: ${skipped.join(', ')}\n`);
} else {
  const key = safeKey(targetOrKey);
  const cwd = options.get('--cwd');
  if (!cwd) throw new Error('start requires --cwd <workspace-path>.');
  if (!existsSync(runtimePath(key))) throw new Error(`No local runtime binding for ${key}; record the session before resuming it.`);
  const remembered = JSON.parse(readFileSync(runtimePath(key), 'utf8'));
  const live = command(['agent', 'list']).agents || [];
  const duplicate = live.find((agent) => agent.name === key || (remembered.agent_session?.value && agent.agent_session?.value === remembered.agent_session.value));
  if (duplicate) throw new Error(`Refusing to duplicate ${key}; it is already live in pane ${duplicate.pane_id}. Focus or move that pane instead.`);
  const workspace = command(['workspace', 'create', '--cwd', cwd, '--label', options.get('--label') || key, '--no-focus']);
  const paneId = workspace.root_pane?.pane_id;
  if (!paneId) throw new Error('Herdr did not return the new workspace root pane.');
  const started = command(['agent', 'start', key, '--kind', remembered.agent, '--pane', paneId, '--', ...resumeArgs(remembered)]);
  const info = started.agent;
  if (info) {
    persistMemory(key, info);
  }
  process.stdout.write(`Started remembered session ${key} in a new Herdr workspace.\n`);
}
