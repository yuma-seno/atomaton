import json
d = json.load(open('636-reviewer.json'))
msgs = d['messages']
for i in range(49, 59):
    m = msgs[i]
    role = m['role']
    c = m.get('content', '')
    if isinstance(c, list): c = ' / '.join(str(x) for x in c)
    tc = m.get('tool_calls')
    print('----- [{}] {}'.format(i, role))
    if tc:
        for call in tc:
            fn = call.get('function', {})
            print('  TOOLCALL:', fn.get('name'), (fn.get('arguments','') or '')[:240])
    print(str(c)[:280].replace('\n', ' | '))
