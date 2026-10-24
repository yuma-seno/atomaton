import { describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { makeConfigDir, runWithFakeGh, scriptPath } from "./testing/harness.ts";

/**
 * The two labels are complements, and every call moves BOTH (#223): a run takes the
 * turn (`running`) or the turn hands back (`with-person`). A caller that moved one
 * without the other would leave a node wearing both or neither, and neither state
 * is readable on the page.
 */
describe("manage_turn_labels.ts", () => {
  test("running: the in-progress label goes on, the person's comes off", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(scriptPath("manage_turn_labels.ts"), ["--phase", "running", "--number", "42"], {
        cwd: configDir,
        rules: [{ match: ["label"] }, { match: ["issue", "edit"] }],
      });
      expect(r.status).toBe(0);
      const adds = r.ghCalls.filter((c) => c.includes("--add-label")).map((c) => c.join(" "));
      const removes = r.ghCalls.filter((c) => c.includes("--remove-label")).map((c) => c.join(" "));
      expect(adds.some((c) => c.includes("atomaton/in-progress"))).toBe(true);
      expect(removes.some((c) => c.includes("atomaton/waiting-for-person"))).toBe(true);
      expect(adds.some((c) => c.includes("waiting-for-person"))).toBe(false);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  test("with-person: the person's label goes on, the in-progress comes off", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(scriptPath("manage_turn_labels.ts"), ["--phase", "with-person", "--number", "42"], {
        cwd: configDir,
        rules: [{ match: ["label"] }, { match: ["issue", "edit"] }],
      });
      expect(r.status).toBe(0);
      const adds = r.ghCalls.filter((c) => c.includes("--add-label")).map((c) => c.join(" "));
      const removes = r.ghCalls.filter((c) => c.includes("--remove-label")).map((c) => c.join(" "));
      expect(adds.some((c) => c.includes("atomaton/waiting-for-person"))).toBe(true);
      expect(removes.some((c) => c.includes("atomaton/in-progress"))).toBe(true);
      expect(adds.some((c) => c.includes("in-progress"))).toBe(false);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  test("a wrong phase is refused", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(scriptPath("manage_turn_labels.ts"), ["--phase", "whenever", "--number", "42"], {
        cwd: configDir,
        rules: [{ match: ["label"] }, { match: ["issue", "edit"] }],
      });
      expect(r.status).toBe(2);
      expect(r.ghCalls.length).toBe(0);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });
});
