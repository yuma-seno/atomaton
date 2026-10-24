#!/usr/bin/env bun
/**
 * archive_before_compaction.ts — the machinery's `before_compaction` hook: copy the
 * session that is about to be replaced onto the `atomaton-data` branch, before atoma
 * overwrites it with its compacted form.
 *
 * Declared file-wide in `tools.watch` (see `defaults.yaml`), so every server's tools
 * file carries it and the hook fires once per compaction, whoever's tool grew the
 * session. See `domain/machinery/tools-file.ts` for how the file-wide block reaches
 * the core's reserved `hooks` key.
 *
 * ## What it receives (stdin JSON, from atoma)
 *
 * `{"agent", "session_path", "prompt_tokens", "context_limit"}`. The session path is
 * the one atoma is about to overwrite, and the runner has ALREADY saved this run's
 * state to atomaton-data through `save_agent_session` — but that save happened at the
 * last turn boundary, not now: the messages this hook sees on disk are the ones that
 * would otherwise be lost, which is exactly the point of archiving them.
 *
 * ## What it answers
 *
 * `{"archived": true}` on stdout when the copy was made; `{"archived": false}`
 * otherwise. Every failure path answers `false` and exits 0 — the hook is
 * fail-open by contract (see `infra/hooks.rs`), because refusing to proceed cannot
 * un-fill the model's window, and the only thing a failure costs is the archive,
 * which the log already records.
 *
 * ## How the write happens
 *
 * Through `archiveSession` (`machinery/lib/atomaton-data.ts`), the same path the
 * recovery archives use: a git worktree on the data branch, a numbered path
 * allocated inside the retrying worktree so two compactions racing on one node
 * cannot pick the same one, and a push that retries on race. Failures are logged
 * and answered as "not archived".
 */
import { existsSync, readFileSync } from "node:fs";
import { archiveSession } from "../../machinery/lib/atomaton-data.ts";

interface CompactionPayload {
  agent?: string;
  session_path?: string;
  prompt_tokens?: number;
  context_limit?: number;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of Bun.stdin.stream()) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

async function main(): Promise<void> {
  let payload: CompactionPayload;
  try {
    payload = JSON.parse(await readStdin()) as CompactionPayload;
  } catch {
    console.error("archive_before_compaction: stdin was not JSON; nothing archived");
    console.log(JSON.stringify({ archived: false }));
    return;
  }

  const path = payload.session_path ?? "";
  if (!path || !existsSync(path)) {
    console.error(`archive_before_compaction: no session at ${path || "(no path given)"}; nothing archived`);
    console.log(JSON.stringify({ archived: false }));
    return;
  }

  // The node this run sits on: the same env the runner's other data writes read.
  const type = process.env.TYPE === "pr" ? "pr" : "issue";
  const number = process.env.NUMBER ?? "";
  // The agent name comes from the payload atoma writes -- it is atoma that knows
  // which agent is running, and an env fallback would be a second source for the
  // same fact.
  const agent = payload.agent ?? "unknown";
  if (!number) {
    console.error("archive_before_compaction: NUMBER is not set, so the archive target is unknown; nothing archived");
    console.log(JSON.stringify({ archived: false }));
    return;
  }

  // The archive path is allocated inside the retrying worktree
  // (`archiveSession`), the same way the recovery archives are: two compactions
  // racing on one node cannot select the same path.
  const content = readFileSync(path, "utf8");
  const archivedPath = archiveSession(type, number, agent, content);
  if (!archivedPath) {
    console.error("archive_before_compaction: could not archive to atomaton-data");
    console.log(JSON.stringify({ archived: false }));
    return;
  }
  console.error(`archive_before_compaction: session archived to atomaton-data:${archivedPath}`);
  console.log(JSON.stringify({ archived: true }));
}

await main();
