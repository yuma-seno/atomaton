#!/usr/bin/env bun
/**
 * launch_atoma.ts — run atoma once, as the credential-holding user.
 *
 * The thin executable half of `lib/atoma-launch.ts`: parse the arguments the
 * runner's step passes, derive the budget from what is left of the job, build
 * the agent environment (`lib/agent-env.ts`), and exec. The second turn does
 * not come through here — `decide_reask.ts` calls the shared launch function
 * directly — but both go through the same function, so the two invocations of
 * atoma cannot drift apart.
 *
 * Exits with atoma's own exit code and prints nothing to stdout. The step
 * catches that exit with `|| EXIT_CODE=$?`, which is what keeps an atoma
 * failure from failing the machinery: the boundary flag stays unwritten, and
 * "Post result comment" reads the difference.
 */
import { parseArgs } from "node:util";
import { AGENT_DEFINITIONS_DIR } from "../../domain/machinery/machinery-layout.ts";
import { machineryRoot } from "../../adapters/runner/machinery.ts";
import { agentBudget, buildAgentEnv } from "./lib/agent-env.ts";
import { launchAtoma } from "./lib/atoma-launch.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface LaunchAtomaArgs {
  "run-dir": string;
  "tool-cache": string;
  "tools-file": string;
  "credentials-file": string;
  "stop-file": string;
  "deadline-at": string;
  "min-budget-secs": string;
  out: string;
  logs: string;
}

export const ref = defineScript<LaunchAtomaArgs>(import.meta.url);

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      "run-dir": { type: "string" },
      "tool-cache": { type: "string" },
      "tools-file": { type: "string" },
      "credentials-file": { type: "string" },
      "stop-file": { type: "string" },
      "deadline-at": { type: "string" },
      "min-budget-secs": { type: "string" },
      out: { type: "string" },
      logs: { type: "string" },
    },
  });
  for (const required of ["run-dir", "tool-cache", "tools-file", "credentials-file", "stop-file", "deadline-at", "min-budget-secs", "out", "logs"] as const) {
    if (!values[required]) {
      console.error(`launch_atoma: --${required} is required`);
      process.exit(2);
    }
  }

  const agent = process.env.AGENT ?? "";
  if (!agent) {
    console.error("launch_atoma: AGENT is not set; no definition to run");
    process.exit(2);
  }

  const deadlineAt = Number(values["deadline-at"]);
  if (!Number.isFinite(deadlineAt)) {
    console.error(`launch_atoma: --deadline-at '${values["deadline-at"]}' is not a number`);
    process.exit(2);
  }
  const minBudgetSecs = Number(values["min-budget-secs"]);

  const { budget, floored } = agentBudget(deadlineAt, Date.now() / 1000, minBudgetSecs);
  if (floored) {
    console.error(`::warning::only ${Math.floor(deadlineAt - Date.now() / 1000)} seconds of the job are left; giving the agent the ${minBudgetSecs}-second floor`);
  }
  console.error(`launch_atoma: agent time budget: ${budget} seconds`);

  const root = machineryRoot() ?? ".";
  const exitCode = launchAtoma({
    agent,
    machineryRoot: root,
    toolsFile: values["tools-file"]!,
    credentialsFile: values["credentials-file"]!,
    stopFile: values["stop-file"]!,
    session: `${values["run-dir"]}/session.json`,
    outFile: values.out!,
    logsFile: values.logs!,
    appendLogs: false,
    budgetSecs: budget,
    envEntries: buildAgentEnv(process.env, {
      toolCache: values["tool-cache"]!,
      runDir: values["run-dir"]!,
    }),
  });
  process.exit(exitCode);
}

if (import.meta.main) main();
