/* Minimal Chrome DevTools Protocol client (no dependencies; uses Node 24 global WebSocket).
 * Launch: chrome --headless=new --remote-debugging-port=9222 --user-data-dir=<tmp>
 */
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const res = await fetch(url);
  return res.json();
}

// ─── CDP client ────────────────────────────────────────────────────────
class CDP {
  constructor(ws) {
    this.ws = ws;
    this.idSeq = 0;
    this.pending = new Map();
    this.listeners = new Map();
    ws.addEventListener("message", (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (msg.id !== undefined) {
        const p = this.pending.get(msg.id);
        if (p) {
          this.pending.delete(msg.id);
          if (msg.error) p.reject(new Error(msg.error.message));
          else p.resolve(msg.result || {});
        }
        return;
      }
      const arr = this.listeners.get(msg.method) || [];
      arr.forEach((fn) => fn(msg.params || {}));
    });
  }

  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", () => reject(new Error("WS connect failed")), { once: true });
    });
    return new CDP(ws);
  }

  send(method, params = {}) {
    const id = ++this.idSeq;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, fn) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(fn);
  }

  close() {
    try {
      this.ws.close();
    } catch {
      /* ignore */
    }
  }
}

// ─── Browser driver helpers ────────────────────────────────────────────
let chromeProc = null;

async function launchChrome({ port = 9223, headless = true } = {}) {
  const userDataDir = path.join(os.tmpdir(), `cdp-profile-${Date.now()}`);
  fs.mkdirSync(userDataDir, { recursive: true });
  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-features=Translate,OptimizationHints",
    "--window-size=1440,2000",
  ];
  if (headless) args.push("--headless=new");
  chromeProc = spawn(CHROME_PATH, args, { stdio: "ignore" });
  let targets = null;
  for (let i = 0; i < 60; i += 1) {
    await sleep(500);
    try {
      targets = await getJson(`http://127.0.0.1:${port}/json/list`);
      if (Array.isArray(targets) && targets.length > 0) break;
    } catch {
      /* retry */
    }
  }
  if (!targets) throw new Error("Chrome did not start");
  return targets;
}

async function attachToPage(targets, { urlRe = /localhost:5173/ } = {}) {
  let target = targets.find((t) => t.type === "page" && t.url);
  if (targets.length > 1) {
    target = targets.find((t) => t.type === "page" && urlRe.test(t.url)) || target;
  }
  if (!target) throw new Error("No page target");
  const client = await CDP.connect(target.webSocketDebuggerUrl);
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Network.enable");
  await client.send("Log.enable");
  await client.send("Console.enable");
  return { client, target };
}

// Evaluate an expression; return JSON-serializable result value.
async function evalJs(client, expression) {
  const res = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (res.exceptionDetails) {
    throw new Error(
      `eval error: ${res.exceptionDetails.exception?.description || res.exceptionDetails.text}`
    );
  }
  return res.result?.value;
}

async function waitFor(client, expression, { timeout = 15000, interval = 250 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const v = await evalJs(client, expression);
      if (v) return v;
    } catch {
      /* retry */
    }
    await sleep(interval);
  }
  throw new Error(`waitFor timeout: ${expression}`);
}

async function shutdownChrome() {
  if (chromeProc) {
    try {
      chromeProc.kill();
    } catch {
      /* ignore */
    }
    chromeProc = null;
  }
  await sleep(300);
}

module.exports = {
  CHROME_PATH,
  CDP,
  launchChrome,
  attachToPage,
  evalJs,
  waitFor,
  shutdownChrome,
  sleep,
  getJson,
};