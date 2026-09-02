/* Browser E2E v6 — remaining cases: TEST 10 refresh persistence, TEST 4 invalid, TEST 2 empty.
 * Re-attaches CDP after reload; every evalJs wrapped with a hard timeout. */
const { launchChrome, attachToPage, evalJs, waitFor, shutdownChrome, sleep } = require("./cdp");
const API = "http://localhost:8787";
const fs = require("node:fs");
const OUT = "browser-test6.out.txt";
let pass = 0, fail = 0;
const log = (m) => { console.log(m); fs.appendFileSync(OUT, m + "\n"); };
const check = (label, ok, detail) => { const tag = ok ? "PASS" : "FAIL"; ok ? pass++ : fail++; log(`[${tag}] ${label} — ${detail}`); };
const withTimeout = (p, ms, label) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout:${label}`)), ms))]);
const safeEval = async (client, expr, ms = 8000) => withTimeout(evalJs(client, expr), ms, "eval");
const apiNode = async (method, url, { token, body } = {}) => {
  const r = await fetch(`${API}${url}`, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
const SET_INPUT = (val) => `(() => { const i=document.querySelector('input[aria-label="Coupon code"]'); if(!i) return false; const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; s.call(i, ${JSON.stringify(val)}); i.dispatchEvent(new Event('input',{bubbles:true})); return true; })()`;
const CLICK_APPLY = `(() => { const i=document.querySelector('input[aria-label="Coupon code"]'); if(!i) return false; const b=i.parentElement.querySelector('button'); if(b){b.click(); return true;} return false; })()`;
const poll = async (client, expr, timeout, iv = 800) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) { try { const v = await safeEval(client, expr, 5000); if (v) return v; } catch {} await sleep(iv); }
  return null;
};
const pollText = (client, pattern, timeout) => poll(client, `(() => { const m = document.body.innerText.match(${pattern}); return m ? m[0].replace(/\\s+/g,' ').slice(0,120) : null; })()`, timeout);

(async () => {
  const ts = Date.now();
  fs.writeFileSync(OUT, `\n=== Browser E2E v6 (refresh/invalid/empty) ${ts} ===\n`);
  try {
    const email = `btv6.${ts}@teknode.test`;
    await apiNode("POST", "/api/auth/register", { body: { email, password: "Passw0rd!123", username: `btv6_${ts}`, first_name: "B", last_name: "T", phone: "9999999997", age: 30, address: "1 F", city: "Indore", pincode: "452001" } });
    const login = await apiNode("POST", "/api/auth/login", { body: { email, password: "Passw0rd!123" } });
    const token = login.json?.data?.token;
    await apiNode("POST", "/api/cart/add", { token, body: { product_id: 19, quantity: 1 } });
    check("Setup - fresh user + cart", !!token, `token=${!!token}`);

    const targets = await launchChrome({ port: 9253 });
    let { client } = await attachToPage(targets);

    await client.send("Page.navigate", { url: "http://localhost:5173/" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(1500);
    await safeEval(client, `(() => { localStorage.setItem('authToken', ${JSON.stringify(token)}); localStorage.removeItem('teknode_guest_cart'); return true; })();`);
    await client.send("Page.navigate", { url: "http://localhost:5173/checkout" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(6000);

    const hasBox = await poll(client, `(() => !!document.querySelector('input[aria-label="Coupon code"]'))()`, 30000);
    check("TEST 1 - Coupon input visible", !!hasBox, `visible=${!!hasBox}`);

    // Apply SAVE20
    await safeEval(client, SET_INPUT("SAVE20"));
    await sleep(600);
    await safeEval(client, CLICK_APPLY);
    const okMsg = await pollText(client, `/Coupon applied successfully/`, 20000);
    check("TEST 3 - SAVE20 applied", !!okMsg, okMsg || "no success message");

    // TEST 10 — refresh persistence (re-attach after reload)
    await client.send("Page.reload").catch(() => {});
    await sleep(6000);
    try { const t2 = await attachToPage(targets); if (t2 && t2.client) client = t2.client; } catch {}
    const persisted = await pollText(client, `/Coupon applied[\\s\\S]{0,80}SAVE20|SAVE20[\\s\\S]{0,80}Coupon applied|Coupon \\(SAVE20\\)/`, 20000);
    check("TEST 10 - Coupon persists after refresh", !!persisted, persisted || "not persisted");

    // Remove for clean state
    const rm = await safeEval(client, `(() => { const b=Array.from(document.querySelectorAll('button')).find(x=>/^Remove Coupon$/i.test(x.textContent.trim())); if(b){b.click(); return true;} return false; })()`);
    await sleep(2000);
    check("TEST 7 - Remove coupon", !!rm, `rm=${rm}`);

    // TEST 4 — invalid coupon
    await safeEval(client, SET_INPUT("INVALIDXYZ999"));
    await sleep(500);
    await safeEval(client, CLICK_APPLY);
    const inv = await pollText(client, `/Invalid coupon code/`, 15000);
    check("TEST 4 - INVALIDXYZ999 -> 'Invalid coupon code'", !!inv, inv || "no error shown");

    // TEST 2 — empty apply
    await safeEval(client, SET_INPUT(""));
    await sleep(400);
    await safeEval(client, CLICK_APPLY);
    const emptyMsg = await pollText(client, `/Please enter a coupon code/`, 8000);
    check("TEST 2 - Empty input -> 'Please enter a coupon code'", !!emptyMsg, emptyMsg || "no message");
  } catch (e) {
    log("ERR: " + e.message);
  } finally {
    try { await shutdownChrome(); } catch {}
    log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
  }
  process.exit(fail ? 1 : 0);
})();