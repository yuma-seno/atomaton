/**
 * atoma-cli.ts — the steps that put the `atoma` binary on a runner, and the
 * version they install by default.
 *
 * Two workflows need it now. `atomaton-runner` runs agents with it; `atomaton-validate-pr`
 * calls `atoma validate` on the agent definitions and tools file a pull request
 * would merge, so that a name resolving to nothing is a red check rather than a
 * failure on whoever triggers the next run. Both install it the same way, from one
 * place, because a second copy of a download-and-chmod is a second thing to fix
 * when a release asset is renamed.
 */
import { ActionsCheckoutV4 } from "@github-actions-workflow-ts/actions";
import { TypedOutputsStep } from "./base.ts";

/**
 * The Atoma release a run installs unless the dispatch says otherwise.
 *
 * ## Raising this pin is never a version bump on its own
 *
 * Almost every capability this repository depends on arrives as a NEW release
 * rather than as a change here, so a raise is usually one half of a change whose
 * other half is in this tree -- and the two have to move together, because the
 * halves fail differently: a binary that is too old refuses the invocation, while a
 * tree that expects a binary which is too old fails later and more quietly.
 *
 * So the list below is the checklist, keyed by what the pin is coupled TO. A raise
 * crosses the entries it crosses, and the rest are what to check when something
 * starts behaving unlike itself. Which release carried which entry is deliberately
 * not recorded: it is in that repository's history, the tags were renumbered when
 * it was recreated, and a number here would be one no reader can look up.
 *
 * ## What a raise is coupled to
 *
 * **The flags the runner passes.** The runner passes `--max-runtime-secs`,
 * `--stop-file`, `--loop-retries`, `--tools-file`, `--skills-dir`, `--template`,
 * `--agent-def`, `--in-session` and `--out-session`; a binary that does not know one
 * refuses the invocation before the agent starts. This is the entry that makes a
 * raise mandatory rather than optional, and it is why the runner's arguments are
 * worth reading before raising: adding a flag here without raising the pin is a
 * workflow that fails every run.
 *
 * **`tools.servers` in `config.yaml`, which the tools file is generated from.** Three
 * separate couplings: the pin strips the credentials it knows about from a tool
 * server's environment unless that server names them, and expands `${NAME}` in an
 * `env:` value and in an `args:` entry against the run's credentials and environment.
 * An older binary takes those as literal text -- so a `${GH_TOKEN}` reaches a server
 * as those nine characters, overriding what it was inheriting. Raising without the
 * declarations strips a token nothing asks for; shipping the declarations without
 * raising passes a literal.
 *
 * **The `request_timeout_secs` in those declarations.** This one is different: the
 * older binary does not reject the key, it ignores it and caps every call at 60
 * seconds instead. `shell` offers the agent `timeout_seconds` up to 3600 — every
 * value above 60 is a promise the client will not keep — and `search`'s first call
 * loads a reranker measured at 63.9s, so under a binary without this the first search
 * of every run fails. Nothing says so; the declaration is simply not in effect.
 *
 * **The names `tool_allowlist` and `tool_denylist` are written in.** A list lives
 * inside one server's entry, so it is written in the names that server itself uses —
 * `read`, `grep` — and the prefix `atoma` assembles afterwards is not part of what a
 * reader there could know. An older binary compares the list against the prefixed
 * name instead, so `read` matches `files_readonly__read` and every pattern matches
 * nothing. This is the raise that cannot be deferred by a run being quiet: a
 * non-empty `tool_allowlist` that matches nothing refuses EVERY tool on that server,
 * so `files_readonly`, whose whole purpose is reading, refuses all 64 of its calls.
 * The pin and `defaults.yaml` therefore move together, and the older of the two is
 * the one that breaks a run.
 *
 * **`server_calls` on `atoma_runs`.** Which tools each server was asked for, per run.
 * A session cannot answer it: `unprefixed` is what makes a tool arrive under its own
 * bare name, and it is also what strips the server off the call. So the metrics report
 * read the server out of the name — `read_text_file` split on `__` — which stopped
 * working the moment the servers were unprefixed. Under an older binary the field is
 * absent, and the report says it could not check rather than naming every server as
 * unused.
 *
 * **`agent-definitions/*.md`.** The provider names in them are this repository's, and
 * a dialect's name is a row in the core's provider table. A name the installed binary
 * does not have resolves to nothing.
 *
 * **The repository's SECRETS, by name.** Each provider reads its own credential with
 * no fallback: two credentials present for one provider is an error naming both rather
 * than a guess. A repository holding a key under a name the new binary no longer
 * reads gets a failed run, so the secret has to be renamed before or with the raise.
 *
 * **The spelling of `load_skill`'s argument.** It is `skill_name` and there is no
 * other. An older binary accepts the aliases too, so a model calling it `name`
 * succeeds there and the session records `name` -- which is not the spelling
 * `write_metrics_report.ts` reads. Until the pin moves, the skill tally counts calls
 * it cannot attribute.
 *
 * **`max_output_chars`, the per-server cap on a tool result.** It is what covers
 * third-party servers, and it is why `files_guard`'s denylist can be as short as it
 * is: an unbounded server was the reason an entry was there.
 *
 * **A report a tool makes about itself.** A server's problem -- over
 * `notifications/message`, or on stderr -- is attached to its next tool result so the
 * agent sees it. An older binary discards it. `prompt-template.md` and the skills tell
 * an agent to act on that report, so pinning back leaves them describing something the
 * agent will never be shown.
 *
 * **The `cached=` counts.** An older binary prints none, and every reader downstream --
 * the step summary, the result comment, the metrics report -- then reports it as
 * unknown, forever. A run here is almost all prompt, so this is most of what separates
 * the token counts from the bill.
 *
 * **A session with an unanswered tool call is repaired before it is written.** Saving
 * a session on failure is only safe because of that repair: a session carrying an
 * unanswered call is refused by every provider, so an older binary turns lost work
 * into an issue nothing can run on.
 *
 * **`extra_body.tools` is merged with the runtime tool definitions rather than
 * replacing them.** Every definition here carries extra server tools and uses the
 * adapter that had its own merge, so under an older binary each request sent those and
 * no MCP schema at all -- the model then infers argument shapes from the names in the
 * system prompt.
 *
 * **A retry now waits as long as the provider asks.** Up to a two-minute cap, taken
 * from the provider's own `Retry-After` rather than from this repository's fixed
 * 1s-then-4s backoff, which is what the older binary always waited. The wait is
 * spent out of `--max-runtime-secs` -- the runner floors that at 300 seconds -- so
 * a rate-limited run now pauses and carries on instead of failing five seconds in
 * with "The upstream provider is temporarily unavailable".
 *
 * **`ATOMA_LLM_ERROR`, the machine-readable reason an inference failed.** It carries
 * `label=`, `code=` and `type=` beside the prose, in the same `key=value` shape as
 * `ATOMA_TOKEN_USAGE` and `ATOMA_CONFIG_FINDING`. Nothing here reads it yet, and an
 * older binary writes no such line -- so a reader added before the raise would find
 * nothing to read. It is in the log for whoever is looking at a failed run.
 *
 * **MCP's Streamable HTTP transport.** Nothing here uses it yet, but `probe-http-transport.ts`
 * measures the binary, and a repository whose probes and whose runs are on different
 * builds is one where a green probe means less than it looks.
 */
