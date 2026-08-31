const { launchChrome, attachToPage, evalJs, waitFor, shutdownChrome, sleep } = require("./cdp");
const API = "http://localhost:8787";
const fs = require("node:fs");
const OUT = "diag-total.out.txt";
const log = (m) => { console.log(m); fs.appendFileSync(OUT, m + "\n"); };
const apiNode = async (m, p, { token, body } = {}) => {
  const r = await fetch(`${API}${p}`, { method: m, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
const poll = async (client, expr, timeout, iv = 800) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) { try { const v = await evalJs(client, expr); if (v) return v; } catch {} await sleep(iv); }
  return null;
};
(async () => {
  const ts = Date.now();
  fs.writeFileSync(OUT, `\n=== Total diag ${ts} ===\n`);
  try {
    const email = `td.${ts}@teknode.test`;
    await apiNode("POST", "/api/auth/register", { body: { email, password: "Passw0rd!123", username: `td_${ts}`, first_name: "T", last_name: "D", phone: "9999999993", age: 30, address: "1 T", city: "Indore", pincode: "452001" } });
    const login = await apiNode("POST", "/api/auth/login", { body: { email, password: "Passw0rd!123" } });
    const token = login.json?.data?.token;
    await apiNode("POST", "/api/cart/add", { token, body: { product_id: 19, quantity: 6 } });

    const targets = await launchChrome({ port: 9246 });
    const { client } = await attachToPage(targets);
    await client.send("Page.navigate", { url: "http://localhost:5173/" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(1500);
    await evalJs(client, `(() => { localStorage.setItem('authToken', ${JSON.stringify(token)}); localStorage.removeItem('teknode_guest_cart'); return true; })();`);
    await client.send("Page.navigate", { url: "http://localhost:5173/checkout" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(6000);

    const applyBtn = await poll(client, `(() => { const b = document.querySelector('[aria-label="Apply coupon SAVE10"]'); return b ? true : null; })()`, 30000);
    log("applyBtn=" + applyBtn);
    if (applyBtn) {
      await evalJs(client, `(() => { document.querySelector('[aria-label="Apply coupon SAVE10"]').click(); return true; })();`);
      await poll(client, `(() => Array.from(document.querySelectorAll('button')).some(x=>/Remove Coupon/i.test(x.textContent)))`, 20000);
      await sleep(2500);
    }
    const lines = await evalJs(client, `(() => {
      const txt = document.body.innerText.split('\\n');
      const out = [];
      txt.forEach((l, i) => { if (/Total Amount|Coupon \\(SAVE10\\)|You Save|Subtotal/i.test(l)) { out.push({ i, l, next: txt.slice(i, i+3) }); } });
      return out;
    })()`);
    log("lines=" + JSON.stringify(lines, null, 1));
    const net = await evalJs(client, `(async () => {
      const r = await fetch('/api/coupons/totals', { headers: { Authorization: 'Bearer ' + localStorage.getItem('authToken') } });
      let j = null; try { j = await r.json(); } catch {}
      return { status: r.status, data: j && j.data ? { couponCode: j.data.couponCode, discount: j.data.discount, totalAmount: j.data.totalAmount } : null };
    })()`);
    log("totals_api=" + JSON.stringify(net));
    client.close();
  } catch (e) { log("ERR: " + e.message); }
  try { await shutdownChrome(); } catch {}
  process.exit(0);
})();