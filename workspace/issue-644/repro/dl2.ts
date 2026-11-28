// List session trees for issue-636 and download reviewer.json + atomaton.json
const r = await fetch("https://api.github.com/repos/yuma-seno/atomaton/contents/sessions/issue-636?ref=atomaton-data", { headers: { "User-Agent": "probe" } });
const j = await r.json() as any;
console.log("status", r.status);
for (const f of (j.message ? [] : j)) console.log(f.name, f.size, f.download_url);
