const { launchChrome, attachToPage, evalJs, waitFor, shutdownChrome, sleep } = require("./cdp");
const API = "http://localhost:8787";

const apiNode = async (method, path, { token, body } = {}) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null; try { json = await res.json(); } catch {}
  return { status: res.status, json };
};

(async () => {
  const ts = Date.now();
  const email = `ui.${ts}@teknode.test`;
  const rec = (m) => { console.log(m); };

  try {
    await apiNode("POST", "/api/auth/register", {
      body: { email, password: "Passw0rd!123", username: `ui_${ts}`, first_name: "UI",
        last_name: "Test", phone: "9999999995", age: 30, address: "1 Ui Ln",
        city: "Indore", pincode: "452001" },
    });
    const login = await apiNode("POST", "/api/auth/login", { body: { email, password: "Passw0rd!123" } });
    const token = login.json?.data?.token || login.json?.data?.user?.token;
    rec(`[1] token=${!!token}`);
    await apiNode("POST", "/api/cart/add", { token, body: { product_id: 19, quantity: 1 } });
    rec(`[2] server cart: 1x 2M 4Touch (base ₹1000, SAVE10 min 999 → eligible)`);

    const targets = await launchChrome({ port: 9226 });
    const { client } = await attachToPage(targets, { urlRe: /localhost:5173/ });
    await client.send("Page.navigate", { url: "http://localhost:5173/" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(3000);
    await evalJs(client, `(() => { localStorage.setItem('authToken', ${JSON.stringify(token)});
      localStorage.setItem('user', JSON.stringify({ id: null, email: ${JSON.stringify(email)} })); return true; })();`);

    const netTraffic = [];
    client.on("Network.responseReceived", (p) => {
      const u = (p.response && p.response.url) || "";
      if (/\/api\/coupons\//.test(u)) netTraffic.push({ url: u, status: p.response.status, requestId: p.requestId });
    });
    client.on("Network.loadingFinished", async (p) => {
      const hit = netTraffic.find((n) => n.requestId === p.requestId);
      if (hit && hit.body === undefined) {
        try { const { body } = await client.send("Network.getResponseBody", { requestId: p.requestId }); hit.body = body; } catch {}
      }
    });

    await client.send("Page.navigate", { url: "http://localhost:5173/checkout" });
    await sleep(6000);

    const regionText = await evalJs(client, `
      (() => {
        const all = Array.from(document.querySelectorAll('*')).filter(e =>
          e.children.length===0 && /Available Offers|Locked|Add ₹|more to unlock|not applicable|promo code|Coupon applied|You save/i.test(e.textContent||''));
        return all.map(e => e.textContent.trim()).slice(0, 80);
      })();
    `);
    rec(`[3] coupon section text: ${JSON.stringify(regionText)}`);

    const applyBtns = await evalJs(client, `
      (() => Array.from(document.querySelectorAll('[aria-label^="Apply coupon"]')).map(b=>b.getAttribute('aria-label')))();
    `);
    rec(`[4] apply buttons: ${JSON.stringify(applyBtns)}`);

    require("./browser-e2e-part2.js").run({ client, netTraffic, rec }).then(() => {
      netTraffic.forEach((n) => rec(`[net] ${n.status} ${n.url} ${(n.body||'').slice(0,300)}`));
      client.close();
      shutdownChrome().then(() => process.exit(0));
    }).catch((e) => { console.error("PART2 ERR", e.message); client.close(); shutdownChrome().then(()=>process.exit(1)); });
  } catch (e) { console.error("E2E ERROR:", e && e.message); console.error(e && e.stack); await shutdownChrome(); }
})();