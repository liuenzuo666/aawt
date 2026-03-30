import type { WorktreeInfo } from "../types.js";
import { isInitialized } from "./sentinel.js";

export async function listWorktrees(cwd?: string): Promise<WorktreeInfo[]> {
  const proc = Bun.spawn(["git", "worktree", "list", "--porcelain"], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  const text = await new Response(proc.stdout).text();
  await proc.exited;

  const entries = text.trim().split("\n\n");
  const worktrees: WorktreeInfo[] = [];

  for (const entry of entries) {
    if (!entry.trim()) continue;
    const lines = entry.split("\n");
    const data: Record<string, string> = {};
    for (const line of lines) {
      const [key, ...rest] = line.split(" ");
      data[key] = rest.join(" ");
    }

    const wtPath = data["worktree"] ?? "";
    const branch = data["branch"]?.replace("refs/heads/", "") ?? null;
    const head = data["HEAD"] ?? "";
    const isMain = !data["branch"] || branch === "(detached)";

    worktrees.push({
      name: wtPath.split("/").pop() ?? wtPath,
      path: wtPath,
      branch: branch === "(detached)" ? null : branch,
      head: head.substring(0, 8),
      isMain: isMain && branch !== "(detached)" ? isMain : wtPath === (await getMainWorktreeRoot(cwd)),
      initialized: false,
    });
  }

  for (const wt of worktrees) {
    wt.initialized = await isInitialized(wt.path);
  }

  return worktrees;
}

export async function getMainWorktreeRoot(cwd?: string): Promise<string> {
  const proc = Bun.spawn(
    ["git", "rev-parse", "--path-format=absolute", "--git-common-dir"],
    { cwd, stdout: "pipe", stderr: "pipe" }
  );
  const gitDir = (await new Response(proc.stdout).text()).trim();
  await proc.exited;
  return gitDir.replace(/\/\.git$/, "");
}

export async function getCurrentBranch(cwd?: string): Promise<string> {
  const proc = Bun.spawn(["git", "rev-parse", "--abbrev-ref", "HEAD"], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  const text = await new Response(proc.stdout).text();
  await proc.exited;
  return text.trim();
}

export async function addWorktree(
  opts: { branch: string; path: string; base?: string; detach?: boolean; force?: boolean },
  cwd?: string
): Promise<void> {
  const args = ["git", "worktree", "add"];
  if (opts.force) args.push("--force");
  if (opts.detach) {
    args.push(opts.path, opts.base ?? "HEAD");
  } else {
    args.push("-b", opts.branch, opts.path);
    if (opts.base) args.push(opts.base);
  }

  const proc = Bun.spawn(args, { cwd, stdout: "inherit", stderr: "inherit" });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`git worktree add failed (exit code ${exitCode})`);
  }
}

export async function removeWorktree(
  wtPath: string,
  opts?: { force?: boolean },
  cwd?: string
): Promise<void> {
  const args = ["git", "worktree", "remove", wtPath];
  if (opts?.force) args.push("--force");

  const proc = Bun.spawn(args, { cwd, stdout: "inherit", stderr: "inherit" });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`git worktree remove failed (exit code ${exitCode})`);
  }
}

export async function pruneWorktrees(cwd?: string): Promise<void> {
  const proc = Bun.spawn(["git", "worktree", "prune"], {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  });
  await proc.exited;
}

export async function hasUncommittedChanges(wtPath: string): Promise<boolean> {
  const proc = Bun.spawn(["git", "status", "--porcelain"], {
    cwd: wtPath,
    stdout: "pipe",
    stderr: "pipe",
  });
  const text = await new Response(proc.stdout).text();
  await proc.exited;
  return text.trim().length > 0;
}

export async function deleteBranch(branch: string, cwd?: string): Promise<void> {
  const proc = Bun.spawn(["git", "branch", "-d", branch], {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const forceProc = Bun.spawn(["git", "branch", "-D", branch], {
      cwd,
      stdout: "inherit",
      stderr: "inherit",
    });
    await forceProc.exited;
  }
}

export async function getWorktreeStatus(wtPath: string): Promise<{
  branch: string;
  head: string;
  changedFiles: number;
  lastCommit: string;
}> {
  const branchProc = Bun.spawn(["git", "rev-parse", "--abbrev-ref", "HEAD"], {
    cwd: wtPath,
    stdout: "pipe",
    stderr: "pipe",
  });
  const headProc = Bun.spawn(["git", "rev-parse", "--short", "HEAD"], {
    cwd: wtPath,
    stdout: "pipe",
    stderr: "pipe",
  });
  const statusProc = Bun.spawn(["git", "status", "--porcelain"], {
    cwd: wtPath,
    stdout: "pipe",
    stderr: "pipe",
  });
  const logProc = Bun.spawn(
    ["git", "log", "-1", "--format=%s (%cr)"],
    { cwd: wtPath, stdout: "pipe", stderr: "pipe" }
  );

  const [branchText, headText, statusText, logText] = await Promise.all([
    new Response(branchProc.stdout).text(),
    new Response(headProc.stdout).text(),
    new Response(statusProc.stdout).text(),
    new Response(logProc.stdout).text(),
  ]);

  await Promise.all([
    branchProc.exited,
    headProc.exited,
    statusProc.exited,
    logProc.exited,
  ]);

  return {
    branch: branchText.trim(),
    head: headText.trim(),
    changedFiles: statusText.trim().split("\n").filter(Boolean).length,
    lastCommit: logText.trim(),
  };
}
