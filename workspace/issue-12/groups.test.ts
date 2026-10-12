import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { toolDefaults } from "/home/runner/work/atomaton/atomaton/src/domain/machinery/shipped-servers.ts";
import { TOOLS_DIR, sourceOf } from "/home/runner/work/atomaton/atomaton/src/domain/machinery/machinery-layout.ts";

test("groups", () => {
  const PREFIX = "${ATOMATON_MACHINERY_ROOT:-.}/";
  const out: string[] = [];
  const seen = new Map<string, boolean>();
  for (const [name, server] of Object.entries(toolDefaults().servers)) {
    const args = Array.isArray(server.args) ? server.args.map(String) : [];
    const arg = args.find((a) => a.startsWith(PREFIX) && a.slice(PREFIX.length).startsWith(TOOLS_DIR + "/"));
    if (!arg) { out.push(`${name}: (no script of ours) env=${JSON.stringify(server.env)}`); continue; }
    const src = join("src", sourceOf(TOOLS_DIR), arg.slice(PREFIX.length + TOOLS_DIR.length + 1));
    const hardens = /^\s*hardenCredentialHolder\(/m.test(readFileSync(src, "utf8"));
    seen.set(src, hardens);
    out.push(`${name}: ${src} hardens=${hardens} env=${JSON.stringify(server.env)}`);
  }
  console.log(out.join("\n"));
  console.log("distinct hardening programs:", [...seen.values()].filter(Boolean).length);
  expect(true).toBe(true);
});
