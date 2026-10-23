import { askSuperseded } from "/home/runner/work/atomaton/atomaton/src/domain/work/thread.ts";
import { readers } from "/home/runner/work/atomaton/atomaton/src/adapters/github/thread.ts";
const comments = [
  { id: 1, body: "/reviewer", isHuman: true },
  { id: 2, body: "<!-- atomaton:llm-context=exclude -->\n<!-- atomaton:took=1 run=9 -->", isHuman: false, quoted: false },
  { id: 3, body: "<!-- atomaton:agent=reviewer -->\n<!-- atomaton:ended=done answers=1 run=9 -->", isHuman: false, quoted: false },
];
const shaped = (await import("/home/runner/work/atomaton/atomaton/src/domain/work/thread.ts")).shapedThread(comments, readers);
console.log("shaped comments:", shaped.comments.length, "holder:", shaped.holder);
console.log("superseded:", askSuperseded(shaped.comments, readers, 1, "reviewer", true));
console.log("readers.answeredAsk:", readers.answeredAsk(comments[2]!.body));
console.log("readers.endingAgent:", readers.endingAgent(comments[2]!.body));
