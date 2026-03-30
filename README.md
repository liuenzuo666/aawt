# aawt

Git worktree 管理工具，为 AI Coding Agent 工作流设计。

## 特性

- 一键创建/删除 worktree，自动执行初始化钩子
- 项目级配置文件，定义默认行为和模板
- 首次初始化与后续使用的差异化命令支持
- TUI 交互式配置引导
- 机器可读的 JSON 输出，方便 AI agent 解析

## 安装

```bash
# 从 GitHub 安装
bun install -g github:liuenzuo666/aawt

# 本地开发
git clone https://github.com/liuenzuo666/aawt.git
cd aawt
bun install
bun link
```

## 快速开始

```bash
# 交互式创建配置文件
aawt init

# 创建 worktree（自动执行 init 钩子）
aawt new fix-login-bug

# 列出所有 worktree
aawt list

# 在 worktree 中执行命令
aawt run fix-login-bug -- pnpm test

# 查看 worktree 状态
aawt status fix-login-bug

# 删除 worktree
aawt rm fix-login-bug
```

## 命令

| 命令 | 别名 | 说明 |
|------|------|------|
| `aawt new <name>` | `n` | 创建 worktree |
| `aawt list` | `ls` | 列出所有 worktree |
| `aawt status [name]` | | 查看 worktree 状态 |
| `aawt remove <name>` | `rm` | 删除 worktree |
| `aawt prune` | | 清理失效的 worktree 引用 |
| `aawt shell <name>` | | 输出 worktree 路径 |
| `aawt run <name> -- <cmd>` | | 在 worktree 中执行命令 |
| `aawt init` | | 交互式创建配置文件 |
| `aawt config <action>` | | 管理配置项 |

### `aawt new`

```bash
aawt new <name> [选项]

选项:
  -b, --base <branch>      基础分支（默认: 配置文件或当前分支）
  -t, --template <name>    使用命名模板
  --detach                 创建分离 HEAD
  --skip-init              跳过首次初始化钩子
  --skip-setup             跳过后续钩子
  --force                  强制创建
```

创建流程：
1. 基于 `--base` 分支创建新分支
2. 执行 `git worktree add` 创建工作目录
3. 首次创建：执行 `init` 钩子（如依赖安装）
4. 非首次进入：执行 `setup` 钩子（如依赖更新）

### `aawt list`

```bash
aawt list [--json]
```

输出示例：

```
  NAME       BRANCH      HEAD      STATUS
  ────────────────────────────────────────────
  * (main)   main        f1db7979  new
  fix-bug    fix-bug     a1b2c3d4  initialized
```

`--json` 输出结构化数据，供 AI agent 解析。

### `aawt run`

```bash
aawt run <name> -- <command>
```

在指定 worktree 的目录下执行命令，无需切换工作目录：

```bash
aawt run fix-bug -- pnpm test
aawt run fix-bug -- git diff
```

### `aawt shell`

输出 worktree 的绝对路径，用于 shell 集成：

```bash
cd $(aawt shell fix-bug)
```

可在 `.zshrc` / `.bashrc` 中添加快捷函数：

```bash
awt() { cd "$(aawt shell "$1")"; }
```

### `aawt config`

```bash
aawt config list                    # 列出所有配置
aawt config get worktreeDir         # 查看单个配置项
aawt config set defaultBase develop # 设置配置项
```

## 配置文件

在项目根目录创建 `.aawt.json`：

```json
{
  "worktreeDir": ".aawt",
  "defaultBase": "main",
  "init": ["pnpm install", "cp .env.example .env"],
  "setup": ["pnpm install"],
  "templates": {
    "feature": {
      "branchPrefix": "feat/",
      "base": "develop",
      "init": ["pnpm install", "pnpm db:migrate"]
    },
    "hotfix": {
      "branchPrefix": "fix/",
      "base": "main",
      "init": ["pnpm install"]
    }
  }
}
```

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `worktreeDir` | `string` | `.aawt` | worktree 存放目录，支持相对/绝对路径 |
| `defaultBase` | `string` | 当前分支 | 新建 worktree 的默认基础分支 |
| `init` | `string[]` | `[]` | 首次初始化时执行的命令 |
| `setup` | `string[]` | `[]` | 后续进入时执行的命令 |
| `templates` | `object` | `{}` | 命名模板，可预设分支前缀和钩子 |

所有字段可选，零配置即可使用。

### 模板

通过模板预设常用的 worktree 创建模式：

```bash
aawt new user-auth -t feature
# 等同于: aawt new feat/user-auth -b develop
# 并自动执行模板中定义的 init 钩子
```

### 首次检测

每个 worktree 创建后会在根目录放置 `.aawt-initialized` 哨兵文件。工具通过此文件判断是否为首次进入：

- **首次**（哨兵不存在）：执行 `init` 钩子，创建哨兵文件
- **非首次**（哨兵存在）：执行 `setup` 钩子

## Shell 集成

在 `.zshrc` 或 `.bashrc` 中添加：

```bash
# 快速跳转到 worktree
awt() { cd "$(aawt shell "$1")"; }
```

使用：

```bash
awt fix-login-bug    # 直接跳转到 worktree 目录
```

## License

MIT
