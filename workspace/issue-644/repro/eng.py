import json, subprocess
r = subprocess.run(['bun', 'run', 'dl-eng.ts'], capture_output=True, text=True)
print(r.stdout, r.stderr[-200:] if r.returncode else '')
d = json.load(open('636-engineer.json') if __import__('os').path.exists('636-engineer.json') else open('636-reviewer.json'))
