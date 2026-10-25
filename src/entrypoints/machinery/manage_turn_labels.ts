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
 *   - `closed` — the node closed (#352): both come off, neither goes on. The state
 *     read the other two phases make gates this one too: a node the read says is
 *     open gets no write at all — the runner's end-of-run strip fires on every
 *     ending, open nodes included, and must not strip the labels a live turn is
 *     wearing — while a node the read says is closed (or one the read could not
 *     answer) is stripped of what it wears.
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
