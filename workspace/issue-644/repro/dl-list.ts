// Find recent sessions with engineer.json: list a few recent issue trees on atomaton-data
const r = await fetch("https://api.github.com/repos/yuma-seno/atomaton/contents/sessions?ref=atomaton-data", { headers: { "User-Agent": "probe" } });
const j = await r.json() as any;
const dirs = (Array.isArray(j) ? j : []).filter((e: any) => e.type === "dir").map((e: any) => e.name);
const recent = dirs.filter((n: string) => /^issue-(6[0-9]{2}|5[5-9][0-9])$/.test(n)).slice(-12);
console.log("candidates:", recent.join(", "));
for (const node of recent) {
  const r2 = await fetch(`https://api.github.com/repos/yuma-seno/atomaton/contents/sessions/${node}?ref=atomaton-data`, { headers: { "User-Agent": "probe" } });
  const j2 = await r2.json() as any;
  const names = (Array.isArray(j2) ? j2 : []).map((e: any) => `${e.name}(${e.size})`);
  console.log(node, "->", names.join(" "));
}
