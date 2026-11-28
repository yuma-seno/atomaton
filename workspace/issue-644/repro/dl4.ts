for (const [node, name] of [["issue-637", "engineer"], ["issue-638", "engineer"], ["issue-634", "engineer"], ["issue-627", "atomaton"]]) {
  const url = `https://raw.githubusercontent.com/yuma-seno/atomaton/atomaton-data/sessions/${node}/${name}.json`;
  const r = await fetch(url);
  if (r.ok) { const t = await r.text(); const out = `/tmp/atomaton-workspace/repro/${node}-${name}.json`; await Bun.write(out, t); console.log(node, name, "bytes", t.length); }
  else console.log(node, name, r.status);
}
