import { expect, test } from "bun:test";

const buildTimeoutMs = 20_000;

test("NusaTV smoke runs let Bun exit after building both bundle forms", () => {
  // Let the child exit on its own so a leaked app clock timer fails the test.
  const child = Bun.spawnSync({
    cmd: [
      process.execPath,
      "--no-install",
      "--eval",
      `
        import { buildTvplayerBundle } from "./bundle-lib.ts";

        for (const form of ["tv", "phone"]) {
          const { code } = await buildTvplayerBundle(form);
          if (!code.length) throw new Error("Empty " + form + " bundle");
          console.log("Built " + form);
        }
      `,
    ],
    cwd: import.meta.dir,
    timeout: buildTimeoutMs,
    killSignal: "SIGKILL",
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = child.stdout.toString();
  expect(
    child.exitCode,
    `Expected Bun to exit normally within ${buildTimeoutMs} ms (signal: ${child.signalCode})\n` +
      `stdout:\n${stdout}\nstderr:\n${child.stderr.toString()}`,
  ).toBe(0);
  expect(stdout).toContain("Built tv\n");
  expect(stdout).toContain("Built phone\n");
}, buildTimeoutMs + 5_000);
