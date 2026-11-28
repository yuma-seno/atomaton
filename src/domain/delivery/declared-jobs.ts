/**
 * declared-jobs.ts — one unit of work a project declares in `config.yaml`, validated.
 *
 * Five places in the configuration describe the same thing: a named piece of work,
 * the machine it runs on, the commands that are it, and the credentials those
 * commands may reach. They had three shapes. `checks.pull_request_runs` was a bare
 * list of commands in one job; `checks.default_branch_runs.jobs` was a list of named
 * jobs that could name secrets; `deploy` had targets with their own spelling again,
 * and one `secrets` list shared by every target. This is the one shape.
 *
 * ## What decides whether an entry may name a credential
 *
 * The tree the LIST is read from, and that is deliberately not a property of this
 * module. `checks` is read from the default branch; `deploy` from the branch or tag it
 * ships, after the merge. Neither is the change under review, so a credential named
 * beside an entry is safe in both -- and the question this module used to answer, which
 * arm may hold a key, went with the arms.
 *
 * What is left to remember is a name that would REPLACE something the job already has:
 * each list says which of those it reserves, and naming one is reported rather than
 * quietly dropped.
 *
 * ## What is NOT decided here
 *
 * When a job runs. A check runs on a pull request; a deployment runs on a merge, on a
 * tag, or when somebody asks. That belongs to whoever owns the list, because it is
 * the thing that differs between them — and folding it in here would put a
 * `branches:` key on a lint job.
 *
 * A list that owns extra keys says so through `extra`, which supplies both the names
 * — so everything else stays a typo — and the reader that turns them into fields.
 * `domain/delivery/deploy-jobs.ts` is the one caller that has any.
 *
 * Problems come back rather than throwing, and every entry is checked rather than
 * stopping at the first: somebody fixing their configuration should see everything
 * wrong with it.
 */
import { resolveDeclaredSecrets } from "./declared-secrets.ts";
import { DEFAULT_RUNNER, resolveRunsOn } from "./runner-label.ts";

/** One named piece of work, as configuration declares it. */
export interface DeclaredJob {
  /** Its job name in the workflow, and how a failure names itself. */
  readonly name: string;
  /** The labels a runner must have. One entry is an ordinary hosted runner. */
  readonly runsOn: readonly string[];
  /** Run in order, stopping at the first failure. */
  readonly commands: readonly string[];
  /**
   * Repository secrets this job may reach, by name. Only this job receives them, and
   * empty is the ordinary answer.
   */
  readonly secrets: readonly string[];
}

/** The keys one list owns beyond the shared ones, and how to read them. */
export interface ExtraKeys<Extra> {
  readonly keys: readonly string[];
  /**
   * Turn an entry's own keys into fields, or return null to drop the entry.
   *
   * Push to `problems` rather than throwing, for the same reason everything else
   * here does: one pass should report everything wrong with a configuration.
   */
  readonly read: (entry: Record<string, unknown>, where: string, problems: string[]) => Extra | null;
}

export interface DeclaredJobsRules<Extra extends object = Record<never, never>> {
  /** How to name this list in a message — `checks.jobs`, say. */
  readonly where: string;
  /**
   * The names this list's job environment already uses.
   *
   * Declaring one of them would replace a value the job depends on rather than add a
   * credential. The sets differ per list because the jobs do; `declared-secrets.ts`
   * owns each one.
   */
  readonly secrets: ReadonlySet<string>;
  /** Present only for a list with keys of its own. */
  readonly extra?: ExtraKeys<Extra>;
}

export interface DeclaredJobsResolution<Extra extends object = Record<never, never>> {
  readonly jobs: readonly (DeclaredJob & Extra)[];
  readonly problems: readonly string[];
}

