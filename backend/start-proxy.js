const { fork } = require("child_process");
const path = require("path");

const proxy = fork(path.join(__dirname, "razorpay-proxy.js"), [], {
  stdio: "inherit",
  env: { ...process.env },
});

proxy.on("exit", (code) => {
  console.log(`Proxy exited with code ${code}`);
  process.exit(code);
});

process.on("SIGTERM", () => proxy.kill());
process.on("SIGINT", () => proxy.kill());

console.log("Proxy started on port 8793, PID:", proxy.pid);
