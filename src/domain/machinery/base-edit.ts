/**
 * base-edit.ts — editing this project's own machinery on the base branch, without
 * touching the run's checkout.
 *
 * ## What this is for
 *
 * A run that finds a prompt or a skill wrong has to write the fix somewhere. The
 * ordinary route is `commit_and_push`: commit to the run's own branch, open a pull
 * request that delivers the issue's work. That route puts the fix *inside* the
 * change under review, which for a prompt means the fix is judged as part of a
 * feature, and it leaves the fix behind whenever the feature is rejected — the
 * observation outlives the work it was made during.
 *
 * So there is a second route: amend the file on the base branch's own tree and
 * open a pull request against it, from a branch nobody's checkout is on. It is the
 * `publish_draft` technique (a temporary index, `hash-object`/`update-index`/
 * `write-tree`/`commit-tree`, one refspec push) pointed at the base branch instead
 * of an orphan one — see `mcp/github.ts`'s `open_base_edit_pr` for the mechanics.
 *
 * ## Why the rules are here rather than at the tool
 *
 * Three of them decide what lands on a branch people review, and all three are
 * answerable from their arguments: which paths may be written at all, how the
 * overlay's second copy is found, and whether a replacement is safe to apply to a
 * file this process read a moment ago. A rule stated beside the `git` calls is a
 * rule nothing can test without a repository and a remote.
 */
import { CONFIG_FILE, USER_ROOT } from "./machinery-layout.ts";

/**
 * `.github/`, which is what `self/` is the source of.
 *
 * Not `USER_ROOT`: the twin of `.github/atomaton/skills/x.md` is
 * `self/atomaton/skills/x.md`, so the two are related by the directory the
 * self-deploy replaces wholesale (`rm -rf .github` then `cp -r self/. .github/`),
 * not by the directory an adopter edits.
 */
const DEPLOYED_ROOT = ".github";

/**
 * Why `path` may not be amended through this tool, or `undefined` when it may.
 *
 * The whole guard, in one place, asked before any `git` runs: a refusal that comes
 * after a push is a branch somebody has to delete.
 *
 * `config.yaml` is refused by name and separately, because it is the one file under
 * the directory where the reason is a boundary rather than tidiness. It decides
 * which credentials a run may reach, and it is read from a ref of its own rather
 * than from a branch tip (`secret-slots.ts`) — so an edit made through a pull
 * request would be a green review of a file that does not govern anything.
 *
 * Everything else under `.github/atomaton/` is a prompt, a skill, a script or a
 * ruleset: all of them degrade an agent when wrong, and none of them hands out a
 * credential.
 */
export function amendPathProblem(path: string): string | undefined {
  if (path.trim() === "") return "A path is required.";
  if (path !== path.trim()) return `\`${path}\` has surrounding whitespace.`;
  if (path.startsWith("/")) {
    return `\`${path}\` is an absolute path. Paths name a file in the repository, such as \`${USER_ROOT}/prompt-template.md\`.`;
  }
  if (path.includes("\\")) {
    return `\`${path}\` uses a backslash. A repository path is written with slashes.`;
  }
  // The index listing is `mode SP blob SP sha TAB path`, NUL-terminated, so a control
  // character in a path describes a different file to git than the one asked for.
  if (/[\u0000-\u001f]/.test(path)) {
    return `\`${JSON.stringify(path)}\` holds a control character, which no repository path does.`;
  }
  const segments = path.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    return (
      `\`${path}\` has an empty, \`.\` or \`..\` segment, so the path git would write is not the path written here. ` +
      "Name the file directly."
    );
  }
  if (path === CONFIG_FILE) {
    return (
      `\`${path}\` decides which credentials a run may reach, and it is read from a ref of its own rather than from ` +
      "a branch tip. An edit through a pull request would be a review of a file that governs nothing, so this tool " +
      "does not write it: change it by hand, in a change a person makes."
    );
  }
  if (!path.startsWith(`${USER_ROOT}/`)) {
    return (
      `\`${path}\` is outside \`${USER_ROOT}/\`. This tool amends this project's own machinery — prompts, skills, ` +
      "agent definitions and the scripts beside them — and nothing else: the rest of the tree is delivered through " +
      "the issue the run is working on."
    );
  }
  return undefined;
}

/**
 * The `self/` copy of a deployed file, whether or not it exists.
 *
 * `self/` mirrors `.github/`, and the self-deploy replaces the deployed tree with
 * it, so the two must hold the same bytes: `self/` is the source and `.github/` is
 * the copy. A change made to one of them alone is either reverted at the next
 * deploy or fails `self-overlay.test.ts`, which is why the tool stages both.
 *
 * An adopter has no `self/`, and `git ls-tree` is what decides that: the tool asks
 * the base branch whether this path is there rather than assuming the layout.
 */
export function overlayTwinPath(path: string): string {
  return `self/${path.slice(DEPLOYED_ROOT.length + 1)}`;
}

/** One file the caller asks to change, as it arrives from the tool's arguments. */
export interface BaseFileEdit {
  readonly path: string;
  /** Text to replace. Must appear exactly once in the file as the base branch holds it. */
  readonly old?: string;
  /** What `old` becomes. */
  readonly new?: string;
  /** The whole new file, instead of `old`/`new`. */
  readonly content?: string;
}

