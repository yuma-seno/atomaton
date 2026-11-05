const j = JSON.parse(await Bun.file(process.argv[2]).text());
const walk = (o: any, cb: (a: any) => void) => {
  if (Array.isArray(o)) { o.forEach(v => walk(v, cb)); return; }
  if (o && typeof o === "object") { if (o.arguments !== undefined) cb(o.arguments); for (const k of Object.keys(o)) walk(o[k], cb); }
};
walk(j, (a) => {
  const s = typeof a === "string" ? a : JSON.stringify(a);
  try { const p = JSON.parse(s); if (p.labels) console.log("LABELS =", JSON.stringify(p.labels)); } catch {}
});
