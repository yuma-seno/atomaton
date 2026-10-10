#!/usr/bin/env bash
#
# check-live-tools.sh — start every tool server this release would ship, and hold
# what they advertise against the guards and the names its configuration declares.
#
# ## What it asks, and why a file cannot answer it
#
# `atoma validate --with-live-tools` starts the servers an agent definition names
# and asks each one for `tools/list`. Three things come out of that, and nothing
# else in this repository asks the first two:
#
#   - a `tool_allowlist` / `tool_denylist` pattern matching none of the tools its
#     server actually offers -- a guard that has stopped guarding. A run reports
#     that as a warning in a log nobody reads, and the allowlist in
#     `defaults.yaml` is the one this repository narrowed for `files_readonly`.
#   - two `unprefixed: true` servers offering the same tool name
#   - a server that will not start, or will not answer `tools/list` in time
#
# `probe-tool-servers.ts` starts every server too, and reads the tool list out of
# the model's request -- which proves a server came up and registered something.
# It does not ask whether a pattern in the tools file still names one of those
# tools, which is the half that needs the names as the server spells them.
#
# ## Why it runs here, and not on the pull request
#
# It does both now, and the history is the reason. `validate_deliverable.ts` reads a
# pull request's `.github/atomaton/` as DATA and runs nothing under `--root`, and that
# is not a preference to be traded away: `tools.servers` lets a project -- or an
# agent -- name any `command`, so a check that started a pull request's declared
# servers would execute the pull request inside the job that decides whether it may
# merge. So the live half went to the other end of the pipeline: the deployment job,
# on the default branch, after the artifact is built and before it is published.
#
# What that cost was the whole of it. A defect this script catches -- two
# `unprefixed` servers offering one tool name -- was found after the merge that
# caused it rather than as a red check on its pull request, and the release that
# would have shipped it could not be published. The distinction the original
# argument missed: `checks.from_pull_request` starts nothing the pull request
# DECLARED, because the commands are the repository's own and no repository secret
# reaches that job. Starting the pull request's own tree is what every job in that
# workflow already does -- `tests/e2e` has been spawning `dist/`'s servers there
# since it was written.
#
# So it runs in both places, from this one file. The pull-request job calls it with
# `dist/` built from the pull request's tree; the deploy job calls it with `dist/`
# built from the default branch. Neither names a server of its own.
#
# ## Which tree, and who builds it
#
# `dist/` -- the artifact a run is about to be handed, and never `.github/`.
# `.github/` in this repository is the LAST RELEASE, put there by the self-deploy
# workflow, so a check that read it would be checking something that already
# passed. This script BUILDS `dist/` from the checkout it is run in -- see the
# `bun run synth` below -- so "the tree being checked" is unambiguous: it is the
# one this process is standing in.
#
# ## What it does not install, and what that leaves unchecked
#
# The runner installs `tools.packages` before an agent starts; this does not. The
# only entry today is `@huggingface/transformers`, which `search.ts` imports lazily
# so that the server serves without it -- and installing it here would start a
# 544MB download inside a release job, for a reranker no check calls.
#
# What that leaves: a package a server needs in order to START is still caught,
# because the server then fails to start and that is fatal here. A package a server
# needs only in order to answer a CALL is not, and cannot be -- this check calls no
# tool.
#
# ## What it cannot see
#
# A duplicate tool name between two servers no single definition names. Each
# definition is validated against the servers IT names, so a pair that no agent
# would ever be handed both of is not asked about.
#
# This used to say that the check was therefore unclosable, and that was wrong. The
# defect that took the release down was exactly this shape -- `delegate` and
# `delegate_free`, both `unprefixed`, both offering `delegate`, named TOGETHER by
# `atomaton.md` and `engineer.md` -- and `atoma validate` reports it as a fatal
# `duplicate_tool` finding. What hid it was not the check's reach but its INPUT: see
# "Why it runs here" above, where the pull-request job was reading `.github/`.
#
# What a definition naming both does NOT cover is a pair no agent is given together:
# `files` and `files_readonly` are the same program and both offer `read`, and no
# definition names both. That is by design, and `atoma validate` would reject a
# definition that did.
#
# Usage:
#   bash .github/atomaton/scripts/check-live-tools.sh
#
#   ATOMA_BIN=/path/to/atoma   check with this binary instead of downloading the pin
set -euo pipefail

