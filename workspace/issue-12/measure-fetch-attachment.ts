/**
 * The end-to-end check #418 asks for, run against the real asset URL from source.
 *
 * The deployed `attachments` server does not carry `fetch_attachment` until this
 * merges, so this imports the module and drives the same three functions the tool
 * handler calls: `attachmentUrlFrom` → `attachmentPathFor` → `downloadAttachment`.
 */
import { readFileSync } from "node:fs";
import {
  attachmentPathFor,
  attachmentUrlFrom,
  downloadAttachment,
} from "/home/runner/work/atomaton/atomaton/src/entrypoints/tools/mcp/attachments.ts";

const REAL = "https://github.com/user-attachments/files/34306035/default.docx";

const url = attachmentUrlFrom(REAL);
const dest = attachmentPathFor(url);
const { bytes, contentType } = await downloadAttachment(url.href, dest);

const head = readFileSync(dest).subarray(0, 8);
console.log(
  JSON.stringify(
    {
      path: dest,
      bytes,
      content_type: contentType,
      source_url: url.href,
      head_hex: head.toString("hex"),
      head_ascii: head.subarray(0, 2).toString("latin1"),
    },
    null,
    2,
  ),
);

// The other half of the close condition: a URL outside the allowlist is refused.
try {
  attachmentUrlFrom("https://example.com/a.docx");
  console.log("ALLOWLIST-DID-NOT-REFUSE");
} catch (error) {
  console.log(`refused: ${(error as Error).message}`);
}
