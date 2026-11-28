import json
d = json.load(open('636-reviewer.json'))
msgs = d['messages']
multi = 0
rows = {}
for m in msgs:
    for call in m.get('tool_calls', []) or []:
        fn = call.get('function', {})
        name = fn.get('name', '?')
        try:
            args = json.loads(call['function']['arguments'])
            keys = sorted(args.keys())
        except Exception:
            rows.setdefault(name, []).append(('UNPARSEABLE', fn.get('arguments','')[:60]))
            continue
        rows.setdefault(name, []).append(keys)
for name, seen in sorted(rows.items()):
    counted = ['+'.join(k) if isinstance(k, list) else k for k in seen]
    n = len(counted)
    variants = sorted(set(counted))
    print(f"{name:22} x{n:<3} variants: {variants[:5]}")
