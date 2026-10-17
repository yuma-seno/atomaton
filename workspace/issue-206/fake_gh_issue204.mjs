// Fake gh that reproduces the #204 thread state at the moment of the 12:17:57 `/atomaton` comment
// (dispatch marker at 12:40? no — the marker was posted by launch_sub_agent at 12:40. Let's parametrize.)
import { writeFileSync } from "fs";
const args = Bun.argv.slice(2);
const log = process.env.FAKE_LOG;
if (log) writeFileSync(log, JSON.stringify(args) + "\n", { flag: "a" });
const readComments = (filterIds) => JSON.stringify(comments.filter(c => !filterIds.includes(String(c.id))));
const comments = JSON.parse(process.env.FAKE_COMMENTS ?? "[]");
const out = process.env.FAKE_OUT ?? "";
// Handle: api repos/.../issues/N/comments [--paginate]
if (args[0] === "api" && /\/comments$/.test(args[1] ?? "")) {
  const paginate = args.includes("--paginate");
  process.stdout.write(paginate ? readComments([]) + readComments([]) : readComments([]));
  process.exit(0);
}
if (args[0] === "api" && /\/issues\/\d+$/.test(args[1] ?? "") && args.includes("--jq")) {
  process.stdout.write(process.env.FAKE_ISSUE_BODY ?? "");
  process.exit(0);
}
process.stdout.write(out);
process.exit(0);
