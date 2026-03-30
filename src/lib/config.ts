import path from "node:path";
import fs from "node:fs";
import type { AawtConfig, ResolvedConfig } from "../types.js";

const CONFIG_FILE = ".aawt.json";

export async function findConfig(cwd: string = process.cwd()): Promise<ResolvedConfig | null> {
  let dir = cwd;
  while (true) {
    const configPath = path.join(dir, CONFIG_FILE);
    if (fs.existsSync(configPath)) {
      try {
        const content = await Bun.file(configPath).json();
        return { ...content, rootDir: dir, configPath };
      } catch {
        return { rootDir: dir, configPath };
      }
    }
    if (fs.existsSync(path.join(dir, ".git"))) {
      break;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export async function loadConfig(cwd?: string): Promise<ResolvedConfig> {
  const config = await findConfig(cwd);
  if (config) return config;

  const rootDir = await getGitRoot(cwd ?? process.cwd());
  return { rootDir, configPath: path.join(rootDir, CONFIG_FILE) };
}

export async function saveConfig(configPath: string, config: AawtConfig): Promise<void> {
  await Bun.write(configPath, JSON.stringify(config, null, 2) + "\n");
}

async function getGitRoot(cwd: string): Promise<string> {
  const proc = Bun.spawn(["git", "rev-parse", "--show-toplevel"], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  const text = await new Response(proc.stdout).text();
  await proc.exited;
  return text.trim();
}