# Asked of git rather than counted from this file's own location.
#
# It was `dirname "${BASH_SOURCE[0]}"/..`, which was right while this script sat in
# `scripts/` at the root and wrong the moment it moved to
# `.github/atomaton/scripts/`: the parent of its directory became `.github/atomaton/`,
# the `cd` landed there, and the first thing that reads `src/` failed. Nothing caught
# it, because every REFERENCE to this script was updated -- what moved silently was
# the path it derives from itself.
#
# A count of `..` is a claim about where a file lives. `--show-toplevel` is a
# question, and it has the same answer from anywhere in the checkout.
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

# The version a run installs, read from where the runner reads it. The checks below
# are the BINARY's, not this repository's, and `--with-live-tools` only exists from
# atoma v0.1.37 -- so a check on an older binary would report a clean pass having
# asked nothing. Read rather than written twice so raising the pin cannot leave
# this silently checking a different binary than an agent runs under.
VERSION="$(grep -o 'ATOMA_DEFAULT_VERSION = "[^"]*"' src/workflows/actions/atoma-cli.ts | head -1 | sed 's/.*"\(.*\)"/\1/')"
if [ -z "$VERSION" ]; then
  echo "::error::could not read ATOMA_DEFAULT_VERSION from src/workflows/actions/atoma-cli.ts"
  exit 1
fi

WORK="${RUNNER_TEMP:-/tmp}/atomaton-live-tools"
mkdir -p "$WORK"

BIN="${ATOMA_BIN:-}"
if [ -z "$BIN" ]; then
  BIN="$WORK/atoma"
  URL="https://github.com/yuma-seno/atoma/releases/download/${VERSION}/atoma-linux-x86_64"
  echo "Downloading ${VERSION} ..."
  # `--with-live-tools` exists only from atoma v0.1.37, so a binary this repository
  # cannot fetch is a check that would report a clean pass having asked nothing.
  # Failing is the honest answer; `probe-tool-health.sh` installs the same asset for
  # its own measurement, so this is a fetch the CI already depends on elsewhere.
  if ! curl -fsSL "$URL" -o "$BIN"; then
    echo "::error::could not download the atoma binary at ${VERSION} from ${URL}, so the live tool check could not run."
    exit 1
  fi
  chmod +x "$BIN"
fi
echo "Checking with $("$BIN" --version 2>&1 | head -1) (pin ${VERSION})"

# The deliverable, built here rather than expected from the caller.
#
# This script's whole subject is `dist/`, so building it is this script's job: a
# caller that has to remember `bun run synth` first is a caller that can forget, and
# a stale `dist/` reads exactly like a correct one. That is not hypothetical -- the
# pull-request job ran a check against the LAST RELEASE for as long as it existed,
# found nothing, and passed, because nothing had built `dist/` and the check fell
# back to `.github/`. Building it here means there is no such thing as a `dist/`
# this script did not just make.
#
# `synth` is a pure function of `src/`, which is why this is safe to run twice: the
# deploy job's step before this one builds the same tree, and the second build
# produces the same bytes.
echo "Building the deliverable ..."
bun run synth

MACHINERY="$REPO_ROOT/dist"
RUNTIME_TOOLS="$MACHINERY/.github/atomaton-runtime/tools"
DEFS_DIR="$MACHINERY/.github/atomaton/agent-definitions"

if [ ! -d "$MACHINERY/.github" ]; then
  echo "::error::$MACHINERY/.github does not exist, so there is nothing to check. Build the deliverable first (bun run synth)."
  exit 1
fi
if [ ! -d "$DEFS_DIR" ]; then
  echo "::error::$DEFS_DIR does not exist, so no definition could be checked and a clean pass would mean nothing."
  exit 1
fi

# ── the layout a RUN has, not the one this checkout has ───────────────────────
#
# `dist/` sits in the work tree, beside `node_modules`, so a server started from it
# resolves its imports by walking up into the project's own tree. A run has neither:
# the runner copies the machinery to `${RUNNER_TEMP}/atomaton-machinery` and installs
# the libraries at `${RUNNER_TEMP}/node_modules`, beside it rather than above it.
#
# That difference is not academic. Moving the machinery out of the work tree once put
# `node_modules` out of reach of the module-resolution walk, and the search server
# could not start at all -- atoma treats a server that will not initialise as fatal,
# so one unresolvable import took every run down. Checking `dist/` in place would
# have passed, because in place the walk finds the libraries.
#
# So the tree is copied to where a run puts it, and the libraries are installed
# beside it, before anything is started. `runner-layout.test.ts` holds the runner to
# the same two facts, so this cannot quietly stop reproducing the arrangement a run
# actually has.
RUN_ROOT="$WORK/run-layout"
rm -rf "$RUN_ROOT"
mkdir -p "$RUN_ROOT"
cp -r "$MACHINERY" "$RUN_ROOT/atomaton-machinery"
MACHINERY="$RUN_ROOT/atomaton-machinery"
RUNTIME_TOOLS="$MACHINERY/.github/atomaton-runtime/tools"
DEFS_DIR="$MACHINERY/.github/atomaton/agent-definitions"

# The libraries, at the sibling the runner installs them to. The runner reads
# `tools.packages` and runs `bun add --no-save` from `${RUNNER_TEMP}`, with a
# manifest of its own so `bun add` has a directory to own rather than reading the
# project's. Reproduced here from the same file, so what is installed is what a run
# would install rather than whatever this checkout happens to have.
#
# `--no-save` and a manifest of its own, exactly as the runner does it: the point is
# that the libraries are REACHABLE from the machinery, not that a particular set is
# recorded anywhere.
PACKAGES_FILE="$RUNTIME_TOOLS/packages.json"
BUN_PKGS=""
if [ -f "$PACKAGES_FILE" ]; then
  BUN_PKGS="$(jq -r '.bun[]? // empty' "$PACKAGES_FILE" 2>/dev/null || true)"
fi
if [ -n "$BUN_PKGS" ]; then
  if [ ! -f "$RUN_ROOT/package.json" ]; then
    echo '{"name":"atomaton-mcp-libraries","private":true}' > "$RUN_ROOT/package.json"
  fi
  # shellcheck disable=SC2086 -- the runner passes the list unquoted too, and the
  # names come from a file this repository ships rather than from a pull request.
  ( cd "$RUN_ROOT" && bun add --no-save $BUN_PKGS >/dev/null 2>&1 ) || {
    echo "::error::could not install the MCP libraries beside the machinery at $RUN_ROOT, so the layout a run has could not be reproduced."
    exit 1
  }
  echo "MCP libraries installed at $RUN_ROOT/node_modules, beside the machinery"
else
  echo "No bun libraries declared in $PACKAGES_FILE; the machinery is checked with none beside it"
fi
echo "Checking the layout a run has: $MACHINERY"

# Written the way a run writes it, from the config of the tree being checked, by
# the writer that ships in that same tree. There is no tools file to read: it
# stopped shipping when it became a per-run artifact, and one left behind would
# describe an older build than this.
TOOLS="$WORK/tools.yaml"
bun run "$MACHINERY/.github/atomaton-runtime/scripts/write_tools_file.ts" \
  --config "$MACHINERY/.github/atomaton/config.yaml" \
  --defaults "$RUNTIME_TOOLS/defaults.yaml" \
  --out "$TOOLS" \
  --hook-base "$RUNTIME_TOOLS"

# Every definition the artifact ships, rather than a chosen one: a server only the
# orchestrator names is still a server this release hands an adopter. One failure
# does not stop the loop, so a single run reports everything that is wrong.
status=0
checked=0
for def in "$DEFS_DIR"/*.md; do
  # No match leaves the pattern itself as the loop value, which would be reported as
  # a missing definition rather than as the empty directory it is. The count below is
  # what makes an empty directory fail instead of passing vacuously.
  [ -f "$def" ] || continue
  checked=$((checked + 1))
  echo "::group::atoma validate --with-live-tools $(basename "$def")"
  # `env -u GH_TOKEN`: what these servers are asked for is what they advertise and
  # nothing else, so they are started holding no token. This job's token can write
  # to the repository -- it publishes the release -- and a check that only lists
  # tools has no use for it. `atoma` expands `${GH_TOKEN}` in the tools file to the
  # empty string rather than refusing, which is what lets a check run without a
  # secret. `GITHUB_REPOSITORY` is left alone: the `github` server refuses to start
  # without it, and it names a repository rather than granting anything.
  ATOMATON_MACHINERY_ROOT="$MACHINERY" env -u GH_TOKEN "$BIN" validate \
    --agent-def "$def" \
    --tools-file "$TOOLS" \
    --with-live-tools || status=$?
  echo "::endgroup::"
done

if [ "$checked" -eq 0 ]; then
  echo "::error::$DEFS_DIR holds no agent definitions, so nothing was checked."
  exit 1
fi

if [ "$status" -ne 0 ]; then
  echo "::error::the tool servers this release would ship do not agree with the guards and the names its configuration declares. Not publishing it."
fi
exit "$status"
