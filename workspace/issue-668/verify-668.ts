import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const REPO = "/home/runner/work/atomaton/atomaton";
const { planUpdate } = await import(`${REPO}/src/domain/machinery/update-plan.ts`);
const { applyPlan } = await import(`${REPO}/src/entrypoints/machinery/lib/update-apply.ts`);

const raw = async (ref: string) => {
  const res = await fetch(`https://raw.githubusercontent.com/yuma-seno/atomaton/${ref}/src/content/config.yaml`);
  if (!res.ok) throw new Error(`${ref}: ${res.status}`);
  return res.text();
};

const CONFIG = ".github/atomaton/config.yaml";
const base = await raw("v0.28.0");
const target = await raw("v0.29.0");
const ours = readFileSync(join(REPO, CONFIG), "utf8");

const tree = mkdtempSync(join(tmpdir(), "verify-668-"));
mkdirSync(join(tree, dirname(CONFIG)), { recursive: true });
writeFileSync(join(tree, CONFIG), ours);

const plan = planUpdate("v0.28.0", "v0.29.0", new Map([[CONFIG, base]]), new Map([[CONFIG, target]]), new Map([[CONFIG, ours]]));
const applied = applyPlan(tree, plan, new Map([[CONFIG, base]]), new Map([[CONFIG, target]]), new Map([[CONFIG, ours]]));
if (!("result" in applied)) throw new Error(applied.why);
const r = applied.result;

const onDisk = readFileSync(join(tree, CONFIG), "utf8");
console.log("plan merge:", plan.merge);
console.log("conflicts:", r.conflicts);
console.log("held:", r.held.map((h) => h.path));
console.log("committed file still the tree's copy:", onDisk === ours);
console.log("markers in committed file:", onDisk.includes("<<<<<<<"));
console.log("marker lines reported:", r.held[0]?.text.split("\n").filter((l) => /^(<{7}|>{7}|={7})/.test(l)));
console.log("---- hunks ----");
console.log(r.held[0]?.text ?? "(none)");
