import { shapedThread } from "/home/runner/work/atomaton/atomaton/src/domain/work/thread.ts";
import { readers } from "/home/runner/work/atomaton/atomaton/src/adapters/github/thread.ts";
const OPEN_CLAIM = "<!-- atomaton:llm-context=exclude -->\n<!-- atomaton:took=55 run=7 -->";
const entries = [
  { id: 100, body: "/engineer", isHuman: true, quoted: false },
  { id: 101, body: OPEN_CLAIM, isHuman: false, quoted: false },
  { id: 102, body: "just a remark", isHuman: true, quoted: false },
];
const shaped = shapedThread(entries, readers);
console.log("kept:", shaped.comments.map((c) => ({ id: (c as { id: number }).id, body: c.body.slice(0, 40) })));
console.log("holder:", shaped.holder);
console.log("claim read:", readers.claim(OPEN_CLAIM));
