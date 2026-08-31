const { launchChrome, attachToPage, evalJs, waitFor, shutdownChrome, sleep } = require("./cdp");
const API = "http://localhost:8787";
const fs = require("node:fs");
const OUT = "repro-ui.out.txt";
const log = (m) => { console.log(m); fs.appendFileSync(OUT, m + "\n"); };
const apiNode = async (m, p, { token, body } = {}) => {
  const r = await fetch(`${API}${p}`, { method: m, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
(async () => {
  const ts = Date.now(); const email = `rx.${ts}@teknode.test`;
  try {
    await apiNode("POST", "/api/auth/register", { body: { email, password: "Passw0rd!123", username: `rx_${ts}`, first_name: "RX", last_name: "T", phone: "9999999997", age: 30, address: "1 Rx Ln", city: "Indore", pincode: "452001" } });
    const login = await apiNode("POST", "/api/auth/login", { body: { email, password: "Passw0rd!123" } });
    const token = login.json?.data?.token;
    log(`[1] token=${!!token}`);
    await apiNode("POST", "/api/cart/add", { token, body: { product_id: 19, quantity: 1 } });
    log("[2] server cart: 1x prod19");
    const targets = await launchChrome({ port: 9229 });
    log("[3] chrome launched");
    const { client } = await attachToPage(targets);
    await client.send("Page.navigate", { url: "http://localhost:5173/checkout" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(2500);
    await evalJs(client, `(() => {
      localStorage.setItem('authToken', ${JSON.stringify(token)});
      localStorage.setItem('teknode_guest_cart', JSON.stringify([{ product_id:19, name:'2M 4Touch', price:500, original_price:1000, final_price:500, quantity:1, image_url:'/uploads/products/x.jpg' }]));
      return true; })();`);
    log("[4] seeded token+guest cart");
    await client.send("Page.navigate", { url: "http://localhost:5173/checkout" });
    await sleep(4000);
    const pageText = await evalJs(client, "document.body.innerText");
    log(`[5] emptyState=${pageText.includes("Your Cart is Empty")} hasCoupon=${/Available Offers|promo code/i.test(pageText)}`);
    const cardStates = await evalJs(client, `(() => {
      const out = {};
      document.querySelectorAll('[aria-label^="Apply coupon"]').forEach(b => out[b.getAttribute('aria-label').replace('Apply coupon ','')] = 'APPLY');
      document.querySelectorAll('[aria-label^="Copy coupon code"]').forEach(b => { const c=b.getAttribute('aria-label').replace('Copy coupon code ',''); out[c] = out[c] || 'CARD'; });
      return out;
    })();`);
    log(`[6] cards: ${JSON.stringify(cardStates)}`);
    const applyRes = await evalJs(client, `(() => { const b=document.querySelector('[aria-label="Apply coupon SAVE10"]'); if(!b) return {clicked:false}; b.click(); return {clicked:true}; })();`);
    log(`[7] click SAVE10: ${JSON.stringify(applyRes)}`);
    await sleep(2500);
    const after = await evalJs(client, `(() => {
      const t = Array.from(document.querySelectorAll('*')).filter(e=>e.children.length===0 && /Coupon applied|not found|not applicable|Unable|You save|Locked|Add .* more/i.test(e.textContent||'')).map(e=>e.textContent.trim());
      return [...new Set(t)].slice(0,20);
    })();`);
    log(`[8] after SAVE10: ${JSON.stringify(after)}`);
    client.close();
  } catch (e) { log("ERR: " + e.message); }
  try { await shutdownChrome(); } catch {}
  process.exit(0);
})();