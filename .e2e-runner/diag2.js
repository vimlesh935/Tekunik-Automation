const { launchChrome, attachToPage, evalJs, waitFor, shutdownChrome, sleep } = require("./cdp");
const API = "http://localhost:8787";
const fs = require("node:fs");
const OUT = "diag2.out.txt";
const log = (m) => { console.log(m); fs.appendFileSync(OUT, m + "\n"); };
const apiNode = async (m, p, { token, body } = {}) => {
  const r = await fetch(`${API}${p}`, { method: m, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
(async () => {
  const ts = Date.now(); const email = `d2.${ts}@teknode.test`;
  try {
    await apiNode("POST", "/api/auth/register", { body: { email, password: "Passw0rd!123", username: `d2_${ts}`, first_name: "D2", last_name: "T", phone: "9999999991", age: 30, address: "1 D", city: "Indore", pincode: "452001" } });
    const login = await apiNode("POST", "/api/auth/login", { body: { email, password: "Passw0rd!123" } });
    const token = login.json?.data?.token;
    await apiNode("POST", "/api/cart/add", { token, body: { product_id: 19, quantity: 1 } });
    // Direct API: what does available return for this server cart (base 1000)?
    const avail = await apiNode("GET", "/api/coupons/available", { token });
    const list = avail.json?.data?.coupons || [];
    log(`[api] available count=${list.length}`);
    const sav = list.find(c=>c.code==='SAVE10');
    log(`[api] SAVE10 card: ${JSON.stringify(sav)}`);
    log(`[api] first3: ${JSON.stringify(list.slice(0,3).map(c=>({code:c.code,elig:c.eligible,lock:!!c.locked,reason:c.reasonCode,short:c.shortfall})))}`);

    const targets = await launchChrome({ port: 9232 });
    const { client } = await attachToPage(targets);
    const net = [];
    client.on("Network.responseReceived", (p) => { const u=(p.response&&p.response.url)||""; if(/coupons\/available/.test(u)) net.push({url:u,status:p.response.status,id:p.requestId}); });
    client.on("Network.loadingFinished", async (p) => { const h=net.find(n=>n.id===p.requestId); if(h && h.body===undefined){ try{ const b=await client.send("Network.getResponseBody",{requestId:p.requestId}); h.body=b.body; }catch{} } });
    await client.send("Page.navigate", { url: "http://localhost:5173/" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(2500);
    await evalJs(client, `(() => { localStorage.setItem('authToken', ${JSON.stringify(token)}); localStorage.removeItem('teknode_guest_cart'); return true; })();`);
    await client.send("Page.navigate", { url: "http://localhost:5173/checkout" });
    await sleep(6000);
    const netDone = await sleep(800);
    const region = await evalJs(client, `(() => {
      const imgs=[];
      const apply=[], copy=[], locked=[];
      document.querySelectorAll('[aria-label^="Apply coupon"]').forEach(b=>apply.push(b.getAttribute('aria-label')));
      document.querySelectorAll('[aria-label^="Copy coupon code"]').forEach(b=>copy.push(b.getAttribute('aria-label')));
      document.querySelectorAll('button,span').forEach(e=>{ if(/Locked/i.test(e.textContent||'') && e.children.length===0) locked.push(e.textContent.trim()); });
      return { apply, copy, locked: [...new Set(locked)].slice(0,10) };
    })();`);
    log(`[dom] ${JSON.stringify(region)}`);
    net.forEach(n=>log(`[net] ${n.status} ${n.url} ${(n.body||'').slice(0,400)}`));
    client.close();
  } catch (e) { log("ERR: "+e.message); }
  try { await shutdownChrome(); } catch {}
  process.exit(0);
})();