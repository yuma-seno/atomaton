import { makeConfigDir, runWithFakeGh, importable } from "/home/runner/work/atomaton/atomaton/src/entrypoints/machinery/testing/harness.ts";
import { join } from "node:path";

const LIB = "/home/runner/work/atomaton/atomaton/src/app/aggregation.test.ts";
const configDir = makeConfigDir({});
const file = join(configDir, "shim.ts");
Bun.write(file, `import { dispatchOrchestratorIfReady } from "${importable("/home/runner/work/atomaton/atomaton/src/app/aggregation.ts")}";
const result = await dispatchOrchestratorIfReady({ repo: "owner/repo", parent: 5, closedNum: 10 });
console.log("KIND:" + result.kind);
`);
const subIssues = [
  { match: ["graphql"], stdout: JSON.stringify({ data: { repository: { issueOrPullRequest: { __typename: "Issue", subIssues: { nodes: [] } } } } }) },
];
const rules = [
  ...subIssues,
  { match: ["api", "comments", "--jq"], stdout: JSON.stringify([
    ["For the record, the marker looks like:", "```html", "<!-- atomaton:aggregated=10 -->", "```"].join("\n"),
    "<!-- atomaton:dispatch=atomaton -->",
  ]) },
  { match: ["api", "issues/5/comments", "--method", "POST", "atomaton:dispatch"], stdout: "555" },
  { match: ["api", "issues/5/comments", "--paginate"], stdout: JSON.stringify([{ id: 555, body: "<!-- atomaton:dispatch=atomaton -->" }]) },
  { match: ["api", "issues/5/comments", "--method", "POST", "atomaton:aggregated"], stdout: "777" },
  { match: ["workflow", "run"], code: 0 },
  { match: ["api", "issues"], stdout: JSON.stringify({ state: "open" }) },
];
const r = runWithFakeGh(file, [], { cwd: configDir, rules });
console.log("STDOUT:", r.stdout);
console.log("STDERR:", r.stderr.slice(-1500));
console.log("GH CALLS:");
for (const c of r.ghCalls) console.log("  ", c.join(" ").slice(0, 160));
