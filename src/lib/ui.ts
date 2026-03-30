const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";

export function success(msg: string) {
  console.log(`  ${GREEN}✓${RESET} ${msg}`);
}

export function error(msg: string) {
  console.error(`  ${RED}✗${RESET} ${msg}`);
}

export function info(msg: string) {
  console.log(`  ${CYAN}→${RESET} ${msg}`);
}

export function warn(msg: string) {
  console.log(`  ${YELLOW}!${RESET} ${msg}`);
}

export function dim(msg: string) {
  return `${DIM}${msg}${RESET}`;
}

export function bold(msg: string) {
  return `${BOLD}${msg}${RESET}`;
}

export function header(msg: string) {
  console.log(`\n${BOLD}${msg}${RESET}\n`);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function printTable(rows: string[][]) {
  if (rows.length === 0) return;

  const colWidths = rows[0].map((_, colIndex) =>
    Math.max(...rows.map((row) => row[colIndex]?.length ?? 0))
  );

  for (let i = 0; i < rows.length; i++) {
    const isHeader = i === 0;
    const line = rows[i]
      .map((cell, j) => {
        const padded = cell.padEnd(colWidths[j]);
        return isHeader ? bold(padded) : padded;
      })
      .join("  ");

    console.log(`  ${line}`);

    if (isHeader) {
      console.log(
        `  ${colWidths.map((w) => "─".repeat(w)).join("──")}`
      );
    }
  }
}
