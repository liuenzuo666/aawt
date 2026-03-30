#!/usr/bin/env bun
import { defineCommand, runMain } from "citty";
import pkg from "./package.json";
import newCmd from "./src/commands/new.js";
import listCmd from "./src/commands/list.js";
import statusCmd from "./src/commands/status.js";
import removeCmd from "./src/commands/remove.js";
import pruneCmd from "./src/commands/prune.js";
import shellCmd from "./src/commands/shell.js";
import runCmd from "./src/commands/run.js";
import initCmd from "./src/commands/init.js";
import configCmd from "./src/commands/config.js";

const mainCommand = defineCommand({
  meta: {
    name: "aawt",
    version: pkg.version,
    description: "Git worktree manager for AI agent workflows",
  },
  subCommands: {
    new: newCmd,
    n: newCmd,
    list: listCmd,
    ls: listCmd,
    status: statusCmd,
    remove: removeCmd,
    rm: removeCmd,
    prune: pruneCmd,
    shell: shellCmd,
    run: runCmd,
    init: initCmd,
    config: configCmd,
  },
});

runMain(mainCommand);
