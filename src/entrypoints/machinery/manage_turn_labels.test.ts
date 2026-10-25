import { describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { makeConfigDir, runWithFakeGh, scriptPath } from "./testing/harness.ts";

/**
 * The two labels are complements, and every call moves BOTH (#223): a run takes the
 * turn (`running`), the turn hands back (`with-person`), or the node closed and
 * neither is true any more (`closed`, #352). A caller that moved one without the
 * other would leave a node wearing both or neither, and neither state is readable
 * on the page.
 *
 * The state read (#352) is answered by the first rule in each set; a set without
 * one reads nothing, and `applyTurnLabels` keeps the phase it was given — the
 * pre-#352 behavior — which is its own test further down.
 */

/** The state read `applyTurnLabels` makes, answered open with both labels on. */
const stateOpen = {
  match: ["repos/{owner}/{repo}/issues/42"],
  stdout: JSON.stringify({
    state: "open",
    labels: [{ name: "atomaton/in-progress" }, { name: "atomaton/waiting-for-person" }],
  }),
};
/** The same read, answered closed; the node wears in-progress and not the person's label. */
const stateClosed = {
  match: ["repos/{owner}/{repo}/issues/42"],
  stdout: JSON.stringify({ state: "closed", labels: [{ name: "atomaton/in-progress" }] }),
};
/** The read answered open with nothing on — a node whose labels already went somewhere. */
const stateOpenBare = {
  match: ["repos/{owner}/{repo}/issues/42"],
  stdout: JSON.stringify({ state: "open", labels: [] }),
};

type FakeGhOpts = NonNullable<Parameters<typeof runWithFakeGh>[2]>;

function run(phase: string, rules: FakeGhOpts["rules"]) {
  const configDir = makeConfigDir({});
  try {
    return runWithFakeGh(scriptPath("manage_turn_labels.ts"), ["--phase", phase, "--number", "42"], {
      cwd: configDir,
      rules,
    });
  } finally {
    rmSync(configDir, { recursive: true, force: true });
  }
}

const addsOf = (r: ReturnType<typeof run>) => r.ghCalls.filter((c) => c.includes("--add-label")).map((c) => c.join(" "));
const removesOf = (r: ReturnType<typeof run>) =>
  r.ghCalls.filter((c) => c.includes("--remove-label")).map((c) => c.join(" "));
const createsOf = (r: ReturnType<typeof run>) => r.ghCalls.filter((c) => c[0] === "label").map((c) => c.join(" "));

describe("manage_turn_labels.ts", () => {
  test("running: the in-progress label goes on, the person's comes off", () => {
    const r = run("running", [stateOpen, { match: ["label"] }, { match: ["issue", "edit"] }]);
    expect(r.status).toBe(0);
    expect(addsOf(r).some((c) => c.includes("atomaton/in-progress"))).toBe(true);
    expect(removesOf(r).some((c) => c.includes("atomaton/waiting-for-person"))).toBe(true);
    expect(addsOf(r).some((c) => c.includes("waiting-for-person"))).toBe(false);
  });

  test("with-person: the person's label goes on, the in-progress comes off", () => {
    const r = run("with-person", [stateOpen, { match: ["label"] }, { match: ["issue", "edit"] }]);
    expect(r.status).toBe(0);
    expect(addsOf(r).some((c) => c.includes("atomaton/waiting-for-person"))).toBe(true);
    expect(removesOf(r).some((c) => c.includes("atomaton/in-progress"))).toBe(true);
    expect(addsOf(r).some((c) => c.includes("in-progress"))).toBe(false);
  });

  test("a removal is attempted only for a label the read says is on (#352)", () => {
    const r = run("with-person", [stateOpenBare, { match: ["label"] }, { match: ["issue", "edit"] }]);
    expect(r.status).toBe(0);
    // Nothing to take off, so no failed `issue edit` and no warning in the log.
    expect(removesOf(r)).toEqual([]);
    expect(addsOf(r).some((c) => c.includes("atomaton/waiting-for-person"))).toBe(true);
  });

  test("closed: both labels come off and nothing is added or created (#352)", () => {
    const r = run("closed", [stateClosed, { match: ["label"] }, { match: ["issue", "edit"] }]);
    expect(r.status).toBe(0);
    expect(removesOf(r).some((c) => c.includes("atomaton/in-progress"))).toBe(true);
    expect(addsOf(r)).toEqual([]);
    // The person's label was not on (the read said so), so it is not "removed" —
    // and no label definition is created for a phase that adds nothing.
    expect(removesOf(r).some((c) => c.includes("waiting-for-person"))).toBe(false);
    expect(createsOf(r)).toEqual([]);
    expect(r.ghCalls.some((c) => c.join(" ").includes("waiting-for-person"))).toBe(false);
  });

  test("closed on a node the read says is open writes nothing (#352)", () => {
    const r = run("closed", [stateOpen, { match: ["label"] }, { match: ["issue", "edit"] }]);
    expect(r.status).toBe(0);
    // The mirror of the test above, and the one that keeps the hand-back intact:
    // the runner's end-of-run strip fires on every ending, open nodes included —
    // the release that just ran may have put waiting-for-person on this node, and
    // a park is holding in-progress. A live turn is not the strip's business.
    expect(removesOf(r)).toEqual([]);
    expect(addsOf(r)).toEqual([]);
    expect(createsOf(r)).toEqual([]);
    expect(r.ghCalls.length).toBe(1); // the state read alone
  });

  test("closed on a node the read cannot answer strips unconditionally", () => {
    const r = run("closed", [{ match: ["label"] }, { match: ["issue", "edit"] }]);
    expect(r.status).toBe(0);
    // No rule answers the state read: a failed read is not an answer, and the
    // close-event strips must still take their labels off. This is the pre-#352
    // behavior, kept for exactly the read that cannot say.
    expect(removesOf(r).some((c) => c.includes("atomaton/in-progress"))).toBe(true);
    expect(removesOf(r).some((c) => c.includes("atomaton/waiting-for-person"))).toBe(true);
    expect(addsOf(r)).toEqual([]);
  });

  test("with-person on a node that closed is bent to closed: no waiting-for-person goes on (#352)", () => {
    const r = run("with-person", [stateClosed, { match: ["label"] }, { match: ["issue", "edit"] }]);
    expect(r.status).toBe(0);
    // The in-progress the closed node still wore comes off...
    expect(removesOf(r).some((c) => c.includes("atomaton/in-progress"))).toBe(true);
    // ...and the person's label does not go on — the caller's phase was stale, and
    // the node's state is the answer (#352).
    expect(addsOf(r)).toEqual([]);
    expect(createsOf(r)).toEqual([]);
    expect(r.stderr).toContain("is closed");
  });

  test("running on a node that closed adds nothing either (#352)", () => {
    const r = run("running", [stateClosed, { match: ["label"] }, { match: ["issue", "edit"] }]);
    expect(r.status).toBe(0);
    expect(addsOf(r)).toEqual([]);
    expect(createsOf(r)).toEqual([]);
    expect(removesOf(r).some((c) => c.includes("atomaton/in-progress"))).toBe(true);
  });

  test("a state that cannot be read keeps the phase it was given: the pre-#352 behavior", () => {
    const r = run("with-person", [{ match: ["label"] }, { match: ["issue", "edit"] }]);
    expect(r.status).toBe(0);
    // No rule answers the state read, so nothing is known about the node: the
    // labels move as the caller asked — an unread node is not evidence it closed.
    expect(addsOf(r).some((c) => c.includes("atomaton/waiting-for-person"))).toBe(true);
    expect(removesOf(r).some((c) => c.includes("atomaton/in-progress"))).toBe(true);
    expect(r.stderr).toContain("without the closed guard");
  });

  test("a wrong phase is refused", () => {
    const r = run("whenever", [{ match: ["label"] }, { match: ["issue", "edit"] }]);
    expect(r.status).toBe(2);
    expect(r.ghCalls.length).toBe(0);
  });
});
