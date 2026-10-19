process.env.PROBE_X = "hello";
const r = Bun.spawnSync({ cmd: [process.execPath, "-e", "console.log('child sees:', process.env.PROBE_X)"], stdout: "pipe", stderr: "pipe" });
console.log("code", r.exitCode, r.stdout.toString().trim(), r.stderr.toString().trim());
const r2 = Bun.spawnSync({ cmd: [process.execPath, "-e", "console.log('child sees:', process.env.PROBE_X)"], stdout: "pipe", stderr: "pipe", env: { ...process.env } });
console.log("explicit env:", r2.exitCode, r2.stdout.toString().trim());
