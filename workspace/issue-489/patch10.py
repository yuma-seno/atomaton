p='tests/contract/attachments-attach.test.ts'
s=open(p).read()
old='''    const realFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      reached += 1;
      throw new Error("the stub was reached");
    }) as unknown as typeof fetch;
    try {'''
new='''    const realFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      reached += 1;
      throw new Error("the stub was reached");
    }) as unknown as typeof fetch;
    process.env.GH_TOKEN = "t0ken";
    process.env.GITHUB_REPOSITORY = "owner/repo";
    try {'''
assert s.count(old)==1
open(p,'w').write(s.replace(old,new))
print("ok")
