import json
d = json.load(open('636-reviewer.json'))
sys_prompt = d['messages'][0]['content']
print("system prompt length:", len(sys_prompt))
# Find the segment describing `read` and `grep`
for needle in ('`read`', '`grep`'):
    idx = sys_prompt.find(needle)
    print('\n==== segment around', needle, 'at', idx)
    print(sys_prompt[max(0, idx-400): idx+1400])
