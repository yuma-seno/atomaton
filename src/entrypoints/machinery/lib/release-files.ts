/**
 * release-files.ts — the release assets as file contents, and the tree beside them.
 *
 * The update machinery answers questions that need FILE CONTENTS, not just the
 * manifest's path list: whether the adopter changed a file, whether upstream's
 * change collides with it, what a three-way merge would do. Everything here
 * exists to put three content maps on the table — the release the tree came
 * from, the release being taken, and the tree itself — which is what
 * `domain/machinery/update-plan.ts` reads.
 *
 * ## The zip, and `unzip` rather than a library
 *
 * The delivery asset is built by `publish-release.sh` and read back with the
 * system's `unzip`. There is no zip library in this tree, deliberately: the
 * producer is a shell script and the consumer keeping the same tool means one
 * definition of "extract this archive" per environment rather than two. `unzip`
 * ## The zip, read here rather than through a binary
 *
 * The delivery asset is built by `publish-release.sh` and opened by `lib/zip-read.ts`
 * with Bun's own `zlib` — not the system's `unzip`, which this tree used to shell out
 * to and which quietly failed on any machine without it. There is no zip library in
 * this tree beyond that reader, deliberately: the producer is a shell script, and the
 * consumer keeping the reading in-tree means one definition of "read this archive"
 * for the notice and the update alike. Where a read fails, every caller gets a
 * reason instead of a guess.
 */
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ghRead } from "../../../adapters/github/gh.ts";
import { machineryPath } from "../../../adapters/runner/machinery.ts";
import { RELEASE_MANIFEST } from "../../../domain/machinery/machinery-layout.ts";
import type { ReleaseManifest } from "../../../domain/machinery/release-manifest.ts";
import { zipEntries } from "./zip-read.ts";

function log(message: string): void {
  console.error(`[release-files] ${message}`);
}

/**
 * Where a release comes from.
 *
 * The canonical copy lives here, because the update machinery and the notice both
 * reach upstream by it and they have to agree. It is the same slug
 * `src/content/README.md` links to and `atoma-cli.ts` downloads from: an adopted
 * tree reaches upstream by name, and the name is what it is.
 */
export const UPSTREAM_REPOSITORY = "yuma-seno/atomaton";

/**
 * The release asset, as `self/atomaton/scripts/publish-release.sh` names it.
 *
 * A fixed name rather than one carrying the version: that is what makes
 * `releases/latest/download/atomaton-delivery.zip` a stable URL, and the version
 * is carried by the release itself.
 */
export const ASSET_NAME = "atomaton-delivery.zip";

/** The manifest plus every file the release ships, as contents. */
export interface ReleaseFiles {
  readonly manifest: ReleaseManifest;
  /** Path → content, repository-relative, exactly what the asset carries. */
  readonly files: Map<string, string>;
}

/**
 * One release, as the update machinery reaches it: download, read, map.
 *
 * Nothing lands inside the working tree: the download goes to a directory this
 * run deletes on the way out, and the archive's members are read from there with
 * `zipEntries`, so a failed read in the middle of one release cannot leave half a
 * release on disk for the next reader to trust.
 *
 * ## Why the manifest comes out of the asset, not the tree at the tag
 *
 * The copy committed at a tag is the repository's own deployed `.github/`, written
 * by the PREVIOUS release and committed by the self-deploy pull request — the tag
 * at `vX` serves a manifest naming `v(X-1)`. Reading that copy answers "what my
 * release shipped that the previous one did not", which is the opposite question,
 * and it filters the very paths this machinery exists to report. The manifest
 * inside the asset is built from `package.json` at build time (`src/build-dist.ts`)
 * and `publish-release.sh` refuses to publish unless the tag equals that version,
 * so it is the one copy that cannot lag.
 */
