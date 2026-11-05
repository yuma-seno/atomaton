const j = JSON.parse(await Bun.file(process.argv[2]).text());
const walk = (o: any, cb: (name: string, args: any) => void) => {
  if (Array.isArray(o)) { o.forEach(v => walk(v, cb)); return; }
  if (o && typeof o === "object") {
    if (typeof o.name === "string" && o.arguments !== undefined) cb(o.name, o.arguments);
    for (const k of Object.keys(o)) walk(o[k], cb);
  }
};
walk(j, (name, args) => {
  if (name === "create_root_issue") {
    const s = typeof args === "string" ? args : JSON.stringify(args);
    const tail = s.length > 400 ? ` …[${s.length - 400} chars]… ` + s.slice(-200) : "";
    console.log(`CREATE_ROOT: labels-arg present: ${/"labels"/.test(s)}, first400: ${s.slice(0, 400).replace(/\s+/g, " ")}${tail.replace(/\s+/g, " ")}\n`);
  }
});
