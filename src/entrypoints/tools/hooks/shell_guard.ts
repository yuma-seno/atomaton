#!/usr/bin/env bun
/**
 * shell_guard.ts — Steer the agent to the MCP tool that does the job properly,
 * and refuse the one read that leaks another tool server's credentials.
 *
 * Invoked directly as an executable (not via an interpreter argument) by the
 * Atoma core's `before_tool` hook mechanism, which spawns the configured script
 * path and pipes JSON on stdin. When a command is refused, the reason string is
 * surfaced to the agent as an error, so each reason names the tool to use
 * instead.
 *
 * ## This is NOT a security boundary, and nothing here relies on it being one
 *
 * It is a text match over a shell command line. `a=curl; $a example.com` defeats
 * every rule below, and no amount of pattern work changes that: the shell
 * resolves variables after this hook has already decided. Saying so plainly is
 * the point — a guard that overstates itself makes the person reviewing the pull
 * request review it less carefully.
 *
 * This file used to carry a second layer whose only job was to make the first
 * layer hard to evade: command tokenization to undo `w\get` and `cu""rl`,
 * substitution of declared variables into the text, refusal of `PATH` and
 * `LD_PRELOAD`, and rules against `bash -c`, `eval`, `python -c`, heredocs and
 * `base64 | sh`. All of it is gone, because it was defending a boundary this is
 * not. An agent is not an adversary: it does not obfuscate a command to get past
 * a rule that exists to help it, so evasion resistance bought nothing and cost
 * two thirds of the file.
 *
 * What survives is two kinds of rule, and they are kept apart on purpose because
 * they are not the same kind of thing:
 *
 *   1. ROUTING — commands that would work badly or not at all, where a tool
 *      exists that works properly. Their value is iterations not wasted.
 *   2. HARDENING — exactly one rule, for the one real threat nothing else
 *      covers. Honest about being partial. See PROCESS_ENVIRONMENT_READ.
 */
import { resolve, sep } from "node:path";
import { classifyShellAct, nextStreak, refusalReason } from "../../../domain/work/search-streak.ts";
import { readStreak, streakFile, writeStreak } from "../lib/search-streak-file.ts";

/**
 * Commands that have a proper route through an MCP tool.
 *
 * Not prohibitions — redirections. Each reason names the replacement, because
 * the agent reads it and picks again.
 *
 * `gh` is the clearest case, and it is worth knowing it is no longer load
 * bearing for safety: the `shell` server declares no credentials in
 * `tools.servers`, so `GH_TOKEN` is stripped from it and `gh pr merge` fails with
 * 401 whether or not this rule exists. What the rule saves is the iterations
 * the agent would spend discovering that. The `github` server's tools hold the
 * token and enforce merge readiness; that enforcement lives there, not here.
 */
const ROUTING_RULES: Record<string, string> = {
  gh: "gh CLI is disabled. Use the github tools -- create_pr, create_sub_issue, merge_pr and the rest -- for GitHub operations.",
  curl: "curl is disabled. Use fetch, which returns the page as text.",
  wget: "wget is disabled. Use fetch.",
  ssh: "ssh is disabled: this run works on the checked-out repository, not on other hosts.",
  scp: "scp is disabled: this run works on the checked-out repository, not on other hosts.",
  rsync: "rsync is disabled: this run works on the checked-out repository, not on other hosts.",
};

/** Wrappers that run the command named after them, so the name to judge is further along. */
const COMMAND_WRAPPERS = new Set(["sudo", "env", "time", "nohup", "nice", "xargs", "command", "exec"]);

/**
 * The words the shell itself consumes, so that a program can stand where one stands.
 *
 * `for n in 1; do curl ...; done` was ALLOWED while the same loop with a `;` between
 * `do` and the `curl` was refused (#389): the split left `do curl ...` as one segment,
 * the program was read as `do`, and the walk stopped there. One loop shape, two
 * verdicts, decided by where a semicolon happened to fall -- which is the kind of rule
 * nobody can reason about. `then`, `{`, `(`, `!` and the rest of these were the same
 * hole in their own spelling. They keep the reading of one command consistent with
 * another; nothing here is trying to parse a shell, and only the leading run of a
 * segment is skipped, so a routed name in an argument position is still an argument.
 */
