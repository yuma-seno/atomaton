# issue-111 — state after the post-merge run of 2026-10-12 (~20:00 UTC)

## What is done

- PR #163 (skill `docs/design-doc` + `generate.mjs`) MERGED to main at `2cde4e2`.
  Deliverable 1 met. Deliverable 3 (on-demand install record) measured on the
  shipped tree: first run installs all six deps (venv 1.7s, openpyxl 0.5s,
  python-docx 0.7s, LibreOffice 10.6s, fonts 1.9s, pdf-convert 0.5s), second
  run all `cached` (0.6s wall). CJK verified via embedded `NotoSansCJKhk-*` in
  the PDF's `/BaseFont`.
- `tests/contract/hardened-servers.test.ts` + bare-tool-name rule in
  `skill-catalog.test.ts` landed with #163.

## The new measurement that blocks deliverable 2

Upload mode (`probe`), one session, one credential (`ghs_`, the runner token),
repository_id 1390896626 (verified = yuma-seno/atomaton via unauthenticated API):

- endpoint (empty name, no body) → **400** `Invalid name for request`
- upload 20,898 B `application/pdf` → **404** `Not Found`
- upload 20,898 B `application/octet-stream` → **404**
- upload 5 B `text/plain` → **404**
- oversize 27 MB (#109) → **404**

Every body-carrying POST is 404 regardless of size (5 B … 27 MB) and MIME.
Validation-stage requests are accepted; uploads are refused. Reading: the
uploads endpoint refuses asset uploads from the Actions token across the board.
Most likely the credential-kind check gh applies client-side is mirrored
server-side (gho_/ghp_/github_pat_ only), but **kind vs role cannot be
separated without a token of a different kind — that is the person's step.**

This falsifies:
- #109's oversize interpretation "404 = the shape the ceiling takes" (a 5 B file gets the same 404);
- #12 owner's comment-3 premise that the endpoint serves Office-formats via ghs_;
- the upload-404 interpretation text in BOTH deployed and main's attachments.ts
  ("token without write access on the repository gets 404") — the Actions token
  HAS write on its own repo.

## What is gated, in order

1. Person decision: PAT in `tools.secrets` (upload may work with gho_ — untested) vs orphan-only (drop the attach layer) vs release assets. This is #12's, per #111's 前提 (親に判断を仰ぐ).
2. Person: version bump past 0.21.3 (package.json is governed) → tag → self-deploy. Then `publish_draft` and `skills/docs/` are live.
3. Then a run on #111 does the end-to-end: sample draft → publish_draft → generate.mjs → upload (if the credential decision allows) → 3 URLs.

Do NOT run more uploads against the endpoint before the credential decision:
every refusal costs a request_id and settles nothing new; every acceptance
stores a permanent file with no deletion API.
