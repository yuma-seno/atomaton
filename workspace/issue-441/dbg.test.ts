import { expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { makeConfigDir, runWithFakeGh, scriptPath } from "/home/runner/work/atomaton/atomaton/src/entrypoints/machinery/testing/harness.ts";

const m = (id: number, body: string) => ({ id, body, user: { type: "Bot" }, created_at: new Date().toISOString() });

test("locks", () => {
  const configDir = makeConfigDir({});
  try {
    const r = runWithFakeGh(
      "/home/runner/work/atomaton/atomaton/src/entrypoints/machinery/lock_probe.ts",
      ["--number", "9"],
      {
        cwd: configDir,
        env: { GITHUB_REPOSITORY: "owner/repo" },
        rules: [{
          match: ["api", "issues/9/comments"],
          stdout: JSON.stringify([
            m(101, "<!-- atomaton:took=55 run=7 -->"),
            m(999, "<!-- atomaton:ended=done answers=55 run=4242 -->"),
            m(200, "<!-- atomaton:took=201 run=9999 -->"),
          ]),
        }],
      },
    );
    console.log("STATUS", r.status, r.stdout, r.stderr);
  } finally {
    rmSync(configDir, { recursive: true, force: true });
  }
});
