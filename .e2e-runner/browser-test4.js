/* Browser E2E v4 — inline coupon status messages + mobile viewport.
 * Covers:
 *   - Coupon section visible on checkout
 *   - Empty input  -> inline "Please enter a coupon code"
 *   - Invalid code -> inline "Invalid coupon code"
 *   - Mobile 390px viewport: no horizontal overflow, input + APPLY usable
 *   - Valid coupon SAVE10 applies, Remove restores input, offer math intact
 */
const { launchChrome, attachToPage, evalJs, waitFor, shutdownChrome, sleep } = require("./cdp");
const API = "http://localhost:8787";
const fs = require("node:fs");
const OUT = "browser-test4.out.txt";
let pass = 0, fail = 0;
const log = (m) => { console.log(m); fs.appendFileSync(OUT, m + "\n"); };
const check = (label, ok, detail) => { const tag = ok ? "PASS" : "FAIL"; ok ? pass++ : fail++; log(`[${tag}] ${label} — ${detail}`); };
const apiNode = async (method, url, { token, body } = {}) => {
  const r = await fetch(`${API}${url}`, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
const poll = async (client, expr, timeout, iv = 700) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) { try { const v = await evalJs(client, expr); if (v) return v; } catch {} await sleep(iv); }
  return null;
};
const pollText = (client, pattern, timeout) => poll(client, `(() => { const m = document.body.innerText.match(${pattern}); return m ? m[0].replace(/\\s+/g,' ').slice(0,120) : null; })()`, timeout);
const SET_INPUT = (val) => `(() => { const i=document.querySelector('input[aria-label="Coupon code"], input[placeholder="Enter coupon code"]'); if(!i) return false; const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; s.call(i, ${JSON.stringify(val)}); i.dispatchEvent(new Event('input',{bubbles:true})); return true; })()`;
const CLICK_APPLY = `(() => { const btn=Array.from(document.querySelectorAll('button')).find(x=>/APPLY|Apply/.test(x.textContent) && !x.querySelector('svg') && !x.closest('[aria-label^="Apply coupon"]') && !x.disabled); if(btn){btn.click(); return true;} return false; })()`;

