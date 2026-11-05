const j = JSON.parse(await Bun.file(process.argv[2]).text());
// discover shape
const walk = (o: any, path: string): Array<{name: string; args: string}> => {
  const out: Array<{name: string; args: string}> = [];
  if (Array.isArray(o)) { o.forEach((v, i) => out.push(...walk(v, `${path}[${i}]`))); return out; }
  if (o && typeof o === "object") {
    const name = o.name ?? o.tool ?? o.toolName;
    const args = o.arguments ?? o.input ?? o.args;
    if (typeof name === "string" && (args !== undefined)) out.push({ name, args: typeof args === "string" ? args : JSON.stringify(args) });
    for (const k of Object.keys(o)) out.push(...walk(o[k], `${path}.${k}`));
  }
  return out;
};
const calls = walk(j, "");
for (const c of calls) {
  if (typeof c.args === "string" && c.name.match(/^[a-z_]+$/)) {
    console.log(`${c.name}: ${c.args.slice(0, 120).replace(/\s+/g, " ")}`);
  }
}
