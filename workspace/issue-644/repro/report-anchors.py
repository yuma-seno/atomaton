import json
d = json.load(open('636-reviewer.json'))
msgs = d['messages']
# Exact markers found in the review's tool results (to quote verbatim in the report)
for i in (53, 55):
    c = str(msgs[i].get('content',''))
    print(f"--- msg {i} (tool result):")
    print(c[:120])
    print("   tail:", c[-140:].replace(chr(10),' | '))
m = d['atoma_runs'][0]
print('--- loop_abort:', json.dumps(m.get('loop_abort'), ensure_ascii=False))
print('--- server_calls:', json.dumps(m.get('server_calls'), ensure_ascii=False))
runs = d['atoma_runs']
print('--- runs:', [(r.get('started'), r.get('ended'), r.get('ended_because'), r.get('iterations')) for r in runs])
