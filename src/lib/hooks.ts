import type { HookResult } from "../types.js";

export async function runHooks(
  commands: string[],
  cwd: string,
  opts?: { label?: string }
): Promise<HookResult[]> {
  const results: HookResult[] = [];

  for (const cmd of commands) {
    const start = Date.now();
    const proc = Bun.spawn(["sh", "-c", cmd], {
      cwd,
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });
    const exitCode = await proc.exited;
    const duration = Date.now() - start;

    results.push({ command: cmd, exitCode, duration });

    if (exitCode !== 0) {
      console.error(`\n  ✗ Hook failed: ${cmd} (exit code ${exitCode})`);
      break;
    }
  }

  return results;
}
