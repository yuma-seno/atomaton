const j = JSON.parse(await Bun.file(process.argv[2]).text());
const walk = (o: any, cb: (o: any) => void) => {
  if (Array.isArray(o)) { o.forEach(v => walk(v, cb)); return; }
  if (o && typeof o === "object") { if (typeof o.name === "string" && o.arguments !== undefined) cb(o); for (const k of Object.keys(o)) walk(o[k], cb); }
};
walk(j, (o) => {
  if (o.name !== "create_root_issue") return;
  const s = typeof o.arguments === "string" ? o.arguments : JSON.stringify(o.arguments);
  if (!s.includes("waiting")) return;
  // print the closest thinking/prose around this call index
  const raw = typeof o.arguments === "string" ? o.arguments : JSON.stringify(o.arguments);
  console.log(raw.slice(0, 150));
});
// find thinking text mentioning the label
const text = JSON.stringify(j);
const ats = [];
let at = text.indexOf("waiting-for-person");
while (at !== -1 && ats.length < 40) { ats.push(at); at = text.indexOf("waiting-for-person", at + 1); }
for (const a of ats) {
  const chunk = text.slice(Math.max(0, a - 260), a + 120).replace(/\\n/g, " ");
  if (/labels|起票|ラベル/.test(chunk) && !/title/.test(chunk)) console.log("---ctx---\n" + chunk + "\n");
}
