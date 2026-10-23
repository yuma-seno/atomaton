import { ENDED_TAG, TOOK_TAG } from "/home/runner/work/atomaton/atomaton/src/adapters/github/tags.ts";
const body = "<!-- atomaton:agent=reviewer -->\n<!-- atomaton:ended=done answers=1 run=9 -->";
console.log("read:", ENDED_TAG.read(body));
console.log("write:", ENDED_TAG.write({ verb: "done", answers: 1, run: 9 }));
console.log("took read:", TOOK_TAG.read("<!-- atomaton:took=1 run=9 -->"));
console.log("old shape:", ENDED_TAG.read("<!-- atomaton:ended=done -->"));
