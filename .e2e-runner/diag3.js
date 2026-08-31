const { launchChrome, attachToPage, evalJs, waitFor, shutdownChrome, sleep, CDP } = require("./cdp");
const API = "http://localhost:8787";
const fs = require("node:fs");
const OUT = "diag3.out.txt";
const log = (m) => { console.log(m); fs.appendFileSync(OUT, m + "\n"); };
const apiNode = async (m, p, { token, body } = {}) => {
  const r = await fetch(`${API}${p}`, { method: m, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
(async () => {
  const ts = Date.now(); const email = `d3.${ts}@teknode.test`;
  try {
    await apiNode("POST", "/api/auth/register", { body: { email, password: "Passw0rd!123", username: `d3_${ts}`, first_name: "D3", last_name: "T", phone: "9999999992", age: 30, address: "1 D", city: "Indore", pincode: "452001" } });
    const login = await apiNode("POST", "/api/auth/login", { body: { email, password: "Passw0rd!123" } });
    const token = login.json?.data?.token;
    await apiNode("POST", "/api/cart/add", { token, body: { product_id: 19, quantity: 1 } });

    const targets = await launchChrome({ port: 9233 });
    const { client } = await attachToPage(targets);
    const consoleMsgs = [];
    client.on("Runtime.consoleAPICalled", (p) => { consoleMsgs.push(`console.${p.type}: ${(p.args||[]).map(a=>a.value||a.description||a.type).join(' ')}`.slice(0,300)); });
    client.on("Runtime.exceptionThrown", (p) => { consoleMsgs.push("EXC: " + (p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || "").slice(0,300)); });
    await client.send("Page.navigate", { url: "http://localhost:5173/" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(2500);
    await evalJs(client, `(() => { localStorage.setItem('authToken', ${JSON.stringify(token)}); return true; })();`);
    await client.send("Page.navigate", { url: "http://localhost:5173/checkout" });
    await sleep(6000);

    // Manually fetch available from within the page (same-origin proxy)
    const manualFetch = await evalJs(client, `(async () => {
      try {
        const r = await fetch('/api/coupons/available', { headers: { Authorization: 'Bearer ' + localStorage.getItem('authToken') } });
        let body = null; try { body = await r.json(); } catch {}
        return { status: r.status, ok: r.ok, count: body?.data?.coupons?.length, first: body?.data?.coupons?.[0]?.code, save10: body?.data?.coupons?.find(c=>c.code==='SAVE10') };
      } catch(e) { return { err: e.message }; }
    })();`);
    log(`[manual avail] ${JSON.stringify(manualFetch)}`);

    // Now re-trigger React load by reading current coupon region
    const region = await evalJs(client, `(() => {
      const t = Array.from(document.querySelectorAll('*')).filter(e=>e.children.length===0 && /SAVE10|FLAT200|Locked|no coupons available|Available Offers/i.test(e.textContent||'')).map(e=>e.textContent.trim());
      return [...new Set(t)].slice(0,15);
    })();`);
    log(`[region] ${JSON.stringify(region)}`);
    const hasEmptyMsg = await evalJs(client, `/No coupons available/i.test(document.body.innerText)`);
    log(`[hasEmptyMsg] ${hasEmptyMsg}`);
    const consoles = consoleMsgs.filter(m => /coupon|available|checkout|err/i.test(m)).slice(0,15);
    log(`[console] ${JSON.stringify(consoles)}`);
    client.close();
  } catch (e) { log("ERR: " + e.message); }
  try { await shutdownChrome(); } catch {}
  process.exit(0);
})();