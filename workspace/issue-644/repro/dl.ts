const branches = ["release/v0.27.0", "release/v0.26.0", "release/v0.25.3"];
for (const b of branches) {
  const url = `https://raw.githubusercontent.com/yuma-seno/atomaton/${b}/.github/atomaton-runtime/tools/mcp/files.ts`;
  const r = await fetch(url);
  if (!r.ok) { console.log(b, r.status); continue; }
  const body = await r.text();
  const out = `/tmp/atomaton-workspace/repro/files-${b.replace(/\//g, "_")}.ts`;
  await Bun.write(out, body);
  console.log(b, "bytes", body.length, "->", out);
}