const RESERVED_WORDS = new Set([
  "if", "then", "else", "elif", "fi", "for", "while", "until", "do", "done", "case", "esac",
  "select", "function", "in", "!", "{", "}", "(", ")", "[[", "]]",
]);

/**
 * Where the shell starts another command: `&&`, `||`, a pipe, a `;`, a `&`, or a newline.
 *
 * One splitter, used by both of the rules that have to find programs, so the mutating-git
 * rule and the routing rules cannot disagree about where a command begins.
 *
 * The newline was missing, so a command written on its own line was read as an argument of
 * the line above it and never as a program -- and a background `&` hid whatever it
 * separated the same way. Both are separators the shell acts on, which is the whole test
 * for what belongs in this class.
 */
function shellSegments(command: string): string[] {
  return withoutHeredocBodies(command).split(/\s*(?:&&|\|\||[;|&\n])\s*/);
}

/** A heredoc's `<<`, its optional `-`, and the word that ends its body. */
const HEREDOC = /<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1/g;

/**
 * The command with heredoc bodies removed.
 *
 * A heredoc body is text handed to a command on stdin, not a command line -- and once
 * newlines separate commands it would otherwise be read as one. Measured: `cat > notes.md
 * <<'EOF'` with a body line beginning `curl` was refused as though the write invoked curl,
 * which is a document an agent may legitimately be writing.
 *
 * Removed rather than inspected, for the reason the header gives about `bash -c`: a body
 * fed to a shell is a place this text match cannot follow, and pretending to by scanning
 * it costs more in false refusals than it buys.
 */
function withoutHeredocBodies(command: string): string {
  const kept: string[] = [];
  const terminators: string[] = [];
  for (const line of command.split("\n")) {
    const ending = terminators[0];
    if (ending !== undefined) {
      if (line.trim() === ending) terminators.shift();
      continue;
    }
    kept.push(line);
    for (const match of line.matchAll(HEREDOC)) {
      // `a<<b` inside a quoted argument is not a redirect; a redirect's `<<` follows
      // whitespace, a digit (an fd), or the start of the line.
      const before = match.index === 0 ? "" : (line[match.index - 1] ?? "");
      if (before !== "" && !/[\s\d]/.test(before)) continue;
      terminators.push(match[2]!);
    }
  }
  return kept.join("\n");
}

/**
 * The text of each command substitution, which the shell runs as a command of its own.
 *
 * `x=$(curl ...)` was allowed: as far as the segment split goes the substitution is part
 * of one token, that token is an assignment, and so nothing inside it was looked at. The
 * content of `$(...)` and of a backtick pair is where a command is invoked, which puts it
 * in the same class as `bash -c` below and is why the same bounded recursion applies.
 */
function substitutions(command: string): string[] {
  const found: string[] = [];
  for (let index = 0; index < command.length; index += 1) {
    if (command.startsWith("$(", index)) {
      const end = closingParen(command, index + 1);
      if (end !== -1) { found.push(command.slice(index + 2, end)); index = end; }
    } else if (command[index] === "`") {
      const end = command.indexOf("`", index + 1);
      if (end !== -1) { found.push(command.slice(index + 1, end)); index = end; }
    }
  }
  return found;
}

/** The index of the `)` that closes the `(` at `open`, or -1 if it is not closed. */
function closingParen(text: string, open: number): number {
  let depth = 0;
  for (let index = open; index < text.length; index += 1) {
    if (text[index] === "(") depth += 1;
    else if (text[index] === ")") { depth -= 1; if (depth === 0) return index; }
  }
  return -1;
}

