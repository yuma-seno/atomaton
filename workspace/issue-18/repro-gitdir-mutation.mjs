/**
 * Reproduce, in a throwaway copy of the repository, what running the suite with
 * GIT_DIR/GIT_WORK_TREE pointing at it does to that repository.
 *
 *   bun run /tmp/atomaton-workspace/repro-gitdir-mutation.mjs
 *
 * Prints, before and after: the local `main` sha, the config's core.worktree and
 * user.email, and `git status --porcelain` counts.
 */
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REPO = "/home/runner/work/atomaton/atomaton";
const dir = mkdtempSync(join(tmpdir(), "atomaton-gitdir-repro-"));

function git(...args) {
  return execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
}

try {
  cpSync(join(REPO, ".git"), join(dir, ".git"), { recursive: true });
  cpSync(join(REPO, "src"), join(dir, "src"), { recursive: true });
  cpSync(join(REPO, "tests"), join(dir, "tests"), { recursive: true });
  cpSync(join(REPO, "package.json"), join(dir, "package.json"));
  cpSync(join(REPO, "wac.config.ts"), join(dir, "wac.config.ts"));
  symlinkSync(join(REPO, "node_modules"), join(dir, "node_modules"), "junction");

  const before = {
    main: git("rev-parse", "main"),
    worktree: git("config", "--get", "core.worktree") || "(unset)",
    email: git("config", "--get", "user.email") || "(unset)",
  };

  execFileSync("bun", ["test", "src/entrypoints/machinery/prune_atomaton_data.test.ts"], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, GIT_DIR: join(dir, ".git"), GIT_WORK_TREE: dir },
  });

  const after = {
    main: git("rev-parse", "main"),
    worktree: git("config", "--get", "core.worktree") || "(unset)",
    email: git("config", "--get", "user.email") || "(unset)",
  };

  console.log("before:", before);
  console.log("after: ", after);
  console.log("commit added to local main:", before.main !== after.main);
  console.log("git log -1:", git("log", "-1", "--format=%H %s %an <%ae>"));
} finally {
  rmSync(dir, { recursive: true, force: true });
}
