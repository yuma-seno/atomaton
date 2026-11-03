const fs = require("fs");
const keys = fs.readFileSync(process.argv[2], "utf8").trim().split(/\s+/);
const o = {};
for (const k of keys) o[k] = "USD $'000 & <" + k + "> $& $$ $` end";
fs.writeFileSync(process.argv[3], JSON.stringify(o));
console.log("data keys:", keys.length);
