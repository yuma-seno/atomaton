/**
 * duplicate-issue.ts — the open issue that already reports what an agent is about to
 * file.
 *
 * `create_root_issue` used to file whatever it was given. Two agents that found the
 * same defect in the same hour opened two issues, and each of them started a run once
 * this feature existed — two runs on one defect, and a person reading two threads to
 * find out whether either was finished.
 *
 * The read is a search and then an exact comparison. The search is the index's
 * question — `in:title`, the words the title has — and the comparison is
 * `duplicateIssueOf`'s: normalised, whole-title equality. Neither half is enough
 * alone: a search is fuzzy enough to return a report about something else, and an
 * enumeration of every open issue to compare against is a request per hundred issues
 * on every filing.
 *
 * ## A failed search is not "no duplicate"
 *
 * `findOpenNotice` answers `0` for none and `null` for a read that failed, and the
 * same distinction is kept here for the opposite reason. An unreadable search must
 * not turn into a refusal, because refusing loses the defect report an agent found
 * during a run — the very case `create_root_issue` was added for. So the caller files
 * the issue anyway and says the check did not run, and `0` is reserved for an answer
 * GitHub actually gave.
 */
import { ghRead } from "./gh.ts";
import { duplicateIssueOf, type OpenIssueTitle } from "../../domain/work/filed-issue.ts";

/**
 * The open issue whose title is this one, `0` for none, or `null` when the search
 * could not be read.
 *
 * The quoted phrase is the search engine's syntax for "these words, in this order";
 * a quote inside the title is dropped rather than escaped, because a title carrying
 * one is rare and a malformed query is a search that answers nothing.
 */
export function findOpenIssueWithTitle(repo: string, title: string): number | null {
  const phrase = title.replace(/"/g, " ").replace(/\s+/g, " ").trim();
  if (phrase === "") return 0;
  // A page of candidates, not a listing: the comparison below is exact, so this bound
  // only decides how deep into the search's ranking an exact match may sit. A title
  // common enough to fill it is a title with company already.
  const result = ghRead(
    "issue", "list", "--repo", repo, "--state", "open",
    "--search", `"${phrase}" in:title`,
    "--json", "number,title",
    "--limit", "50",
  );
  if (result.code !== 0) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.stdout || "[]");
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;

  const open: OpenIssueTitle[] = [];
  for (const entry of parsed) {
    const issue = entry as { number?: unknown; title?: unknown };
    if (typeof issue.number === "number" && typeof issue.title === "string") {
      open.push({ number: issue.number, title: issue.title });
    }
  }
  return duplicateIssueOf(title, open);
}