(async () => {
  const ts = Date.now();
  fs.writeFileSync(OUT, `\n=== Browser E2E v4 ${ts} ===\n`);
  let token;
  try {
    const email = `btv4.${ts}@teknode.test`;
    await apiNode("POST", "/api/auth/register", { body: { email, password: "Passw0rd!123", username: `btv4_${ts}`, first_name: "B", last_name: "T", phone: "9999999996", age: 30, address: "4 M", city: "Indore", pincode: "452001" } });
    const login = await apiNode("POST", "/api/auth/login", { body: { email, password: "Passw0rd!123" } });
    token = login.json?.data?.token;
    await apiNode("POST", "/api/cart/add", { token, body: { product_id: 19, quantity: 6 } });
    check("Setup - user + cart (6x product 19 = 6000)", !!token);

    const targets = await launchChrome({ port: 9252 });
    const { client } = await attachToPage(targets);
    // ── MOBILE viewport (390 x 844) ──────────────────────────────────
    await client.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await client.send("Page.navigate", { url: "http://localhost:5173/" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(1500);
    await evalJs(client, `(() => { localStorage.setItem('authToken', ${JSON.stringify(token)}); localStorage.removeItem('teknode_guest_cart'); return true; })();`);
    await client.send("Page.navigate", { url: "http://localhost:5173/checkout" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(6000);

    // TEST 1 — coupon section visible on mobile
    const heading = await pollText(client, /Have a promo code\?/i, 30000);
    check("TEST 1 - Coupon section visible on mobile", !!heading, heading || "no heading");

    // TEST 2 — no horizontal overflow on mobile
    const overflow = await evalJs(client, `(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }))()`);
    check("TEST 2 - No horizontal scroll (mobile)", Number(overflow.sw) <= Number(overflow.iw) + 1, `scrollWidth=${overflow.sw} innerWidth=${overflow.iw}`);

    // TEST 3 — input + APPLY accessible on mobile
    const inputOk = await poll(client, `(() => { const i=document.querySelector('input[aria-label="Coupon code"], input[placeholder="Enter coupon code"]'); return !!(i && i.offsetParent); })()`, 15000);
    check("TEST 3 - Coupon input visible/tappable on mobile", !!inputOk, inputOk ? "input visible" : "input NOT visible");

    // TEST 4 — empty input -> inline "Please enter a coupon code"
    await evalJs(client, SET_INPUT(""));
    await evalJs(client, CLICK_APPLY);
    let msg = await pollText(client, /Please enter a coupon code/, 8000);
    check("TEST 4 - Empty input shows 'Please enter a coupon code'", !!msg, msg || "no message");
    const msgEl = await poll(client, `(() => { const m=document.querySelector('[data-testid="coupon-status-message"]'); return m ? m.textContent.trim() : null; })()`, 5000);
    check("TEST 4b - Message is inline (below input)", !!msgEl && /Please enter a coupon code/.test(msgEl), msgEl || "no inline el");

    // TEST 5 — invalid code -> inline "Invalid coupon code"
    await evalJs(client, SET_INPUT("WRONG123"));
    await evalJs(client, CLICK_APPLY);
    msg = await pollText(client, /Invalid coupon code/, 15000);
    check("TEST 5 - Invalid coupon shows 'Invalid coupon code'", !!msg, msg || "no message");

    // TEST 7 — valid coupon applies on mobile (SAVE10 on product 19 x6 => capped 500)
    await evalJs(client, SET_INPUT("SAVE10"));
    await evalJs(client, CLICK_APPLY);
    const appliedBox = await poll(client, `(() => Array.from(document.querySelectorAll('button')).some(x=>/Remove Coupon/i.test(x.textContent)))()`, 20000);
    check("TEST 7 - SAVE10 applied (Remove Coupon appears)", !!appliedBox, appliedBox ? "found" : "NOT found");
    const saveTxt = await pollText(client, /You save ₹500\.00/i, 15000);
    check("TEST 7b - 'You save ₹500.00' on page", !!saveTxt, saveTxt || "no save text");

    // TEST 8 — total math rendered (offer + coupon combined)
    const totalNow = await pollText(client, /Total Amount ₹[\d,]+\.00/i, 15000);
    check("TEST 8 - Total Amount rendered on mobile", !!totalNow, totalNow || "no total");

    // TEST 9 — Remove coupon restores input
    await evalJs(client, `(() => { const b=Array.from(document.querySelectorAll('button')).find(x=>/Remove Coupon/i.test(x.textContent)); if(b){b.click(); return true;} return false; })()`);
    const inputBack = await poll(client, `(() => { const i=document.querySelector('input[aria-label="Coupon code"]'); return !!(i && i.offsetParent); })()`, 15000);
    check("TEST 9 - Promo input restored after Remove (mobile)", !!inputBack, inputBack ? "yes" : "no");

    // TEST 10 — user-friendly error (toast or inline) for a bogus code
    await evalJs(client, SET_INPUT("DOESNOTEXIST123"));
    await evalJs(client, CLICK_APPLY);
    const toastMsg = await pollText(client, /Coupon not found|Invalid coupon code/, 15000);
    check("TEST 10 - User-friendly error shown (toast or inline)", !!toastMsg, toastMsg || "no error text");

  } catch (error) {
    fail += 1;
    log(`\n💥 UNEXPECTED ERROR: ${error.message}`);
    try { log(error.stack); } catch {}
  } finally {
    log(`\n${"=".repeat(58)}`);
    log(`Browser E2E v4 RESULT  PASS=${pass} FAIL=${fail}`);
    log("=".repeat(58));
    try { await shutdownChrome(); } catch {}
    process.exit(fail > 0 ? 1 : 0);
  }
})();