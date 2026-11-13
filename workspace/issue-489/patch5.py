p='src/entrypoints/tools/mcp/attachments.ts'
s=open(p).read()

old = '''export async function attachFile(a: z.infer<typeof ATTACH_SCHEMA>): Promise<string> {
  const token = (process.env.GH_TOKEN ?? "").trim();'''
new = '''export async function attachFile(
  a: z.infer<typeof ATTACH_SCHEMA>,
  options: { hosts?: AttachHosts; budgetMs?: number } = {},
): Promise<string> {
  const token = (process.env.GH_TOKEN ?? "").trim();'''
assert s.count(old)==1
s=s.replace(old,new)

old = '''  const deadline = Date.now() + ATTACH_BUDGET_MS;'''
new = '''  const budget = options.budgetMs ?? ATTACH_BUDGET_MS;
  const hosts = options.hosts ?? PRODUCTION_HOSTS;
  const deadline = Date.now() + budget;'''
assert s.count(old)==1
s=s.replace(old,new)

old = '''        `the ${ATTACH_BUDGET_MS}-millisecond budget for one attach_file call ran out before ${what}, so nothing ` +'''
new = '''        `the ${budget}-millisecond budget for one attach_file call ran out before ${what}, so nothing ` +'''
assert s.count(old)==1
s=s.replace(old,new)

old = '''    const id = await repositoryIdFor(repo, token, PRODUCTION_HOSTS, signalFor("the repository was read"));
    for (const file of files) {
      const url = await uploadAttachment(file, id, token, PRODUCTION_HOSTS, signalFor(`'${file.name}' was uploaded`));'''
new = '''    const id = await repositoryIdFor(repo, token, hosts, signalFor("the repository was read"));
    for (const file of files) {
      const url = await uploadAttachment(file, id, token, hosts, signalFor(`'${file.name}' was uploaded`));'''
assert s.count(old)==1
s=s.replace(old,new)
open(p,'w').write(s)
print("ok")
