import { describe, expect, test } from "bun:test";
import { mostRecentAgent } from "./resolve_resume_agent.ts";
import { AGENT_TAG, DISPATCH_TAG } from "../../adapters/github/tags.ts";

const from = (agent: string) => `${AGENT_TAG.write(agent)}\nwork happened`;
const asked = (agent: string) => `/${agent}`;
const dispatched = (agent: string) => `${DISPATCH_TAG.write(agent)}\nAtomaton: \`${agent}\` starting on this issue.`;

describe("resolve_resume_agent.ts", () => {
  // An issue worked by an atomaton and then an engineer must resume the
  // engineer. Reading in chronological order would resume whoever went first, for
  // the whole life of the issue.
  test("takes the agent from the most recent comment that names one", () => {
    expect(mostRecentAgent([from("atomaton"), "a human comment", from("engineer")])).toBe("engineer");
  });

  test("skips comments that name no agent", () => {
    expect(mostRecentAgent([from("engineer"), "looks good to me", "+1"])).toBe("engineer");
  });

  test("finds nothing on an issue no agent has run on", () => {
    expect(mostRecentAgent(["please look at this", ""])).toBe("");
    expect(mostRecentAgent([])).toBe("");
  });

  // The defect this fallback fixes: an atomaton that decomposes work ends by
  // calling `launch_sub_agent`, which is a session-ending tool -- so it posts no
  // result comment and leaves no `atomaton:agent`. The request that started it is
  // the only record, and the aggregation gate reads this to re-invoke the parent.
  test("falls back to the request when the run left no result comment", () => {
    expect(mostRecentAgent([asked("atomaton"), "Atomaton: Launched sub-agent(s): #23→engineer"])).toBe("atomaton");
    expect(mostRecentAgent([dispatched("atomaton"), "Atomaton: Launched sub-agent(s): #23→engineer"])).toBe("atomaton");
  });

  // Newest-first across BOTH records, not "result first": a node asked for
  // `/engineer` after an atomaton's result comment must answer `engineer`.
  test("the newest record wins, whichever kind it is", () => {
    expect(mostRecentAgent([from("atomaton"), asked("engineer")])).toBe("engineer");
    expect(mostRecentAgent([asked("engineer"), from("atomaton")])).toBe("atomaton");
  });
});
