const { launchChrome, attachToPage, evalJs, waitFor, shutdownChrome, sleep } = require("./cdp");
const API = "http://localhost:8787";
const fs = require("node:fs");
const OUT = "final2.out.txt";
const log = (m) => { console.log(m); fs.appendFileSync(OUT, m + "\n"); };
const apiNode = async (m, p, { token, body } = {}) => {
  const r = await fetch(`${API}${p}`, { method: m, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
const poll = async (client, expr, timeout, iv = 800) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    try { const v = await evalJs(client, expr); if (v) return v; } catch {}
    await sleep(iv);
  }
  return null;
};
(async () => {
  const ts = Date.now(); const email = `f2.${ts}@teknode.test`;
  try {
    await apiNode("POST", "/api/auth/register", { body: { email, password: "Passw0rd!123", username: `f2_${ts}`, first_name: "F2", last_name: "T", phone: "9999999993", age: 30, address: "1 F", city: "Indore", pincode: "452001" } });
    const login = await apiNode("POST", "/api/auth/login", { body: { email, password: "Passw0rd!123" } });
    const token = login.json?.data?.token;
    await apiNode("POST", "/api/cart/add", { token, body: { product_id: 19, quantity: 12 } });
    log("[1] user + server cart 12x prod19 (base 12000)");

    const targets = await launchChrome({ port: 9235 });
    const { client } = await attachToPage(targets);
    await client.send("Page.navigate", { url: "http://localhost:5173/" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(2000);
    await evalJs(client, `(() => { localStorage.setItem('authToken', ${JSON.stringify(token)}); localStorage.removeItem('teknode_guest_cart'); return true; })();`);
    await client.send("Page.navigate", { url: "http://localhost:5173/checkout" });

    const btn = await poll(client, `(() => { const b=document.querySelector('[aria-label="Apply coupon SAVE10"]'); return b ? b.getAttribute('aria-label') : null; })()`, 40000);
    log(`[2] SAVE10 apply button after poll: ${JSON.stringify(btn)}`);
    const cards = await evalJs(client, `(() => Array.from(document.querySelectorAll('[aria-label^="Apply coupon"]')).map(b=>b.getAttribute('aria-label')))();`);
    log(`[3] apply buttons: ${JSON.stringify(cards)}`);

    if (btn) {
      await evalJs(client, `(() => { document.querySelector('[aria-label="Apply coupon SAVE10"]').click(); return true; })();`);
      // Wait specifically for the APPLIED state (Remove Coupon exists only when a coupon is applied)
      const appliedRow = await poll(client, `(() => { const b=Array.from(document.querySelectorAll('button')).find(x=>/Remove Coupon/i.test(x.textContent)); return b ? true : null; })()`, 20000);
      log(`[4] Remove-Coupon appeared (applied)= ${JSON.stringify(appliedRow)}`);
      const after = await evalJs(client, `(() => {
        const t = Array.from(document.querySelectorAll('*')).filter(e=>e.children.length===0 && /Coupon applied|You save|Coupon \\(|Remove Coupon/i.test(e.textContent||'')).map(e=>e.textContent.trim());
        const totalM = document.body.innerText.match(/Total Amount[\\s\\S]{0,30}/);
        return { text: [...new Set(t)].slice(0,12), total: totalM ? totalM[0] : null };
      })();`);
      log(`[5] after apply: ${JSON.stringify(after)}`);
      if (appliedRow) {
        // Remove coupon → UI should revert to promo input
        await evalJs(client, `(() => { const b=Array.from(document.querySelectorAll('button')).find(x=>/Remove Coupon/i.test(x.textContent)); if(b)b.click(); return !!b; })();`);
        const reverted = await poll(client, `/Have a promo code/i.test(document.body.innerText)`, 15000);
        log(`[6] after remove, promo input back: ${JSON.stringify(reverted)}`);
      }
    }
    client.close();
  } catch (e) { log("ERR: " + e.message); }
  try { await shutdownChrome(); } catch {}
  process.exit(0);
})();