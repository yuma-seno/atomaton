const r = await fetch("https://raw.githubusercontent.com/yuma-seno/atomaton/atomaton-data/sessions/issue-636/engineer.json").catch(() => {});
console.log(r ? r.status : "fetch failed");
if (r && r.ok) { const t = await r.text(); await Bun.write("/tmp/atomaton-workspace/repro/636-engineer.json", t); console.log("bytes", t.length); }
else console.log("no engineer.json on this node");
