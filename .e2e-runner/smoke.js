/* Smoke test for CDP driver. */
const { launchChrome, attachToPage, evalJs, waitFor, shutdownChrome, getJson } = require("./cdp");

(async () => {
  try {
    const targets = await launchChrome({ port: 9223 });
    console.log("targets:", targets.map((t) => `${t.type}:${t.url}`));
    const { client } = await attachToPage(targets);
    await client.send("Page.navigate", { url: "http://localhost:5173" });
    await waitFor(client, "document.readyState === 'complete'", { timeout: 20000 });
    const title = await evalJs(client, "document.title");
    const url = await evalJs(client, "location.href");
    const bodySnippet = await evalJs(client, "document.body ? document.body.innerText.slice(0,300) : ''");
    console.log("title:", title);
    console.log("url:", url);
    console.log("body:", bodySnippet.replace(/\n/g, " | ").slice(0, 300));
    client.close();
  } catch (e) {
    console.error("SMOKE FAILED:", e.message);
    process.exitCode = 1;
  } finally {
    await shutdownChrome();
  }
})();