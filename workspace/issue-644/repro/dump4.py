import json
d = json.load(open('636-reviewer.json'))
sp = d['messages'][0]['content']
# tool description text uses unbackticked names like "Read a range of lines"
i = sp.find('Read a range of lines')
print('read section at', i)
print(sp[i-200:i+2600])