/**
 * The file's new text, or a refusal naming what to do instead.
 *
 * ## Why `old` has to appear exactly once
 *
 * Zero is the case the issue names: the base branch moved since the caller read it,
 * and applying the replacement to whatever happens to be there now would overwrite
 * somebody else's edit with nobody told. More than once is the same defect one step
 * further in — `new` would land in places the caller never looked at, and the diff a
 * reviewer reads would be wider than the change that was asked for. Both refuse, and
 * the message says how to make the match unique.
 *
 * ## Why the replacement is applied as a function
 *
 * `String.replace(search, replacement)` reads `$&`, `$'` and `` $` `` in the
 * replacement as references to the match. Prompt text contains none of them today,
 * and the first one that does would be silently swapped for its own match with no
 * failure anywhere — so the replacement is passed as a function, which is the form
 * that never interpolates.
 */
export function editedText(current: string, edit: BaseFileEdit, base: string): string {
  const replaces = edit.old !== undefined || edit.new !== undefined;
  if (edit.content !== undefined && replaces) {
    throw new Error(
      `"${edit.path}": give either \`content\` (the whole new file) or \`old\` and \`new\` (a replacement), not both — ` +
        "there is no answer to which one is the file.",
    );
  }
  if (edit.content !== undefined) return edit.content;
  if (!replaces) {
    throw new Error(`"${edit.path}": nothing to change. Give \`content\`, or \`old\` and \`new\`.`);
  }
  const old = edit.old ?? "";
  if (old === "") {
    throw new Error(
      `"${edit.path}": \`old\` is empty. An empty search matches everywhere, so give the text to replace, or ` +
        "`content` for a whole-file rewrite.",
    );
  }
  if (edit.new === undefined) {
    throw new Error(`"${edit.path}": \`old\` was given without \`new\`. Give both, or \`content\` for a whole-file rewrite.`);
  }

  const count = current.split(old).length - 1;
  if (count === 0) {
    throw new Error(
      `"${edit.path}": \`old\` does not appear in the file as \`${base}\` holds it. The branch moved since this call ` +
        "was prepared, and nothing was written: read the file on that branch and retry with the text it holds now.",
    );
  }
  if (count > 1) {
    throw new Error(
      `"${edit.path}": \`old\` appears ${count} times in the file as \`${base}\` holds it, so there is no single ` +
        "place to apply it. Extend `old` with the lines around the one you mean until it matches once, or pass " +
        "`content` with the whole file.",
    );
  }
  return current.replace(old, () => edit.new as string);
}

/**
 * The branch an amendment is pushed to.
 *
 * Deliberately outside `atomaton/issue-<n>`: that namespace is what `branchOfIssue`,
 * `ordinalOfBranch` and `isIssueBranch` read as a node's own work, so a branch named
 * in it would be resumed by that issue's next run and pushed to as though it carried
 * the issue's change. This branch belongs to no node, and a name outside the
 * namespace says so by itself.
 *
 * The stamp is base 36 of the millisecond, so the names sort by when they were made
 * and two calls a moment apart cannot collide.
 */
export function amendBranchName(now: number): string {
  return `atomaton/amend-${Math.floor(now).toString(36)}`;
}

/** What the pull request body says, given what was staged. */
export interface BaseEditPrBody {
  /** The node this run sits on, as `#562`, or "" when the run has none. */
  readonly observing: string;
  readonly base: string;
  /** The agent to review, or "" to leave the pull request for a person. */
  readonly reviewer: string;
  /** Every path staged, and whether a `self/` twin was part of the same commit. */
  readonly files: readonly { path: string; twin: string | undefined }[];
  /** The caller's own words, appended below the machinery's part. */
  readonly note?: string;
}

/**
 * The body of the pull request this tool opens.
 *
 * ## Why there is no parent-issue tag
 *
 * A pull request normally carries `atomaton:parent-issue`, and that tag is what makes
 * it a child of the run's node: it decides which issue a merge re-invokes, which
 * thread a close notifies, and which workspace the work belongs to. This pull request
 * is not a child of anything. It is an observation made *while* another node's work
 * was going on, and the whole point of the route is that the two never wait on each
 * other — so it says where it came from in prose, where a person reads it, and the
 * machinery reads nothing.
 *
 * The `#N` in that sentence is the cross-reference GitHub draws on the observing
 * thread, which is how somebody following that thread learns this happened.
 *
 * ## Why the reviewer line is first
 *
 * A pull request with no reviewer and no mention waits forever: CI goes green and
 * nobody looks. The line is the same one a person would type, it is read from the
 * body's first visible line, and `dispatchPrValidation` is what turns it into a run
 * once CI has a verdict.
 */
export function baseEditPrBody(body: BaseEditPrBody): string {
  const where = body.observing === "" ? "the run that made this change" : `the run working on ${body.observing}`;
  const lines = [
    ...(body.reviewer === "" ? [] : [`/${body.reviewer}`, ""]),
    `Atomaton: ${where} amended this project's own machinery on \`${body.base}\`. That run's checkout is untouched, ` +
      "and its work continues — this pull request is separate from it on purpose, so review it as a change to how " +
      "agents behave rather than as part of a feature.",
    "",
    ...body.files.map((file) =>
      file.twin === undefined
        ? `- \`${file.path}\` — staged on its own; no \`${overlayTwinPath(file.path)}\` on \`${body.base}\``
        : `- \`${file.path}\`, and its overlay twin \`${file.twin}\` with the same content`,
    ),
  ];
  const twins = body.files.filter((file) => file.twin === undefined).map((file) => `\`${file.path}\``);
  if (twins.length > 0) {
    lines.push(
      "",
      `${twins.join(", ")} ${twins.length === 1 ? "has" : "have"} no \`self/\` twin, so only the deployed copy moved. ` +
        "In a repository whose deploy rebuilds `.github/` from `self/` and the release, such a file is reverted at " +
        "the next deploy — this is the copy to leave a note about, not a defect in this change.",
    );
  }
  const note = (body.note ?? "").trim();
  if (note !== "") lines.push("", "---", "", note);
  return `${lines.join("\n")}\n`;
}
