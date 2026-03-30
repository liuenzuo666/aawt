import fs from "node:fs";
import path from "node:path";
import type { SentinelData, HookResult } from "../types.js";

const SENTINEL_FILE = ".aawt-initialized";

export async function isInitialized(worktreePath: string): Promise<boolean> {
  return fs.existsSync(path.join(worktreePath, SENTINEL_FILE));
}

export async function readSentinel(worktreePath: string): Promise<SentinelData | null> {
  const sentinelPath = path.join(worktreePath, SENTINEL_FILE);
  if (!fs.existsSync(sentinelPath)) return null;
  try {
    return await Bun.file(sentinelPath).json();
  } catch {
    return null;
  }
}

export async function markInitialized(
  worktreePath: string,
  name: string,
  results: HookResult[]
): Promise<void> {
  const sentinel: SentinelData = {
    initializedAt: new Date().toISOString(),
    name,
    initHooksResult: {
      exitCode: results.every((r) => r.exitCode === 0) ? 0 : 1,
      commands: results.map((r) => r.command),
    },
  };
  await Bun.write(
    path.join(worktreePath, SENTINEL_FILE),
    JSON.stringify(sentinel, null, 2) + "\n"
  );
}
