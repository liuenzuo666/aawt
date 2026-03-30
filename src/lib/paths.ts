import path from "node:path";
import type { AawtConfig } from "../types.js";

export function resolveWorktreePath(
  rootDir: string,
  name: string,
  config: AawtConfig
): string {
  const dir = config.worktreeDir ?? ".aawt";
  const sanitized = name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const worktreeDir = path.isAbsolute(dir) ? dir : path.resolve(rootDir, dir);
  return path.resolve(worktreeDir, sanitized);
}

export function resolveWorktreeName(worktreePath: string, rootDir: string, config: AawtConfig): string {
  const dir = config.worktreeDir ?? ".aawt";
  const worktreeDir = path.isAbsolute(dir) ? dir : path.resolve(rootDir, dir);
  return path.relative(worktreeDir, worktreePath);
}