/** Lowercase, hyphenated: it becomes a job name, and GitHub shows it as written. */
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** The keys every list understands. Anything else is a typo unless its owner allows it. */
const SHARED_KEYS = ["name", "runs_on", "commands", "secrets"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Read a list of declared jobs.
 *
 * An absent list is an empty one and not a problem: declaring none is the shipped
 * default everywhere this is used.
 */
export function resolveDeclaredJobs<Extra extends object = Record<never, never>>(
  raw: unknown,
  rules: DeclaredJobsRules<Extra>,
): DeclaredJobsResolution<Extra> {
  if (raw === undefined || raw === null) return { jobs: [], problems: [] };
  if (!Array.isArray(raw)) return { jobs: [], problems: [`\`${rules.where}\` must be an array.`] };

  const problems: string[] = [];
  const jobs: (DeclaredJob & Extra)[] = [];
  const seen = new Set<string>();
  const allowed = new Set<string>([...SHARED_KEYS, ...(rules.extra?.keys ?? [])]);

  raw.forEach((entry, index) => {
    const where = `\`${rules.where}[${index}]\``;
    if (!isRecord(entry)) {
      problems.push(`${where} must be an object.`);
      return;
    }

    // A misspelled key is silently nothing, and the job then runs without whatever it
    // was meant to carry -- a `secret:` that should have been `secrets:` is a job that
    // starts with no credential and fails somewhere further in.
    const unknown = Object.keys(entry).filter((key) => !allowed.has(key));
    if (unknown.length > 0) {
      problems.push(`${where}: unknown key(s) ${unknown.map((k) => `\`${k}\``).join(", ")}.`);
      return;
    }

    const name = typeof entry.name === "string" ? entry.name.trim() : "";
    if (!NAME_PATTERN.test(name)) {
      problems.push(`${where}: \`name\` must be lowercase letters, digits and hyphens — e.g. 'cloud-names'.`);
      return;
    }
    if (seen.has(name)) {
      problems.push(`${where}: '${name}' is declared more than once.`);
      return;
    }

    const commandsRaw = entry.commands ?? [];
    if (!Array.isArray(commandsRaw) || commandsRaw.some((c) => typeof c !== "string" || c.trim() === "")) {
      problems.push(`${where}: \`commands\` must be an array of non-empty shell commands.`);
      return;
    }
    const commands = (commandsRaw as string[]).map((c) => c.trim());
    // A job that runs nothing is a job that passes, and something that always passes
    // is the shape every guard here has failed in: it looks like cover and is not.
    if (commands.length === 0) {
      problems.push(`${where}: \`commands\` is empty, so this job would do nothing and report success.`);
      return;
    }

    const secrets = readSecrets(entry.secrets, rules.secrets, `${rules.where}[${index}]`, where, problems);
    if (secrets === null) return;

    const extra = rules.extra ? rules.extra.read(entry, where, problems) : ({} as Extra);
    if (extra === null) return;

    const runner = resolveRunsOn(entry.runs_on);
    for (const problem of runner.problems) problems.push(`${where}: ${problem}`);

    seen.add(name);
    jobs.push({ name, runsOn: runner.labels, commands, secrets, ...extra });
  });

  return { jobs, problems };
}

/**
 * This entry's credentials, or null when one of them could not be read.
 *
 * `path` is the entry's dotted path and `where` the same thing in backticks: one goes
 * inside the field name a problem names, the other in front of the sentence.
 */
function readSecrets(
  raw: unknown,
  reserved: ReadonlySet<string>,
  path: string,
  where: string,
  problems: string[],
): readonly string[] | null {
  if (raw === undefined || raw === null) return [];
  // The same validator `tools.secrets` gets -- the name's shape, the slot cap, and the
  // names this job's own environment already uses -- named for the one entry it came
  // from, because that is the line somebody has to go and edit.
  const { names, problems: found } = resolveDeclaredSecrets(raw, {
    field: `${path}.secrets`,
    reserved,
  });
  problems.push(...found);
  return found.length > 0 ? null : names;
}

export { DEFAULT_RUNNER };
