p='src/entrypoints/tools/mcp/attachments.ts'
s=open(p).read()

old = '''/**
 * Where a published draft is read as a document: the blob URL a person pastes.
 *
 * Deliberately not the raw URL. A raw URL is for a program to fetch; what goes into
 * an issue comment is a link somebody clicks, and the blob view renders the markdown.
 * Measured on #12's thread against a real file on `main`.
 *
 * The path is percent-encoded per segment. A target is allowed to contain a space and
 * a `#`, both of which end the path in a URL — an unencoded `#` would make the link
 * open the branch at a fragment that does not exist, and a space is not even a legal
 * URL character. `encodeURIComponent` per segment rather than once over the whole
 * path, so the `/` separators survive.
 */
export function blobUrlFor(repo: string, branch: string, target: string): string {
  const path = target
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `https://github.com/${repo}/blob/${encodeURIComponent(branch)}/${path}`;
}
'''

new = '''/**
 * A target's path, percent-encoded segment by segment.
 *
 * A target is allowed to contain a space and a `#`, both of which end the path in a
 * URL — an unencoded `#` would make the link open the branch at a fragment that does
 * not exist, and a space is not even a legal URL character. `encodeURIComponent` per
 * segment rather than once over the whole path, so the `/` separators survive. Both
 * URLs below are the same encoding over a different host and path prefix, which is why
 * this is one function rather than the same loop twice.
 */
function encodedPath(target: string): string {
  return target
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

/**
 * Where a published draft is read as a document: the blob URL a person pastes.
 *
 * Deliberately not the raw URL. A raw URL is for a program to fetch; what goes into
 * an issue comment is a link somebody clicks, and the blob view renders the markdown.
 * Measured on #12's thread against a real file on `main`.
 *
 * An IMAGE is the exception, and `rawUrlFor` says why.
 */
export function blobUrlFor(repo: string, branch: string, target: string): string {
  return `https://github.com/${repo}/blob/${encodeURIComponent(branch)}/${encodedPath(target)}`;
}

/**
 * Where an image is read so a comment renders it: the raw URL, inside `![alt](...)`.
 *
 * Not the blob URL, which a comment shows as a link labelled with the URL. Two things
 * make the raw host the right one and were measured on #489's thread: GitHub proxies it
 * through camo even for a private repository, so the picture appears in a comment; and
 * `raw.githubusercontent.com` is a host `fetch_attachment` does not allow, so the
 * picture is for a reader rather than something a later run can read back.
 *
 * A raw URL is also not stable the way an attachment is — the same path resolves to
 * whatever the branch holds now, so replacing the file changes what an old comment
 * shows, and rewriting the branch breaks the link. That is the price of not asking a
 * person for a credential, which is a decision taken on #489.
 */
export function rawUrlFor(repo: string, branch: string, target: string): string {
  return `https://raw.githubusercontent.com/${repo}/${encodeURIComponent(branch)}/${encodedPath(target)}`;
}

/**
 * The extensions a comment renders in place, so `publish_draft` can offer a raw URL.
 *
 * The image half of GitHub's own attachment list. Video is deliberately absent: a bare
 * raw URL is an image reference, and GitHub promotes a URL into a player only for its
 * own attachment host — so a video published this way would be a link, which
 * `blobUrlFor` already gives.
 */
export const INLINE_IMAGE_EXTENSIONS: readonly string[] = [
  "png",
  "gif",
  "jpg",
  "jpeg",
  "svg",
  "webp",
  "bmp",
  "tif",
  "tiff",
];

/** The extension of a target's last segment, lowercased, or `""` when it has none. */
export function extensionOf(target: string): string {
  const name = target.slice(target.lastIndexOf("/") + 1);
  const dot = name.lastIndexOf(".");
  return dot <= 0 ? "" : name.slice(dot + 1).toLowerCase();
}

/**
 * The two fields an image adds to `publish_draft`'s answer, or nothing for any other file.
 *
 * The alt text is the file's own name without its extension, escaped by the same
 * `escapeLabel` `attach_file` uses — an alt containing `](` would otherwise close the
 * image early and turn it into a link to wherever it pointed. The caller gets the
 * markdown to paste rather than the pieces, because the rule that a video needs its own
 * paragraph has no analogue here: this is always a whole image.
 */
export function inlineImageFor(
  repo: string,
  branch: string,
  target: string,
): { raw_url: string; markdown: string } | null {
  if (!INLINE_IMAGE_EXTENSIONS.includes(extensionOf(target))) return null;
  const name = target.slice(target.lastIndexOf("/") + 1);
  const dot = name.lastIndexOf(".");
  const raw = rawUrlFor(repo, branch, target);
  return { raw_url: raw, markdown: `![${escapeLabel(dot <= 0 ? name : name.slice(0, dot))}](${raw})` };
}
'''
assert s.count(old)==1
s=s.replace(old,new)

# the result build
old2 = '''        files: drafts.map((draft) => ({ target: draft.target, blob_url: blobUrlFor(repo, branch, draft.target) })),'''
new2 = '''        files: drafts.map((draft) => ({
          target: draft.target,
          blob_url: blobUrlFor(repo, branch, draft.target),
          ...(inlineImageFor(repo, branch, draft.target) ?? {}),
        })),'''
assert s.count(old2)==1
s=s.replace(old2,new2)
open(p,'w').write(s)
print("ok")
