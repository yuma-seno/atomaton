import json, re
d = json.load(open('636-reviewer.json'))
msgs = d['messages']
for i in range(50, 60):
    m = msgs[i]
    role = m['role']
    c = m.get('content', '')
    if isinstance(c, list): c = ' '.join(str(x) for x in c)
    c = str(c)
    tc = m.get('tool_calls')
    print(f"----- [{}] {role}".format(i))
    if tc:
        for call in tc:
            fn = call.get('function', {})
            print("  TOOLCALL:", fn.get('name'), fn.get('arguments', '')[:300])
    print(c[:700].replace('<', '‹').replace('>', '›'))
