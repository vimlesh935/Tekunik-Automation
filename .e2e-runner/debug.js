/* Debug CDP bring-up step by step. */
const { CDP, launchChrome, evalJs, waitFor, shutdownChrome, getJson, sleep } = require("./cdp");

(async () => {
  let client = null;
  try {
    console.log("[1] launching chrome...");
    const targets = await launchChrome({ port: 9224 });
    console.log("[2] targets:", targets.map((t) => `${t.type}:${t.url.slice(0, 60)}`));
    const pageTarget = targets.find((t) => t.type === "page") || targets[0];
    console.log("[3] connecting to", pageTarget.webSocketDebuggerUrl);
    client = await CDP.connect(pageTarget.webSocketDebuggerUrl);
    console.log("[4] connected");
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Network.enable");
    console.log("[5] navigating...");
    await client.send("Page.navigate", { url: "http://localhost:5173/" });
    await sleep(4000);
    const url = await evalJs(client, "location.href");
    const title = await evalJs(client, "document.title");
    console.log("[6] url:", url, "title:", title);
    const ready = await evalJs(client, "document.readyState");
    console.log("[7] readyState:", ready);
    const hasRoot = await evalJs(client, "!!document.querySelector('#root') && document.querySelector('#root').children.length");
    console.log("[8] #root children:", hasRoot);
    client.close();
    client = null;
  } catch (e) {
    console.error("FAILED:", e.message);
    if (client) client.close();
    process.exitCode = 1;
  } finally {
    await shutdownChrome();
  }
})();