/**
 * The programs a command line actually invokes.
 *
 * Position, not mention. The rules above used to match `\bgh\b` anywhere in the
 * string, and this repository keeps its shared `gh` wrapper in `../../../adapters/github/gh.ts` -- so
 * `grep -n dispatchWorkflow ../../../adapters/github/gh.ts` was refused as though it were the GitHub
 * CLI. An agent hit that three times in a row on the file it needed and the run was
 * aborted by the repeated-call guard. The same trap sat under every other rule:
 * `curl` would have taken any path containing a `curl` segment with it.
 *
 * This is routing, not security, and the header of this file has always said so --
 * `bash -c "gh ..."` walks past it either way, and the `shell` server holds no
 * `GH_TOKEN` for a `gh` that got through to use. Given that, matching where a program
 * is invoked rather than where its name appears costs nothing real and stops refusing
 * reads of the repository's own source.
 */
const SHELLS = new Set(["sh", "bash", "zsh", "dash", "ksh"]);

function invokedPrograms(command: string, depth = 0): string[] {
  const found: string[] = [];
  for (const segment of shellSegments(command)) {
    const tokens = segment.trim().split(/\s+/).filter(Boolean);
    let index = 0;
    // `FOO=bar cmd`, `sudo cmd`, `env FOO=bar cmd`, and `do cmd`.
    while (index < tokens.length) {
      const token = tokens[index]!;
      if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(token)) { index++; continue; }
      const name = token.split("/").pop() ?? token;
      if (COMMAND_WRAPPERS.has(name) || RESERVED_WORDS.has(name)) { index++; continue; }
      break;
    }
    const program = tokens[index];
    if (!program) continue;
    const name = program.split("/").pop() ?? program;
    found.push(name);
    // `bash -c "gh pr merge"` invokes gh, and reading only the first token would miss
    // it -- which would have traded one false positive for a hole. Bounded, because a
    // quoted shell can nest and this is a hook that has to answer quickly.
    if (SHELLS.has(name) && depth < 2) {
      const flag = tokens.indexOf("-c", index + 1);
      const inner = flag === -1 ? "" : tokens.slice(flag + 1).join(" ").replace(/^['"]|['"]$/g, "");
      if (inner) found.push(...invokedPrograms(inner, depth + 1));
    }
  }
  if (depth < 2) {
    for (const inner of substitutions(command)) found.push(...invokedPrograms(inner, depth + 1));
  }
  return found;
}

/**
 * The one rule that is not routing.
 *
 * Each tool server holds the credentials its `tools.servers` entry declares, and a
 * process reading `/proc/<pid>/environ` of another server obtains a credential it
 * was deliberately not given.
 *
 * **The structural fix has landed, and this is no longer the thing standing
 * between them.** The servers that hold a credential make themselves
 * non-dumpable, so the kernel refuses the read — measured, and measured with the
 * credential still sitting in the environment block, which is the point: it locks
 * the entry rather than the value. See `../lib/harden.ts`.
 *
 * That replaced a rootless container with its own PID namespace. The
 * container hid the other servers outright, and the reason it went is not that it
 * failed at this: it gave the shell a different filesystem from every other tool,
 * and a write to $HOME inside it succeeded and then was not there for anything
 * else. The confinement design carries the measurements and the three-way trade.
 *
 * This rule is kept for two cases the flag does not cover. A hand-run `atoma`
 * where a server is an ordinary sibling process. And a THIRD-PARTY server, which
 * cannot be made to harden itself and whose credential is therefore readable —
 * documented as such rather than pretended away.
 *
 * In both it stops an accident and not an intent: `P=/proc; cat $P/1/environ`
 * walks straight past it, exactly as the header says of every rule in this file.
 *
 * So: still worth having, no longer load-bearing. Do not restore a dependency on
 * it.
 *
 * Matched as "both words anywhere" rather than as the literal path. Matching
 * `/proc/<pid>/environ` was the first attempt and its own test broke it:
 * `find /proc -name environ -exec cat {} +` never writes that path, it builds
 * it. The readers are endless too — cat, head, xxd, tr, dd, od, strings, a bare
 * `< /proc/N/environ` — and enumerating either the readers or the spellings is
 * the shape of check this repository has been wrong about three times.
 *
 * `/proc` as a whole stays open: `environ` is the part that matters, and cpuinfo
 * and meminfo have honest uses. `\benviron\b` does not match `environment`, so
 * ordinary words and filenames are unaffected.
 */
const PROCESS_ENVIRONMENT_READ: [RegExp, string] = [
  /^(?=[\s\S]*\/proc)(?=[\s\S]*\benviron\b)/,
  "Reading a process's environment through /proc is disabled: tool servers run as the same user and each holds only the credentials it declares.",
];

/**
 * Git subcommands that change something, as opposed to reporting it.
 *
 * Routing, like the rules above: `create_pr` and `sync_branch`
 * check that HEAD is pushed and the branch is current before they act, and a
 * worktree the agent mutated by hand is one `create_pr` then refuses. Read-only
 * inspection (`status`, `diff`, `log`, `rev-parse`) is how the agent orients
 * itself and stays allowed.
 */
/**
 * The subset that really does have a `github` tool standing in for it, so the refusal
 * can name one truthfully.
 */
const ROUTED_GIT_COMMANDS = new Set([
  "add", "am", "apply", "cherry-pick", "commit", "fetch", "merge", "mv", "pull", "push", "rebase",
  "restore", "revert", "rm", "checkout", "switch", "branch", "tag",
]);

/**
 * What stands in for a routed subcommand, when "the github tools" is not the answer.
 *
 * A routed refusal that names the wrong tool is worse than one that names none: #264 is
 * an agent that read "Use the github tools for Git mutations" after `git merge
 * origin/main`, looked through the tool set for the one that takes a base into a
 * branch, found none that does, and built the merge out of `commit-tree` and
 * `update-ref` -- which worked, and reached no ops log at all.
 *
 * `merge` now has that tool. `sync_branch` does not answer it, and never did: it
 * fast-forwards this branch from its OWN remote branch.
 */
const ROUTED_GIT_ADVICE: Record<string, string> = {
  merge: " To bring the base branch into this branch, call merge_base_into_branch.",
};

/**
 * Subcommands in the set below that also have a purely read-only form.
 *
 * `git branch` is in the mutating set because `git branch -d` deletes one, and that
 * put `git branch --show-current` -- which answers a question and changes nothing --
 * behind a refusal telling the agent to use an MCP tool for "Git mutations". The
 * refusal even said "read-only inspection runs normally", which was not true of these.
 * Both spellings turned up in one recorded run, along with `git stash list`.
 *
 * Each entry names the forms that read. A subcommand is allowed only when every
 * argument after it matches, so an unrecognised flag keeps the refusal: the default
 * stays "refuse", and this list only carves out what has been checked by hand.
 */
const READ_ONLY_BRANCH_FLAG =
  /^(-a|-r|-v|-vv|--all|--remotes|--verbose|--list|-l|--show-current|--merged|--no-merged|--contains|--points-at|--sort=.+|--format=.+|--color|--no-color)$/;
const READ_ONLY_TAG_FLAG = /^(-l|--list|-n\d*|--sort=.+|--contains|--points-at|--merged|--no-merged)$/;

const READ_ONLY_GIT_FORMS: Record<string, (args: string[]) => boolean> = {
  // Bare `git branch` lists them. A positional name creates one, so any non-flag
  // argument -- and any flag not named above -- falls through to the refusal.
  branch: (args) => args.every((arg) => READ_ONLY_BRANCH_FLAG.test(arg)),
  // Bare `git stash` is `git stash push`: it stashes. Only the two reporting forms
  // read, and an empty argument list is NOT one of them -- the first version of this
  // allowed it, which would have handed the agent a silent way to shelve its work.
  stash: (args) => /^(list|show)$/.test(args[0] ?? ""),
  // `--get` and friends take a key after them, so only the first token is judged.
  config: (args) => /^(--get|--get-all|--get-regexp|--list|-l)$/.test(args[0] ?? ""),
  // Bare or `-v` lists them; `show` and `get-url` take a remote name and report on it.
  remote: (args) =>
    args.every((arg) => /^(-v|--verbose)$/.test(arg)) || /^(show|get-url)$/.test(args[0] ?? ""),
  tag: (args) => args.every((arg) => READ_ONLY_TAG_FLAG.test(arg)),
};

/**
 * Whether this invocation of a mutating subcommand is one of its read-only forms.
 *
 * A predicate per subcommand rather than one pattern over all of them, because the
 * subcommands do not agree on what an empty argument list means: `git branch` lists,
 * `git stash` stashes. One shared rule got that wrong in the obvious direction.
 *
 * The default is refusal. Nothing is allowed here that has not been checked by hand,
 * and an unrecognised flag keeps the refusal rather than being assumed harmless.
 */
function isReadOnlyGitForm(subcommand: string, args: string[]): boolean {
  return READ_ONLY_GIT_FORMS[subcommand]?.(args) ?? false;
}

const MUTATING_GIT_COMMANDS = new Set([
  "add", "am", "apply", "bisect", "branch", "checkout", "cherry-pick", "clean", "commit", "config",
  "fetch", "init", "merge", "mv", "pull", "push", "rebase", "remote", "reset", "restore", "revert", "rm",
  "stash", "switch", "tag", "worktree",
]);

/**
 * The mutating git subcommand this command line runs, if any.
 *
 * Splits on shell separators so `cd repo && git push` is seen, and skips git's
 * own options so `git -C repo checkout` resolves to `checkout` rather than to
 * `-C`. Options that take a value consume the next token.
 */
function findMutatingGitCommand(command: string): string | undefined {
  for (const segment of shellSegments(command)) {
    const tokens = segment.trim().split(/\s+/);
    const gitIndex = tokens.findIndex((token) => token === "git" || token.endsWith("/git"));
    if (gitIndex === -1) continue;

    let index = gitIndex + 1;
    while (index < tokens.length && tokens[index]!.startsWith("-")) {
      const option = tokens[index++]!;
      if (["-C", "-c", "--git-dir", "--work-tree", "--namespace", "--super-prefix", "--config-env"].includes(option)) {
        index++;
      }
    }
    const subcommand = tokens[index];
    if (!subcommand || !MUTATING_GIT_COMMANDS.has(subcommand)) continue;
    // A read-only spelling of a subcommand that can also write is not a mutation.
    if (isReadOnlyGitForm(subcommand, tokens.slice(index + 1))) continue;
    return subcommand;
  }
  return undefined;
}

interface ShellInvocation {
  command: string;
  workingDirectory?: string;
}

interface GuardVerdict {
  allow: boolean;
  reason: string;
}

const ALLOWED: GuardVerdict = { allow: true, reason: "" };

/**
 * Why `workingDirectory` is not a place this run needs to go, or undefined.
 *
 * Routing again: the shell tool exists to work on the checked-out repository,
 * and a command that ran somewhere else returns output the agent will read as
 * being about the repository. Confining it is cheaper than explaining the
 * resulting confusion.
 */
function outsideRepository(workingDirectory: string): string | undefined {
  const resolved = resolve(workingDirectory);
  const root = resolve(process.cwd());
  if (resolved === root || resolved.startsWith(root + sep)) return undefined;
  return `working_directory must stay inside the repository (${root}); '${workingDirectory}' is outside it.`;
}

/**
 * Judge one invocation.
 *
 * Not exported: the tests drive this file the way the hook does, by spawning it
 * with JSON on stdin, which exercises the argument parsing in `main` as well. It
 * was exported for tests that called it directly, and those are gone.
 */
function checkInvocation(invocation: ShellInvocation): GuardVerdict {
  const cwd = invocation.workingDirectory?.trim();
  if (cwd) {
    const reason = outsideRepository(cwd);
    if (reason) return { allow: false, reason };
  }

  const gitCommand = findMutatingGitCommand(invocation.command);
  if (gitCommand) {
    // Two different answers, because there are two different situations and the
    // single blanket message sent an agent hunting for a tool that does not
    // exist. `commit`/`push`/`checkout` and the rest of the everyday ones have a
    // route; `config`, `stash`, `clean` and `bisect` do not, and saying so is
    // more useful than naming a family of tools with nothing in it for them.
    const routed = ROUTED_GIT_COMMANDS.has(gitCommand);
    return {
      allow: false,
      reason: routed
        ? `Raw 'git ${gitCommand}' is disabled. Use the github tools for Git mutations and branch synchronization.` +
          (ROUTED_GIT_ADVICE[gitCommand] ?? "")
        : `Raw 'git ${gitCommand}' is disabled, and there is no MCP tool for it: this run does not do that. `
          + `Commit with commit_and_push; read-only inspection (status, diff, log) runs normally.`,
    };
  }

  const [environPattern, environReason] = PROCESS_ENVIRONMENT_READ;
  if (environPattern.test(invocation.command)) return { allow: false, reason: environReason };

  for (const program of invokedPrograms(invocation.command)) {
    const reason = ROUTING_RULES[program];
    if (reason) return { allow: false, reason };
  }
  return ALLOWED;
}

/**
 * Advance the streak for this command, and say whether it is refused.
 *
 * The streak is written whichever way it goes, including on the refusal: it clears when
 * something is opened, which is the act being asked for. Clearing it here would let the
 * agent search on for another fifteen.
 *
 * **Only a search is refused.** This returned the refusal for whatever the command was,
 * so once the streak was at the limit the agent could not run its tests, could not check
 * `git status`, could not run anything that was neither a search nor an open. Worse, a
 * command that is neither does not move the streak -- so the refusal came back word for
 * word, and three of those is what `MAX_IDENTICAL_TOOL_FAILURES` stops the run for.
 *
 * Measured on #706 after the filesystem blind spot was closed: the streak cleared
 * correctly on every read, and the run still died on four consecutive refusals all
 * reading "18 searches". A search would have counted 18, 19, 20, 21. They were not
 * searches — the rule was answering "open something" to an agent that had stopped
 * searching and was trying to get on with the work. #706 holds the run's account.
 */
function streakRefusal(command: string): string | undefined {
  const file = streakFile();
  const act = classifyShellAct(command);
  const streak = nextStreak(readStreak(file), act);
  writeStreak(file, streak);
  return act === "search" ? refusalReason(streak) : undefined;
}

async function main(): Promise<void> {
  let data: { arguments?: Record<string, unknown> };
  try {
    const raw = await new Response(Bun.stdin.stream()).text();
    data = JSON.parse(raw);
  } catch {
    console.log(JSON.stringify({ allow: false, reason: "shell_guard: failed to parse input" }));
    return;
  }

  const args = data.arguments ?? {};
  const command = String(args.command ?? args.cmd ?? args.shell ?? "");
  const { allow, reason } = checkInvocation({
    command,
    workingDirectory: typeof args.working_directory === "string" ? args.working_directory : undefined,
  });

  // Only on a command the rules above allowed: a refusal for the wrong reason is
  // worse than a late one, and a command blocked outright never reached a search.
  const refusal = allow ? streakRefusal(command) : undefined;
  if (refusal !== undefined) {
    console.log(JSON.stringify({ allow: false, reason: `shell_guard: ${refusal}` }));
    return;
  }

  if (allow) {
    console.log(JSON.stringify({ allow: true }));
  } else {
    console.log(
      JSON.stringify({
        allow: false,
        reason: `Command blocked by shell guard: ${reason} (attempted: ${command.slice(0, 120)})`,
      }),
    );
  }
}

if (import.meta.main) main();