export const ATOMA_DEFAULT_VERSION = "v0.4.0";

export const ATOMA_VERSION_DESC =
  "Atoma CLI version tag to install (e.g. v0.4.0). Use `source` to build from a checkout of yuma-seno/atoma@main.";

/**
 * Checkout for `atoma_version: source`, which builds the CLI from `main` instead
 * of downloading a release.
 *
 * Only the runner offers that: a workflow installing a fixed version never
 * reaches the `source` branch below, so it needs no checkout.
 */
export const checkoutAtomaSourceStep = new ActionsCheckoutV4({
  name: "Checkout Atoma source (for atoma_version: source)",
  if: "inputs.atoma_version == 'source'",
  with: { repository: "yuma-seno/atoma", path: "atoma-src" },
});

/**
 * Install the CLI at `version`, which is shell text: an input expression for a
 * workflow that takes one, or a literal tag for a workflow that pins it.
 *
 * The `source` branch is generated into both workflows even though only the runner
 * can select it. A literal version simply never matches it, and one script that
 * both workflows share cannot drift; two scripts differing by one branch can.
 */
export function installAtomaCliStep(version: string): TypedOutputsStep {
  return new TypedOutputsStep({
    name: "Install Atoma CLI",
    shell: "bash",
    run: `VERSION="${version}"
if [ "$VERSION" = "source" ]; then
  echo "Building Atoma from source (atoma-src/) ..."
  cargo install --path atoma-src --force --locked
elif [ "$VERSION" = "latest" ]; then
  URL="https://github.com/yuma-seno/atoma/releases/latest/download/atoma-linux-x86_64"
  echo "Downloading Atoma \${VERSION} ..."
  curl -fsSL "$URL" -o /usr/local/bin/atoma
  chmod +x /usr/local/bin/atoma
else
  URL="https://github.com/yuma-seno/atoma/releases/download/\${VERSION}/atoma-linux-x86_64"
  echo "Downloading Atoma \${VERSION} ..."
  curl -fsSL "$URL" -o /usr/local/bin/atoma
  chmod +x /usr/local/bin/atoma
fi
atoma --version
`,
  });
}
