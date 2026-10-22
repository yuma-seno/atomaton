/**
 * Live measurement of `merge_base_into_branch` for #264.
 *
 * The deferred runtime installed in `.github/atomaton-runtime/` is the server this
 * spawns — the same file the run's own tool set came from — not the `src/` sources.
 *
 * The repository is a scratch one: a bare origin, a `main` that advances AFTER the
 * work branch is cut, and the work branch's own `package.json` version bump. That
 * state cannot be produced inside the checked-out repo of a run: the run starts on
 * the base branch, its branch is cut from that same tip, and nothing a run can call
 * moves `main` while it is running. Only `gh`'s answers are fixtures (the scratch
 * remote has no GitHub counterpart); every git operation, the merge, the conflict,
 * the commit and the push are real.
 */
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const REPO = "/home/runner/work/atomaton/atomaton";
const SERVER = join(REPO, ".github/atomaton-runtime/tools/mcp/github.ts");
const FAKE_GH = join(REPO, "src/entrypoints/machinery/testing/bin/gh");
const ROOT = "/tmp/atomaton-workspace/merge-base-measure/run";

const git = (cwd: string, ...args: string[]): string =>
  execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

function writePkg(dir: string, version: string): void {
  writeFileSync(join(dir, "package.json"), `{\n  "name": "atomaton",\n  "version": "${version}"\n}\n`);
}

/** One JSON-RPC request against the installed server, in the scratch repository. */
function rpc(work: string, env: Record<string, string>, id: number, name: string, args: unknown): Promise<any> {
  return new Promise((resolve, reject) => {
    const child = spawn("bun", ["run", SERVER], { env, cwd: work });
    let out = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`timed out on ${name}`));
    }, 120_000);
    child.stderr.on("data", (d) => process.stderr.write(d.toString()));
    child.stdout.on("data", (d) => {
      out += d.toString();
      const line = out.split("\n").find((l) => l.trim());
      if (!line) return;
      clearTimeout(timer);
      child.kill();
      try {
        resolve(JSON.parse(line));
      } catch (e) {
        reject(e);
      }
    });
    child.on("exit", (code) => {
      if (out.trim()) return;
      clearTimeout(timer);
      reject(new Error(`server exited ${code} with no response`));
    });
    child.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id,
        method: "tools/call",
        params: { name, arguments: args },
      }) + "\n",
    );
  });
}

const resultText = (response: any): string => response?.result?.content?.[0]?.text ?? "";
const isError = (response: any): boolean => response?.result?.isError === true;

