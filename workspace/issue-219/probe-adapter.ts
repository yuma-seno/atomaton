import { FAKE_GH_IMPL } from "/home/runner/work/atomaton/atomaton/src/entrypoints/machinery/testing/fake-gh-env.ts";
import { latestRequestOn } from "/home/runner/work/atomaton/atomaton/src/adapters/github/thread.ts";

process.env.ATOMATON_FAKE_GH = FAKE_GH_IMPL;
process.env.GH_TOKEN = "fake";
process.env.GITHUB_TOKEN = "fake";
process.env.FAKE_GH_RESPONSES = JSON.stringify([
  { match: ["repos/o/r/issues/7", "--jq"], stdout: "/reviewer\n\nPart of #219" },
  { match: ["repos/o/r/issues/7/comments"], stdout: JSON.stringify([
    { id: 1, created_at: "2026-10-19T17:41:32Z", body: "RESULT\n\n- /engineer\n<!-- atomaton:agent=reviewer -->", user: { type: "Bot" } },
  ]) },
]);
console.log("env set:", process.env.FAKE_GH_RESPONSES?.slice(0, 40));
console.log(latestRequestOn("o/r", 7, (n) => n === "engineer" || n === "reviewer"));
