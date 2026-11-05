// Delivery helper for #12 aggregation: copy the four files PR #440 changed from
// the tree branch head (f4177a5) into the worktree, byte-exact, and verify by
// git blob SHA. The `fetch` tool truncates its output, so raw.githubusercontent
// is read with bun's fetch — the same download the customer-doc skill's deps
// install already performs.
import { writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const REF = "f4177a596af4698485d3785ef1bf61338b138b69"; // atomaton/issue-12 head
const FILES = [
  "src/content/skills/docs/customer-doc.md",
  "src/content/skills/docs/templates/report.fodt",
  "src/content/skills/docs/templates/deck.fodp",
  "src/content/skills/docs/templates/book.fods",
];
// Blob SHAs as returned by the contents API at that ref — the verification target.
const EXPECTED = {
  "src/content/skills/docs/customer-doc.md": "553867273bc5564e7b01417103fee6d77337f4c1",
  "src/content/skills/docs/templates/report.fodt": "636c58286c7c4982302e734f6f515bb07972dbff",
  "src/content/skills/docs/templates/deck.fodp": "d86bacacfedd082463e0bb2438f6572a61209b3a",
  "src/content/skills/docs/templates/book.fods": "8f44f3d0ccd2d946e18d307526d53970f04f6329",
};

const blobSha = (buf) =>
  createHash("sha1").update(`blob ${buf.length}\0`).update(buf).digest("hex");

let ok = true;
for (const f of FILES) {
  const res = await fetch(`https://raw.githubusercontent.com/yuma-seno/atomaton/${REF}/${f}`);
  if (!res.ok) {
    console.error(`FAIL ${f}: HTTP ${res.status}`);
    ok = false;
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(f, buf);
  const sha = blobSha(buf);
  const match = sha === EXPECTED[f] ? "MATCH" : `MISMATCH (expected ${EXPECTED[f]})`;
  if (sha !== EXPECTED[f]) ok = false;
  console.log(`${f}: ${buf.length} bytes, blob ${sha} — ${match}`);
}

// The contract test #438 also created on main: confirm the branch copy is the
// same file, so the delivery set stays at the four files above.
for (const ref of [REF, "main"]) {
  const res = await fetch(`https://raw.githubusercontent.com/yuma-seno/atomaton/${ref}/tests/contract/doc-template-rows.test.ts`);
  const buf = Buffer.from(await res.arrayBuffer());
  console.log(`tests/contract/doc-template-rows.test.ts @ ${ref.slice(0, 7)}: ${buf.length} bytes, blob ${blobSha(buf)}`);
}

console.log(ok ? "ALL FOUR FILES BYTE-IDENTICAL TO TREE BRANCH" : "MISMATCH — DO NOT COMMIT");
