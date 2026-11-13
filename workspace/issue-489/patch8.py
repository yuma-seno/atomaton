p='tests/contract/attachments-attach.test.ts'
s=open(p).read()

s=s.replace('import { mkdtempSync, rmSync, writeFileSync } from "node:fs";',
            'import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";')
s=s.replace('''import {
  ATTACH_SCHEMA,
  IMAGE_LIMIT_BYTES,''','''import {
  ATTACH_BUDGET_MS,
  ATTACH_SCHEMA,
  IMAGE_LIMIT_BYTES,
  MAX_ATTACH_FILES,
  REQUEST_ABORT_MS,''')
s=s.replace('''  attachTypeFor,
  isSingleImage,''','''  attachFile,
  attachTypeFor,
  isSingleImage,''')
open(p,'w').write(s)
print("ok")
