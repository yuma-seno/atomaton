import json,sys
def last_assistant(p):
    s=json.load(open(p))
    last=""
    for m in s.get("messages",[]):
        if m.get("role")!="assistant": continue
        c=m.get("content")
        if isinstance(c,str): t=c
        elif isinstance(c,list): t="".join(b.get("text","") for b in c if isinstance(b,dict) and b.get("type")=="text")
        else: t=""
        if t.strip(): last=t
    return last
for p in ["data/sessions/issue-3/engineer.json","data/sessions/issue-4/engineer.json"]:
    t=last_assistant(p)
    print("="*30,p,"len",len(t))
    # print headings only
    for line in t.split("\n"):
        if line.startswith("#"):
            print("   ",line[:90])
    print("---- first 600 ----")
    print(t[:600].replace("\n","\\n"))
    print("---- last 900 ----")
    print(t[-900:].replace("\n","\\n"))
