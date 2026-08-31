const { launchChrome, attachToPage, evalJs, waitFor, shutdownChrome, sleep } = require("./cdp");
const API = "http://localhost:8787";
const fs = require("node:fs");
const OUT = "final-ui.out.txt";
const log = (m) => { console.log(m); fs.appendFileSync(OUT, m + "\n"); };
const apiNode = async (m, p, { token, body } = {}) => {
  const r = await fetch(`${API}${p}`, { method: m, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
(async () => {
  const ts = Date.now(); const email = `fu.${ts}@teknode.test`;
  try {
    await apiNode("POST", "/api/auth/register", { body: { email, password: "Passw0rd!123", username: `fu_${ts}`, first_name: "F", last_name: "T", phone: "9999999999", age: 30, address: "1 F Ln", city: "Indore", pincode: "452001" } });
    const login = await apiNode("POST", "/api/auth/login", { body: { email, password: "Passw0rd!123" } });
    const token = login.json?.data?.token;
    await apiNode("POST", "/api/cart/add", { token, body: { product_id: 19, quantity: 1 } });
    log(`[1] logged in + added 1x prod19 (base ₹1000) to SERVER cart, token=${!!token}`);

    const targets = await launchChrome({ port: 9231 });
    const { client } = await attachToPage(targets);
    await client.send("Page.navigate", { url: "http://localhost:5173/" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(2500);
    // Set ONLY the auth token (no guest cart). Then HARD navigate to /checkout.
    await evalJs(client, `(() => { localStorage.setItem('authToken', ${JSON.stringify(token)}); localStorage.removeItem('teknode_guest_cart'); return true; })();`);
    await client.send("Page.navigate", { url: "http://localhost:5173/checkout" });
    await sleep(6000);

    const pageText = await evalJs(client, "document.body.innerText");
    log(`[2] emptyState=${pageText.includes("Your Cart is Empty")}`);
    log(`[3] hasServerCartItem=${/2M 4Touch/i.test(pageText)}`);
    log(`[4] hasCouponSection=${/Available Offers/i.test(pageText)}`);
    const cardStates = await evalJs(client, `(() => {
      const out = {};
      document.querySelectorAll('[aria-label^="Apply coupon"]').forEach(b => out[b.getAttribute('aria-label').replace('Apply coupon ','')] = 'APPLY');
      document.querySelectorAll('[aria-label^="Copy coupon code"]').forEach(b => { const c=b.getAttribute('aria-label').replace('Copy coupon code ',''); out[c] = out[c] || 'CARD'; });
      return out;
    })();`);
    log(`[5] cards: ${JSON.stringify(cardStates)}`);

    // Click Apply on SAVE10 (SAVE10 min=999, cart=1000 → eligible)
    const clickRes = await evalJs(client, `(() => { const b=document.querySelector('[aria-label="Apply coupon SAVE10"]'); if(!b) return {clicked:false}; b.click(); return {clicked:true}; })();`);
    log(`[6] click SAVE10: ${JSON.stringify(clickRes)}`);
    await sleep(2500);
    const after = await evalJs(client, `(() => {
      const t = Array.from(document.querySelectorAll('*')).filter(e=>e.children.length===0 && /Coupon applied|not found|not applicable|cannot be applied|Unable|You save|Locked|Add .* more|is not active|expired/i.test(e.textContent||'')).map(e=>e.textContent.trim());
      return [...new Set(t)].slice(0,20);
    })();`);
    log(`[7] after SAVE10 apply: ${JSON.stringify(after)}`);
    const totalLine = await evalJs(client, `(() => { const m = document.body.innerText.match(/Total Amount[\\s\\S]{0,30}/); return m ? m[0] : null; })();`);
    log(`[8] total line: ${JSON.stringify(totalLine)}`);
    client.close();
  } catch (e) { log("ERR: " + e.message); if (e.stack) log(e.stack.split("\n")[0]); }
  try { await shutdownChrome(); } catch {}
  process.exit(0);
})();