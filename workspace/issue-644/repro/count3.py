import json
for path in ("issue-637-engineer.json", "issue-638-engineer.json"):
    d = json.load(open(path))
    rows = {}
    for m in d['messages']:
        for call in (m.get('tool_calls') or []):
            fn = call.get('function', {})
            try:
                args = json.loads(fn.get('arguments') or '{}')
                keys = tuple(sorted(args.keys()))
            except Exception:
                keys = ('UNPARSEABLE',)
            rows.setdefault(fn.get('name','?'), {}).setdefault(keys, 0)
            rows[fn.get('name','?')][keys] += 1
    print('=====', path)
    for name in ("read", "grep", "list", "glob"):
        if name in rows:
            variants = ", ".join(f"{'+'.join(k)}(x{n})" for k, n in sorted(rows[name].items(), key=lambda x: -x[1]))
            print(f"   {name}: {variants}")
