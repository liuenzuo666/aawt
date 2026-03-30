import { defineCommand } from "citty";
import { loadConfig, findConfig, saveConfig } from "../lib/config.js";
import type { AawtConfig } from "../types.js";
import * as ui from "../lib/ui.js";

export default defineCommand({
  meta: {
    name: "config",
    description: "Manage configuration",
  },
  args: {
    action: {
      type: "positional",
      description: "get | set | list",
      required: true,
    },
    key: {
      type: "positional",
      description: "Config key",
      required: false,
    },
    value: {
      type: "positional",
      description: "Config value (for set)",
      required: false,
    },
  },
  async run(ctx) {
    const action = ctx.args.action as string;
    const key = ctx.args.key as string | undefined;
    const value = ctx.args.value as string | undefined;

    const resolved = await findConfig();
    if (!resolved) {
      ui.error("No .aawt.json found. Run `aawt init` first.");
      process.exit(1);
    }

    const { configPath, ...config } = resolved;

    switch (action) {
      case "list": {
        console.log(JSON.stringify(config, null, 2));
        break;
      }
      case "get": {
        if (!key) {
          ui.error("Key is required for get");
          process.exit(1);
        }
        const val = getNestedValue(config, key);
        if (val === undefined) {
          ui.warn(`Key "${key}" not found`);
        } else {
          console.log(typeof val === "string" ? val : JSON.stringify(val));
        }
        break;
      }
      case "set": {
        if (!key || value === undefined) {
          ui.error("Key and value are required for set");
          process.exit(1);
        }
        const parsed = parseValue(value);
        setNestedValue(config, key, parsed);
        await saveConfig(configPath, config);
        ui.success(`Set ${key} = ${JSON.stringify(parsed)}`);
        break;
      }
      default:
        ui.error(`Unknown action "${action}". Use get, set, or list.`);
        process.exit(1);
    }
  },
});

function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
  const keys = key.split(".");
  let current: unknown = obj;
  for (const k of keys) {
    if (current && typeof current === "object" && k in current) {
      current = (current as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }
  return current;
}

function setNestedValue(obj: Record<string, unknown>, key: string, value: unknown): void {
  const keys = key.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current) || typeof current[keys[i]] !== "object") {
      current[keys[i]] = {};
    }
    current = current[keys[i]] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}

function parseValue(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
