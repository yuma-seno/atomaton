#!/usr/bin/env bun
/**
 * Call the `probe` tool in `mode: read` on the source server, one call per
 * argument, and print what it returned.
 *
 * The live `probe` tool in a run is the deployed bundle, which has no read mode;
 * this spawns the source file being changed so the measurement is of the code that
 * is being added rather than of a copy of it.
 *
 * Usage: bun run /tmp/atomaton-workspace/probe-read.ts <url> [--follow] [--auth]
 */
import { spawn } from "node:child_process";

const [url, ...flags] = process.argv.slice(2);
if (!url) throw new Error("usage: probe-read.ts <url> [--follow] [--auth]");

const args: Record<string, unknown> = { mode: "read", url };
if (flags.includes("--follow")) args.follow_redirects = true;
if (flags.includes("--auth")) args.authenticate = true;

const child = spawn(
  process.execPath,
  ["run", "/home/runner/work/atomaton/atomaton/src/entrypoints/tools/mcp/attachments.ts"],
  {
    cwd: "/home/runner/work/atomaton/atomaton",
    env: {
      PATH: process.env.PATH ?? "",
      HOME: process.env.HOME ?? "/tmp",
      // No GH_TOKEN: this run's shell has none, so `--auth` is expected to fail here.
      ...(process.env.GH_TOKEN ? { GH_TOKEN: process.env.GH_TOKEN } : {}),
      GITHUB_REPOSITORY: "yuma-seno/atomaton",
    },
  },
);

let out = "";
let err = "";
child.stderr.on("data", (d) => (err += d.toString()));
const timer = setTimeout(() => {
  child.kill();
  console.error(`timed out; stderr=${err}`);
  process.exit(1);
}, 180_000);

child.stdout.on("data", (d) => {
  out += d.toString();
  const line = out.split("\n").find((l) => l.trim());
  if (!line) return;
  clearTimeout(timer);
  child.kill();
  const response = JSON.parse(line);
  const text = response?.result?.content?.[0]?.text ?? response?.error?.message ?? JSON.stringify(response, null, 2);
  console.log(text);
  if (err.trim()) console.error(`--- server stderr ---\n${err.trim()}`);
});

child.stdin.write(
  JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name: "probe", arguments: args },
  }) + "\n",
);
