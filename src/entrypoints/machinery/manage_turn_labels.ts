#!/usr/bin/env bun
/**
 * manage_turn_labels.ts — move a node's turn labels to the phase the run reached.
 *
 * Two labels say whose ball the node's turn is, and they are complements:
 *
 *   - `running` — a run took the turn: `atomaton/in-progress` on,
 *     `atomaton/waiting-for-person` off.
 *   - `with-person` — the turn came back to a person: `in-progress` off,
 *     `waiting-for-person` on.
 *   - `closed` — the node closed (#352): both come off, neither goes on. The node
 *     is closed by the very event that runs the callers of this phase (a pull
 *     request's close, an issue's close, a run ending on a node its own close
 *     ended); the state read the other two phases make is still taken here, but
 *     only to learn what the node is wearing, so the strip touches what is on and
 *     nothing else.
 *
 * One script, because the labels are moved at the same moments by the same
 * callers (the runner's start and release steps, a refused hand-off, a stop that
 * ends a park, the strips that follow a close) and a caller that moved one without
 * the other would leave a node wearing both or neither. The names come from
 * `chain.labels` in config.yaml, with defaults in `adapters/runner/config.ts`; see
 * `lib/turn-labels.ts` for the rule.
 *
 * Best-effort: never fails the calling step, only logs a warning (matching the
 * previous `2>/dev/null || true` bash behavior).
 *
 * Usage:
 *   manage_turn_labels.ts --phase running|with-person|closed --number N [--repo OWNER/REPO]
 */
import { parseArgs } from "node:util";
import { applyTurnLabels } from "./lib/turn-labels.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface ManageTurnLabelsArgs {
  phase: "running" | "with-person" | "closed";
  number: string | number;
  repo?: string;
}

export const ref = defineScript<ManageTurnLabelsArgs>(import.meta.url);

const PHASES = ["running", "with-person", "closed"] as const;

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      phase: { type: "string" },
      number: { type: "string" },
      repo: { type: "string" },
    },
  });

  if (!PHASES.includes(values.phase as (typeof PHASES)[number])) {
    console.error(`usage: manage_turn_labels.ts --phase ${PHASES.join("|")} --number N [--repo OWNER/REPO]`);
    process.exit(2);
  }
  if (!values.number) {
    console.error(`usage: manage_turn_labels.ts --phase ${PHASES.join("|")} --number N [--repo OWNER/REPO]`);
    process.exit(2);
  }

  applyTurnLabels(values.phase as (typeof PHASES)[number], values.repo ?? "", String(values.number));
}

if (import.meta.main) main();
