for (const name of ["reviewer", "atomaton"]) {
  const out = `/tmp/atomaton-workspace/repro/636-${name}.json`;
  const r = await fetch(`https://raw.githubusercontent.com/yuma-seno/atomaton/atomaton-data/sessions/issue-636/${name}.json`);
  const t = await r.text();
  await Bun.write(out, t);
  console.log(name, t.length);
}
