import json
d = json.load(open('636-reviewer.json'))
msgs = d['messages']
for i in (56, 57, 58):
    print('===== message', i, msgs[i]['role'], flush=True)
    print(str(msgs[i].get('content',''))[:3000])
    print()
