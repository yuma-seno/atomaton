/**
 * untrusted-servers.ts — which tool servers run as the untrusted OS user, and how.
 *
 * ## The two classes
 *
 * The runner creates two users. `atomaton-tools` runs `atoma` and the servers this
 * project ships, which receive credentials through their own `env:` blocks. The
 * other runs the `shell` server and every server a project adds, and holds none of
 * those credentials.
 *
 * The separation is a uid, not a filesystem. Both users see the same work tree and
 * the same `/tmp`, so an agent still writes one file and every tool reads it. What
 * changes is `/proc/<pid>/environ`: one user cannot read another's, which is the
 * channel a credential leaks through without anything being written down.
 *
 * ## Why the wrapper is a command prefix rather than a change to shell.ts
 *
 * `atoma` starts a server from its `command` and `args`. Wrapping the entry here
 * puts the drop-to-user where every server is already described, so it applies to a
 * third-party server the same way it applies to `shell`, and neither implementation
 * needs to know it is being run as somebody else. `shell.ts` in particular spawns
 * `bash`; because the whole server process is already the untrusted user, its
 * children are too, with nothing added to the server.
 *
 * ## Why this is here rather than in `defaults.yaml`
 *
 * The file this produces is generated per run, so a wrapper written into
 * `defaults.yaml` would be one source of truth for the shipped servers and none for
 * a project's own. It would also put an OS user name into a file an adopter reads
 * as configuration. The name arrives in the environment instead, and where it is
 * absent -- the check jobs and the release's live-tools validation, which run on a
 * machine with no second user and hold no credential -- the script runs the server
 * as whoever launched it. See the wrapper's header for that boundary.
 */
import { isAbsolute, join, resolve } from "node:path";
import type { ConfiguredServer } from "./tool-server.ts";

/** The wrapper this project ships beside the servers. */
export const RUN_AS_UNTRUSTED = "run_as_untrusted.sh";

/**
 * Shipped servers that are untrusted even though this project ships them.
 *
 * `shell` is the whole point of the split: it runs arbitrary commands and holds no
 * credential, so there is nothing it needs the trusted uid for. Every other shipped
 * server is in `defaults.yaml` because it holds a credential or implements a
 * capability `shell` must not reach, and stays trusted.
 */
const SHIPPED_UNTRUSTED: ReadonlySet<string> = new Set(["shell"]);

/**
 * Whether a server by this name runs as the untrusted user.
 *
 * A name this project does not ship is a server a project added, and a project's
 * server is a third-party program: it cannot be made to protect itself, so it is
 * never given the class that holds the shipped servers' credentials. A name whose
 * entry has no `command` (a remote MCP server) is returned untouched by
 * `asUntrustedServer`, because there is no local process to drop.
 */
export function isUntrustedServer(name: string, shippedNames: ReadonlySet<string>): boolean {
  return SHIPPED_UNTRUSTED.has(name) || !shippedNames.has(name);
}

/**
 * One server entry, with its command run through the wrapper.
 *
 * `command` and `args` become `bash <tools>/run_as_untrusted.sh <command> <args...>`.
 * Everything else is left alone: `env`, `hooks`, `unprefixed`, the timeout, and any
 * key a later core release adds all still describe the server.
 *
 * A `url` server has no local process and is returned as it is.
 */
export function asUntrustedServer(server: ConfiguredServer, toolsDir: string): ConfiguredServer {
  if (typeof server.command !== "string") return server;
  const args = Array.isArray(server.args) ? server.args : [];
  return {
    ...server,
    command: "bash",
    args: [wrapperPath(toolsDir), server.command, ...args],
  };
}

/**
 * The wrapper's path, absolute.
 *
 * The same rule `tools-file.ts` applies to hook paths, and for the same reason:
 * `atoma` resolves nothing here against the tools file, so a relative path would
 * follow the caller's working directory rather than the machinery. Posix
 * separators, because this file is written for a Linux runner and the tests for it
 * also run on Windows.
 */
function wrapperPath(toolsDir: string): string {
  const from = isAbsolute(toolsDir) ? toolsDir : resolve(toolsDir);
  return join(from, RUN_AS_UNTRUSTED).split("\\").join("/");
}
