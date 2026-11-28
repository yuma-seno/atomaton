import json
d = json.load(open('636-reviewer.json'))
print(json.dumps(d['metadata'], ensure_ascii=False)[:2000])
print()
runs = d.get('atoma_runs', [])
print('atoma_runs entries:', len(runs))
if runs: print(json.dumps(runs[0], ensure_ascii=False)[:1200])
