export interface AawtConfig {
  worktreeDir?: string;
  defaultBase?: string;
  init?: string[];
  setup?: string[];
  templates?: Record<string, TemplateConfig>;
}

export interface TemplateConfig {
  branchPrefix?: string;
  base?: string;
  init?: string[];
  setup?: string[];
}

export interface ResolvedConfig extends AawtConfig {
  rootDir: string;
  configPath: string;
}

export interface WorktreeInfo {
  name: string;
  path: string;
  branch: string | null;
  head: string;
  isMain: boolean;
  initialized: boolean;
}

export interface HookResult {
  command: string;
  exitCode: number;
  duration?: number;
}

export interface SentinelData {
  initializedAt: string;
  name: string;
  initHooksResult: {
    exitCode: number;
    commands: string[];
  };
}
