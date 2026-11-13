p='src/entrypoints/tools/mcp/attachments.ts'
s=open(p).read()

# repositoryIdFor: take a signal
old = '''export async function repositoryIdFor(repo: string, token: string, hosts: AttachHosts = PRODUCTION_HOSTS): Promise<number> {
  const url = `${hosts.api.replace(/\\/+$/, "")}/repos/${repo}`;
  const response = await fetch(url, {
    method: "GET",
    headers: attachHeaders(token),
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_ABORT_MS),
  });'''
new = '''export async function repositoryIdFor(
  repo: string,
  token: string,
  hosts: AttachHosts = PRODUCTION_HOSTS,
  signal: AbortSignal = AbortSignal.timeout(REQUEST_ABORT_MS),
): Promise<number> {
  const url = `${hosts.api.replace(/\\/+$/, "")}/repos/${repo}`;
  const response = await fetch(url, {
    method: "GET",
    headers: attachHeaders(token),
    redirect: "manual",
    signal,
  });'''
assert s.count(old)==1
s=s.replace(old,new)

# uploadAttachment: take a signal
old = '''export async function uploadAttachment(
  file: AttachFile,
  repositoryId: number,
  token: string,
  hosts: AttachHosts = PRODUCTION_HOSTS,
): Promise<string> {'''
new = '''export async function uploadAttachment(
  file: AttachFile,
  repositoryId: number,
  token: string,
  hosts: AttachHosts = PRODUCTION_HOSTS,
  signal: AbortSignal = AbortSignal.timeout(REQUEST_ABORT_MS),
): Promise<string> {'''
assert s.count(old)==1
s=s.replace(old,new)

old = '''    body: Bun.file(file.source),
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_ABORT_MS),
  });'''
new = '''    body: Bun.file(file.source),
    redirect: "manual",
    signal,
  });'''
assert s.count(old)==1
s=s.replace(old,new)
open(p,'w').write(s)
print("ok")
