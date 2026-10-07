/**
 * run-atoma.ts — shared helper for tests/e2e/*.e2e.test.ts: spawns the real,
 * pre-built `atoma` binary asynchronously and awaits its exit.
 *
 * ATOMA_BIN env var overrides the default sibling-checkout path
 * (../atoma/target/debug/atoma, relative to this repo's root, matching this
 * exact workspace's layout).
 */
import { existsSync } from "node:fs";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = join(HERE, "..", "..");
export const ATOMA_BIN = process.env.ATOMA_BIN ?? join(REPO_ROOT, "..", "atoma/target/debug/atoma");
export const atomaAvailable = existsSync(ATOMA_BIN);

/**
 * A path as text for a consumer that is not Windows: a YAML scalar, or a PATH entry
 * a POSIX shell reads.
 *
 * A Windows path is full of backslashes, and both consumers give `\` a meaning:
 *
 * - YAML reads `C:\Users\...` inside a double-quoted scalar as the escape `\U`, which
 *   is not a legal one, so `serde_yaml` refuses the whole file --
 *
 *       did not find expected hexadecimal number at line 3 column 22,
 *       while parsing a quoted scalar at line 3 column 17
 *
 *   -- and atoma never starts. Every test in the suite then fails for a reason that
 *   has nothing to do with what it tests, which is what happened: the suite had only
 *   ever been run on Linux, where `join` produces forward slashes already.
 * - A Git Bash PATH entry of `C:\repos\...` resolves to nothing, so the binary the
 *   test meant to run is not found (exit 127) and the step falls back to its "I could
 *   not ask" branch.
 *
 * Forward slashes are what `join` produces on Linux and what both consumers accept on
 * Windows, so this is a no-op on one platform and the fix on the other, rather than a
 * branch only one of them takes.
 */
export function posixPath(path: string): string {
  return path.replaceAll("\\", "/");
}

/**
 * A whole PATH value, in the form `bash` reads.
 *
 * `posixPath` alone is not enough for a PATH: on Windows the entries are separated by
 * `;` and most of them carry backslashes, and a `bash` given that value resolves almost
 * nothing out of it -- including whatever was meant to be found at its front. So the
 * separator is rewritten too, from whatever this platform uses to the `:` that `bash`
 * wants.
 *
 * A no-op on a POSIX platform: the delimiter is already `:` and the paths already use
 * forward slashes.
 */
export function posixPathList(value: string): string {
  return value
    .split(delimiter)
    .filter(Boolean)
    .map(posixPath)
    .join(":");
}

/**
 * `env` with its PATH replaced by `value`, in the form `bash` reads.
 *
 * The replacement has to be a REPLACEMENT, and that is the part worth writing down.
 * Windows spells the variable `Path`, and environment-variable names there are
 * case-insensitive -- so an object built as `{...process.env, PATH: "..."}` carries
 * BOTH keys, and every consumer that looks the name up itself picks the one that was
 * already there and ignores this one. `bash` does exactly that, which is why the
 * absolute path a caller prepended to PATH never reached it and the step reported
 * exit 127 ("there is no atoma to ask") while `atoma` sat in the directory named.
 *
 * So the platform's own spelling is removed first, by matching the name
 * case-insensitively rather than by knowing which spelling this platform uses.
 */
export function withPosixPath(env: Record<string, string | undefined>, value: string): NodeJS.ProcessEnv {
  const out: NodeJS.ProcessEnv = {};
  for (const [key, entry] of Object.entries(env)) {
    if (key.toUpperCase() === "PATH") continue;
    out[key] = entry;
  }
  out.PATH = posixPathList(value);
  return out;
}

export interface RunAtomaOpts {
  agentDefPath: string;
  toolsFilePath: string;
  promptFilePath: string;
  outSessionPath: string;
  templatePath?: string;
  skillsDir?: string;
  maxIterations?: number;
  env: Record<string, string>;
}

export interface RunAtomaResult {
  exitCode: number | null;
  stderr: string;
}

/**
 * Spawns the real `atoma` binary with `Bun.spawn` (async), NOT
 * `Bun.spawnSync`: spawnSync blocks this whole JS thread until the child
 * exits, which would starve the event loop a `Bun.serve()` mock LLM server
 * needs in order to answer the atoma binary's HTTP requests -- a deadlock,
 * since atoma would then be waiting forever for an LLM response that never
 * gets handled.
 */
export async function runAtoma(opts: RunAtomaOpts): Promise<RunAtomaResult> {
  const skillsArgs = opts.skillsDir ? ["--skills-dir", opts.skillsDir] : [];
  const templateArgs = opts.templatePath ? ["--template", opts.templatePath] : [];
  const proc = Bun.spawn({
    cmd: [
      ATOMA_BIN,
      "run",
      "--agent-def",
      opts.agentDefPath,
      "--tools-file",
      opts.toolsFilePath,
      "--prompt-file",
      opts.promptFilePath,
      "--out-session",
      opts.outSessionPath,
      ...templateArgs,
      ...skillsArgs,
      "--max-iterations",
      String(opts.maxIterations ?? 5),
    ],
    env: { ...process.env, ...opts.env },
    stdout: "pipe",
    stderr: "pipe",
  });
  const [exitCode, stderr] = await Promise.all([proc.exited, new Response(proc.stderr).text()]);
  return { exitCode, stderr };
}
