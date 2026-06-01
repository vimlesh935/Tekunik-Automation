const { spawn } = require("node:child_process");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const windowsRoot = process.env.SystemRoot || "C:\\Windows";

const processes = [
  { name: "frontend", color: "\x1b[36m", command: "npm run dev --prefix frontend" },
  { name: "backend", color: "\x1b[32m", command: "npm run dev --prefix backend" },
];

let shuttingDown = false;

const prefixOutput = (childName, color, stream) => {
  stream.on("data", (chunk) => {
    chunk
      .toString()
      .split(/\r?\n/)
      .filter(Boolean)
      .forEach((line) => {
        process.stdout.write(`${color}[${childName}]\x1b[0m ${line}\n`);
      });
  });
};

const createCommand = (command) => {
  if (process.platform === "win32") {
    const windowsShell =
      process.env.ComSpec ||
      path.join(windowsRoot, "System32", "cmd.exe");

    return {
      file: windowsShell,
      args: ["/d", "/s", "/c", command],
    };
  }

  return {
    file: "sh",
    args: ["-c", command],
  };
};

const children = processes.map(({ name, color, command }) => {
  const { file, args } = createCommand(command);
  const child = spawn(file, args, {
    cwd: rootDir,
    stdio: ["inherit", "pipe", "pipe"],
    windowsHide: false,
  });

  prefixOutput(name, color, child.stdout);
  prefixOutput(name, "\x1b[31m", child.stderr);

  child.on("exit", (code) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n${name} stopped with code ${code}. Stopping all dev servers...`);
    stopChildren();
    process.exit(code || 0);
  });

  return child;
});

const stopChildren = () => {
  children.forEach((child) => {
    if (child.killed) return;

    if (process.platform === "win32") {
      spawn(path.join(windowsRoot, "System32", "taskkill.exe"), [
        "/pid",
        String(child.pid),
        "/t",
        "/f",
      ]);
      return;
    }

    child.kill();
  });
};

process.on("SIGINT", () => {
  shuttingDown = true;
  stopChildren();
  process.exit(0);
});

process.on("SIGTERM", () => {
  shuttingDown = true;
  stopChildren();
  process.exit(0);
});
