import { defineCommand } from "citty";
import fs from "node:fs";
import path from "node:path";
import * as clack from "@clack/prompts";
import { loadConfig, findConfig, saveConfig } from "../lib/config.js";
import type { AawtConfig, TemplateConfig } from "../types.js";
import * as ui from "../lib/ui.js";

export default defineCommand({
  meta: {
    name: "init",
    description: "Create or edit .aawt.json config",
  },
  args: {
    yes: {
      type: "boolean",
      alias: "y",
      description: "Accept all defaults",
    },
  },
  async run(ctx) {
    const useDefaults = ctx.args.yes as boolean;
    const existing = await findConfig();

    const intro = existing ? "Editing .aawt.json" : "Create .aawt.json";
    clack.intro(intro);

    const defaults: AawtConfig = {
      worktreeDir: ".aawt",
      defaultBase: "main",
      init: [],
      setup: [],
      templates: {},
      ...existing,
    };

    if (useDefaults) {
      const configPath = existing?.configPath ?? path.join(process.cwd(), ".aawt.json");
      const { configPath: _, rootDir: __, ...config } = defaults;
      await saveConfig(configPath, config);
      clack.outro("Created .aawt.json with defaults");
      return;
    }

    const worktreeDir = await clack.text({
      message: "Worktree 存放目录",
      defaultValue: defaults.worktreeDir ?? ".aawt",
      placeholder: ".aawt",
    });

    if (clack.isCancel(worktreeDir)) {
      clack.cancel("Cancelled");
      process.exit(0);
    }

    const defaultBase = await clack.text({
      message: "默认基础分支",
      defaultValue: defaults.defaultBase ?? "main",
      placeholder: "main",
    });

    if (clack.isCancel(defaultBase)) {
      clack.cancel("Cancelled");
      process.exit(0);
    }

    const initStr = await clack.text({
      message: "首次初始化命令 (逗号分隔)",
      defaultValue: defaults.init?.join(", ") ?? "",
      placeholder: "pnpm install, cp .env.example .env",
    });

    if (clack.isCancel(initStr)) {
      clack.cancel("Cancelled");
      process.exit(0);
    }

    const setupStr = await clack.text({
      message: "后续使用命令 (逗号分隔)",
      defaultValue: defaults.setup?.join(", ") ?? "",
      placeholder: "pnpm install",
    });

    if (clack.isCancel(setupStr)) {
      clack.cancel("Cancelled");
      process.exit(0);
    }

    const templates: Record<string, TemplateConfig> = { ...(defaults.templates ?? {}) };

    if (Object.keys(templates).length > 0) {
      const keepTemplates = await clack.confirm({
        message: `保留已有模板 (${Object.keys(templates).join(", ")})？`,
        initialValue: true,
      });

      if (clack.isCancel(keepTemplates) || !keepTemplates) {
        for (const key of Object.keys(templates)) {
          delete templates[key];
        }
      }
    }

    let addMore = await clack.confirm({
      message: "是否添加模板？",
      initialValue: Object.keys(templates).length === 0,
    });

    if (clack.isCancel(addMore)) addMore = false;

    while (addMore) {
      const templateName = await clack.text({
        message: "模板名称",
        placeholder: "feature",
      });

      if (clack.isCancel(templateName)) break;

      const existingTemplate = templates[templateName];

      const branchPrefix = await clack.text({
        message: "分支前缀",
        defaultValue: existingTemplate?.branchPrefix ?? "",
        placeholder: "feat/",
      });

      if (clack.isCancel(branchPrefix)) break;

      const base = await clack.text({
        message: "基础分支",
        defaultValue: existingTemplate?.base ?? defaultBase,
        placeholder: "develop",
      });

      if (clack.isCancel(base)) break;

      const templateInitStr = await clack.text({
        message: "模板初始化命令 (逗号分隔)",
        defaultValue: existingTemplate?.init?.join(", ") ?? initStr,
        placeholder: "pnpm install, pnpm db:migrate",
      });

      if (clack.isCancel(templateInitStr)) break;

      templates[templateName] = {
        ...(branchPrefix ? { branchPrefix } : {}),
        ...(base && base !== defaultBase ? { base } : {}),
        init: parseCommands(templateInitStr),
      };

      const continueAdding = await clack.confirm({
        message: "继续添加模板？",
        initialValue: false,
      });

      if (clack.isCancel(continueAdding) || !continueAdding) break;
    }

    const config: AawtConfig = {
      worktreeDir: worktreeDir || ".aawt",
      defaultBase: defaultBase || "main",
      init: parseCommands(initStr),
      setup: parseCommands(setupStr),
      ...(Object.keys(templates).length > 0 ? { templates } : {}),
    };

    const configPath = existing?.configPath ?? path.join(process.cwd(), ".aawt.json");
    await saveConfig(configPath, config);

    clack.outro("Created .aawt.json");
  },
});

function parseCommands(str: string): string[] {
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
