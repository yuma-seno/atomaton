import json, sys
for path in ("issue-637-engineer.json", "issue-638-engineer.json", "issue-634-engineer.json", "issue-627-atomaton.json"):
    try:
        d = json.load(open(path))
    except FileNotFoundError:
        print(path, "not present"); continue
    rows = {}
    multi = 0
    total = 0
    for m in d['messages']:
        for call in (m.get('tool_calls') or []):
            fn = call.get('function', {})
            try:
                args = json.loads(fn.get('arguments') or '{}')
                keys = tuple(sorted(args.keys()))
            except Exception:
                keys = ('UNPARSEABLE',)
            total += 1
            if len(keys) > 1 or (fn.get('name') in ('read','grep','list') and len(keys) > 1):
                multi += 1
            rows.setdefault(fn.get('name','?'), set()).add(keys)
    state = "MLTI-KEY CALLS: " + str(multi) + "/" + str(total)
    print('=====', path, state)
    for name, variants in sorted(rows.items()):
        if any(len(v) > 1 for v in variants):
            print(f"   {name}: " + str(sorted(variants)[:6]))