export function releaseFiles(tag: string): { files: ReleaseFiles } | { why: string } {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-release-"));
  try {
    const downloaded = ghRead(
      "release", "download", tag, "-R", UPSTREAM_REPOSITORY, "-p", ASSET_NAME, "-D", dir,
    );
    if (downloaded.code !== 0) {
      return { why: `could not download ${tag}'s ${ASSET_NAME}: ${downloaded.stderr.trim() || `gh exited ${downloaded.code}`}` };
    }
    const asset = join(dir, ASSET_NAME);
    if (!existsSync(asset)) {
      return { why: `${tag}'s download reported success but left no ${ASSET_NAME}` };
    }

    const read = zipEntries(asset);
    if ("why" in read) {
      return { why: `could not read ${tag}'s ${ASSET_NAME}: ${read.why}` };
    }
    const manifestJson = read.entries.get(RELEASE_MANIFEST);
    if (manifestJson === undefined) {
      return { why: `${tag}'s ${ASSET_NAME} carries no ${RELEASE_MANIFEST}` };
    }
    let manifest: ReleaseManifest;
    try {
      const parsed = JSON.parse(manifestJson) as Partial<ReleaseManifest>;
      if (!Array.isArray(parsed.files)) {
        return { why: `${RELEASE_MANIFEST} in ${tag}'s ${ASSET_NAME} holds no file list` };
      }
      manifest = { version: String(parsed.version ?? tag), files: parsed.files.map(String) };
    } catch (error) {
      return { why: `could not parse the ${RELEASE_MANIFEST} inside ${tag}'s ${ASSET_NAME}: ${(error as Error).message}` };
    }

    // A path the manifest lists but the archive does not carry is absent rather
    // than an error: every reader of this map treats a missing path as "not in
    // the release", which is also what the plan needs from it.
    const files = new Map<string, string>();
    for (const path of manifest.files) {
      const content = read.entries.get(path);
      if (content !== undefined) files.set(path, content);
    }
    return { files: { manifest, files } };
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
    } catch {
      // The OS owns a temp directory it will not let go of.
    }
  }
}

/** The tree's own contents at the given paths. Missing paths are simply absent. */
export function readTreeFiles(paths: Iterable<string>): Map<string, string> {
  const files = new Map<string, string>();
  for (const path of paths) {
    const onDisk = machineryPath(path);
    if (!existsSync(onDisk)) continue;
    try {
      files.set(path, readFileSync(onDisk, "utf8"));
    } catch {
      // A file that cannot be read is treated as absent: the plan then keeps
      // whatever the tree has rather than overwriting what it cannot see.
    }
  }
  return files;
}

/** Every file under the deployed tree, as the manifest comparison names them. */
export function treePaths(): string[] {
  const root = machineryPath(".github");
  if (!existsSync(root)) return [];
  const found: string[] = [];
  const walk = (dir: string, prefix: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const here = `${prefix}/${entry.name}`;
      if (entry.isDirectory()) walk(join(dir, entry.name), here);
      else found.push(here);
    }
  };
  walk(root, ".github");
  return found.sort();
}

/** The release this tree came from, or the reason it cannot be read. */
export function readLocalManifest(): { manifest: ReleaseManifest } | { why: string } {
  const path = machineryPath(RELEASE_MANIFEST);
  if (!existsSync(path)) {
    return { why: `${path} is missing, so this tree cannot say which release it came from` };
  }
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<ReleaseManifest>;
    if (typeof parsed.version !== "string" || !parsed.version || !Array.isArray(parsed.files)) {
      return { why: `${path} does not hold a version and a file list` };
    }
    return { manifest: { version: parsed.version, files: parsed.files.map(String) } };
  } catch (error) {
    return { why: `${path} could not be parsed: ${(error as Error).message}` };
  }
}

/** The latest release's tag, or null when it could not be read. */
export function latestReleaseTag(): string | null {
  const result = ghRead(
    "api",
    `repos/${UPSTREAM_REPOSITORY}/releases/latest`,
    "--jq",
    ".tag_name",
  );
  if (result.code !== 0) {
    log(`WARN could not read ${UPSTREAM_REPOSITORY}'s latest release: ${result.stderr.trim() || `gh exited ${result.code}`}`);
    return null;
  }
  const tag = result.stdout.trim();
  return tag === "" ? null : tag;
}