async function main(): Promise<void> {
  // A fresh scratch repository every run, so a re-run measures the merge again rather
  // than a repository that already has it.
  execFileSync("rm", ["-rf", ROOT]);
  mkdirSync(ROOT, { recursive: true });
  mkdirSync(join(ROOT, "ghconfig"), { recursive: true });

  const remote = join(ROOT, "remote.git");
  const seed = join(ROOT, "seed");
  const work = join(ROOT, "work");

  git(ROOT, "init", "--bare", "--initial-branch=main", remote);
  git(ROOT, "init", "--initial-branch=main", seed);
  git(seed, "config", "user.name", "Atomaton Measurement");
  git(seed, "config", "user.email", "measurement@example.com");
  writePkg(seed, "0.21.24");
  git(seed, "add", ".");
  git(seed, "commit", "-m", "0.21.24");
  git(seed, "remote", "add", "origin", remote);
  git(seed, "push", "-u", "origin", "main");

  git(ROOT, "clone", remote, work);
  git(work, "config", "user.name", "Atomaton Measurement");
  git(work, "config", "user.email", "measurement@example.com");
  git(work, "checkout", "-b", "atomaton/issue-264");
  writePkg(work, "0.21.25");
  git(work, "add", ".");
  git(work, "commit", "-m", "the branch's own release");
  git(work, "push", "-u", "origin", "atomaton/issue-264");
  const branchTip = git(work, "rev-parse", "HEAD");

  // main moves AFTER the branch was cut, and changes the same line.
  git(seed, "checkout", "main");
  writePkg(seed, "0.21.26");
  git(seed, "add", ".");
  git(seed, "commit", "-m", "0.21.26");
  git(seed, "push", "origin", "main");
  const mainSha = git(seed, "rev-parse", "HEAD");

  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v === undefined) continue;
    if (k.startsWith("ATOMATON_") || k.startsWith("FAKE_GH")) continue;
    if (["GH_TOKEN", "GITHUB_TOKEN", "GITHUB_REPOSITORY", "BRANCH", "TYPE", "NUMBER", "GH_CONFIG_DIR"].includes(k)) continue;
    env[k] = v;
  }
  Object.assign(env, {
    GITHUB_REPOSITORY: "yuma-seno/atomaton",
    TYPE: "issue",
    NUMBER: "264",
    BRANCH: "atomaton/issue-264",
    ATOMATON_OPS_LOG: join(ROOT, "ops.log"),
    ATOMATON_FAKE_GH: FAKE_GH,
    FAKE_GH_LOG: join(ROOT, "gh.log"),
    FAKE_GH_RESPONSES: JSON.stringify([
      { match: ["graphql"], stdout: JSON.stringify({ data: { repository: { issue: { parent: null } } } }) },
      { match: ["repo", "view"], stdout: JSON.stringify({ defaultBranchRef: { name: "main" } }) },
      { match: ["pr", "list"], stdout: "[]" },
    ]),
    GH_TOKEN: "fake-gh-must-be-used",
    GITHUB_TOKEN: "fake-gh-must-be-used",
    GH_CONFIG_DIR: join(ROOT, "ghconfig"),
  });

  const report: Record<string, unknown> = { branchTip, mainSha };

  // 2. The merge, into a branch whose base moved.
  const merge = await rpc(work, env, 11, "merge_base_into_branch", {});
  report.merge_raw = resultText(merge);
  report.merge_status = JSON.parse(resultText(merge)).status;
  report.merge_files = JSON.parse(resultText(merge)).files;
  report.head_after_merge_call = git(work, "rev-parse", "HEAD");
  report.head_unchanged = report.head_after_merge_call === branchTip;
  report.merge_head = git(work, "rev-parse", "-q", "--verify", "MERGE_HEAD");
  report.status_porcelain = git(work, "status", "--porcelain");
  report.package_json = readFileSync(join(work, "package.json"), "utf8");
  report.marker_lines = report.package_json.split("\n").filter((l) => /^(<{7} |={7}$|>{7} )/.test(l));
  report.pushed_before = git(work, "rev-parse", "origin/atomaton/issue-264");

  // 4. commit_and_push while the conflict is unresolved.
  const refused = await rpc(work, env, 12, "commit_and_push", { message: "merge main into the branch" });
  report.refused_is_error = isError(refused);
  report.refused_text = resultText(refused);
  report.head_after_refusal = git(work, "rev-parse", "HEAD");

  // 3. Resolve, above main's version, and close the merge.
  writePkg(work, "0.21.27");
  const closed = await rpc(work, env, 13, "commit_and_push", { message: "merge main into the branch, keeping 0.21.27" });
  report.closed_is_error = isError(closed);
  report.closed_raw = resultText(closed);
  report.commit = git(work, "rev-parse", "HEAD");
  report.parents = git(work, "rev-list", "--parents", "-n", "1", "HEAD");
  report.commit_message = git(work, "log", "-1", "--format=%B");
  report.origin_after = git(work, "rev-parse", "origin/atomaton/issue-264");
  report.pushed_equals_head = report.origin_after === report.commit;
  report.version_committed = JSON.parse(readFileSync(join(work, "package.json"), "utf8")).version;

  // The tool again, now that the base is in: it must say so and change nothing.
  const again = await rpc(work, env, 14, "merge_base_into_branch", {});
  report.again_raw = resultText(again);
  report.head_after_second_call = git(work, "rev-parse", "HEAD");

  // 5. The other outcome the runner has to recognise: a clean merge, which commits and
  // pushes with no commit_and_push behind it.
  git(seed, "checkout", "main");
  writeFileSync(join(seed, "NOTES.md"), "the base moved on, elsewhere\n");
  git(seed, "add", "NOTES.md");
  git(seed, "commit", "-m", "base moves on, no conflict");
  git(seed, "push", "origin", "main");
  const cleanBase = git(seed, "rev-parse", "HEAD");
  report.clean_base_sha = cleanBase;
  const clean = await rpc(work, env, 15, "merge_base_into_branch", {});
  report.clean_raw = resultText(clean);
  report.clean_status = JSON.parse(resultText(clean)).status;
  report.clean_commit = git(work, "rev-parse", "HEAD");
  report.clean_parents = git(work, "rev-list", "--parents", "-n", "1", "HEAD");
  report.clean_origin = git(work, "rev-parse", "origin/atomaton/issue-264");
  report.clean_pushed = report.clean_origin === report.clean_commit;

  report.ops_log = existsSync(join(ROOT, "ops.log"))
    ? readFileSync(join(ROOT, "ops.log"), "utf8").trim().split("\n")
    : [];

  console.log(JSON.stringify(report, null, 2));
}

await main();
