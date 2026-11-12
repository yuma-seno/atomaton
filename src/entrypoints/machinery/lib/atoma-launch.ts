/**
 * atoma-launch.ts — the one place that starts atoma, and the only `sudo` between
 * the runner and the agent.
 *
 * Every server atoma starts is a child of this process, so one `sudo -u` here
 * puts the credential-holding class on its user; the shell and third-party
 * servers are dropped a second time by `run_as_untrusted.sh`, from their own
 * entries in the generated tools file. `env` in front rather than
 * `--preserve-env`: the latter needs a sudoers permission a self-hosted runner
 * may not grant, and both were measured, so the portable one is used. Only what
 * a server actually reads is passed; the credentials are not here at all, they
 * are in the file atoma deletes.
 *
 * HOME stays the runner's so the toolchain resolves. It is not writable by
 * either tool user, and the caches are redirected by `buildAgentEnv`.
 *
 * Both invocations of atoma in a run — the first turn, and the second turn a
 * stalled run is offered — come through `launchAtoma`, so they cannot drift: the
 * argv, the environment, and the redirections are one function. The caller owns
 * the files (`--out`, `--logs`) and the budget; this owns the exec.
 */
import { spawnSync } from "node:child_process";
import { appendFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  AGENT_DEFINITIONS_DIR,
  PROMPT_TEMPLATE,
  SKILLS_DIR,
  TOOL_USER,
} from "../../../domain/machinery/machinery-layout.ts";

export interface LaunchOpts {
  /** The agent's name — selects the definition file. */
  agent: string;
  /** The machinery root: `${MACHINERY_ROOT_VAR}`'s value in the caller's environment. */
  machineryRoot: string;
  toolsFile: string;
  credentialsFile: string;
  stopFile: string;
  /** In-session and out-session are the same file, as the runner has always passed them. */
  session: string;
  /** Where atoma's stdout lands — this run's report. */
  outFile: string;
  /** Where atoma's stderr lands — the run log. Appended to on a second turn. */
  logsFile: string;
  appendLogs: boolean;
  budgetSecs: number;
  /** The tool server's environment, as `NAME=VALUE` — see `buildAgentEnv`. */
  envEntries: string[];
}

/** One run of atoma. Returns its exit code and writes nothing to stdout. */
export function launchAtoma(opts: LaunchOpts): number {
  const argv = [
    "sudo", "-n", "-u", TOOL_USER, "env", ...opts.envEntries,
    "atoma", "run",
    "--agent-def", join(opts.machineryRoot, AGENT_DEFINITIONS_DIR, `${opts.agent}.md`),
    "--in-session", opts.session,
    "--out-session", opts.session,
    "--template", join(opts.machineryRoot, PROMPT_TEMPLATE),
    "--skills-dir", join(opts.machineryRoot, SKILLS_DIR),
    "--max-runtime-secs", String(opts.budgetSecs),
    "--stop-file", opts.stopFile,
    "--loop-retries",
    "--credentials-file", opts.credentialsFile,
    "--tools-file", opts.toolsFile,
  ];
  const run = spawnSync(argv[0]!, argv.slice(1), {
    encoding: "buffer",
  });
  // A spawn that never happened has no exit code, and reading its absence as 0
  // would report "atoma succeeded" — the exact lie the inline bash's
  // `|| EXIT_CODE=$?` could not tell. The shell's own conventions name the two
  // ways an exec can fail (not found, not executable); reuse them so the logs
  // read the way the old step's did.
  let status = run.status;
  if (run.error) {
    const code = (run.error as NodeJS.ErrnoException).code === "ENOENT" ? 127 : (run.error as NodeJS.ErrnoException).code === "EACCES" ? 126 : 1;
    const line = `${argv[0]}: ${run.error.message}`;
    if (opts.appendLogs) appendFileSync(opts.logsFile, `${line}\n`);
    else writeFileSync(opts.logsFile, `${line}\n`);
    status = code;
  } else if (status === null && run.signal === "SIGTERM") {
    // Killed rather than exited — the stop watcher's SIGTERM. The shell reports
    // 128+n; keep that spelling so the ending classification reads the same
    // numbers it always has.
    status = 143;
  }
  writeFileSync(opts.outFile, run.stdout?.toString() ?? "");
  if (opts.appendLogs) appendFileSync(opts.logsFile, run.stderr?.toString() ?? "");
  else writeFileSync(opts.logsFile, run.stderr?.toString() ?? "");
  return status ?? 1;
}
