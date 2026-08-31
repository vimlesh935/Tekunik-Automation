/* Browser E2E v3 — hardened: poll-based assertions + React-native input setting. */
const { launchChrome, attachToPage, evalJs, waitFor, shutdownChrome, sleep } = require("./cdp");
const API = "http://localhost:8787";
const fs = require("node:fs");
const OUT = "browser-test3.out.txt";
let pass = 0, fail = 0;
const log = (m) => { console.log(m); fs.appendFileSync(OUT, m + "\n"); };
const check = (label, ok, detail) => { const tag = ok ? "PASS" : "FAIL"; ok ? pass++ : fail++; log(`[${tag}] ${label} — ${detail}`); };
const apiNode = async (method, url, { token, body } = {}) => {
  const r = await fetch(`${API}${url}`, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
const poll = async (client, expr, timeout, iv = 800) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) { try { const v = await evalJs(client, expr); if (v) return v; } catch {} await sleep(iv); }
  return null;
};
const pollText = (client, pattern, timeout) => poll(client, `(() => { const m = document.body.innerText.match(${pattern}); return m ? m[0].replace(/\\s+/g,' ').slice(0,90) : null; })()`, timeout);
const SET_INPUT = (val) => `(() => { const i=document.querySelector('input[placeholder="Enter coupon code"]'); if(!i) return false; const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; s.call(i, ${JSON.stringify(val)}); i.dispatchEvent(new Event('input',{bubbles:true})); return true; })()`;
const CLICK_APPLY = `(() => { const btn=Array.from(document.querySelectorAll('button')).find(x=>/Apply/i.test(x.textContent) && !x.querySelector('svg')); if(btn){btn.click();} return true; })()`;

(async () => {
  const ts = Date.now();
  fs.writeFileSync(OUT, `\n=== Browser E2E v3 ${ts} ===\n`);
  let token;
  try {
    const email = `btv3.${ts}@teknode.test`;
    await apiNode("POST", "/api/auth/register", { body: { email, password: "Passw0rd!123", username: `btv3_${ts}`, first_name: "B", last_name: "T", phone: "9999999997", age: 30, address: "1 F", city: "Indore", pincode: "452001" } });
    const login = await apiNode("POST", "/api/auth/login", { body: { email, password: "Passw0rd!123" } });
    token = login.json?.data?.token;
    await apiNode("POST", "/api/cart/add", { token, body: { product_id: 19, quantity: 6 } });
    check("Setup - user + cart (6x product 19 = 6000)", !!token);

    const targets = await launchChrome({ port: 9248 });
    const { client } = await attachToPage(targets);
    await client.send("Page.navigate", { url: "http://localhost:5173/" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(1500);
    await evalJs(client, `(() => { localStorage.setItem('authToken', ${JSON.stringify(token)}); localStorage.removeItem('teknode_guest_cart'); return true; })();`);
    await client.send("Page.navigate", { url: "http://localhost:5173/checkout" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(6000);

    const cardCount = await poll(client, `(() => Array.from(document.querySelectorAll('[aria-label^="Apply coupon"]')).length || null)()`, 30000);
    check("TEST 1 - Coupons loaded from backend", cardCount > 0, `count=${cardCount}`);

    const save10Btn = await poll(client, `(() => {
      const btns = Array.from(document.querySelectorAll('[aria-label]'));
      const s = btns.find(b => b.getAttribute('aria-label').includes('SAVE10'));
      return s ? s.getAttribute('aria-label') : null;
    })()`, 15000);
    check("TEST 2 - SAVE10 eligible button visible", save10Btn, save10Btn || "not found");

    if (save10Btn) {
      await evalJs(client, `(() => { document.querySelector('[aria-label="${save10Btn}"]').click(); return true; })();`);
      const removeAppeared = await poll(client, `(() => Array.from(document.querySelectorAll('button')).some(x=>/Remove Coupon/i.test(x.textContent)))`, 20000);
      check("TEST 3 - Remove Coupon appears (applied)", removeAppeared, removeAppeared ? "found" : "NOT found");

      const applyMsg = await pollText(client, `/Coupon applied/`, 15000);
      check("TEST 3b - 'Coupon applied' on page", !!applyMsg, applyMsg || "no message");
      const saveTxt = await pollText(client, `/You save[^\\n]{0,25}/`, 15000);
      check("TEST 4 - 'You save' with 500 on page", !!saveTxt && /500/.test(saveTxt), saveTxt || "no match");
      const totalTxt = await poll(client, `(() => { const m = document.body.innerText.match(/Total Amount[\\s\\S]{0,80}/); return m && /2,500\\.00/.test(m[0]) ? m[0].replace(/\\s+/g,' ').slice(0,80) : null; })()`, 15000);
      check("TEST 5 - Total 2500.00 on page (6000 gross - 3000 offer - 500 coupon)", !!totalTxt, totalTxt || "no match");
    }
    // TEST 7: Remove coupon
    await evalJs(client, `(() => { const b=Array.from(document.querySelectorAll('button')).find(x=>/Remove Coupon/i.test(x.textContent)); if(b)b.click(); return !!b; })()`);
    const promoBack = await poll(client, `(() => /Have a promo code/i.test(document.body.innerText) && !/Remove Coupon/i.test(document.body.innerText) ? true : null)()`, 15000);
    check("TEST 7 - Promo input restored after remove", !!promoBack, promoBack ? "yes" : "no");

    // TEST 8: Fake coupon -> "not found"
    await evalJs(client, SET_INPUT("DOESNOTEXIST123"));
    await sleep(600);
    await evalJs(client, CLICK_APPLY);
    const fakeLine = await pollText(client, `/Coupon not found[^\\n]{0,40}/`, 15000);
    check("TEST 8 - Fake code 'not found'", !!fakeLine, fakeLine || "no error");

    // TEST 9: FUTURE50 -> "not active yet"
    await evalJs(client, SET_INPUT("FUTURE50"));
    await sleep(600);
    await evalJs(client, CLICK_APPLY);
    const futureLine = await pollText(client, `/not active yet[^\\n]{0,40}/`, 15000);
    check("TEST 9 - FUTURE50 'not active yet' (NOT not found)", !!futureLine && !/not found/.test(futureLine), futureLine || "no error");

    client.close();
  } catch (e) {
    log("ERR: " + e.message);
    log(e.stack);
  } finally {
    try { await shutdownChrome(); } catch {}
    try {
      const apiTs = Date.now();
      const apiEmail = `api3.${apiTs}@teknode.test`;
      await apiNode("POST", "/api/auth/register", { body: { email: apiEmail, password: "Passw0rd!123", username: `api3_${apiTs}`, first_name: "A", last_name: "T", phone: "9999999998", age: 30, address: "1 F", city: "Indore", pincode: "452001" } });
      const apiLogin = await apiNode("POST", "/api/auth/login", { body: { email: apiEmail, password: "Passw0rd!123" } });
      const apiToken = apiLogin.json?.data?.token;
      await apiNode("POST", "/api/cart/add", { token: apiToken, body: { product_id: 19, quantity: 6 } });

      const fakeRes = await apiNode("POST", "/api/coupons/apply", { token: apiToken, body: { couponCode: "DOESNOTEXIST123" } });
      check("API - Fake code -> 400 COUPON_NOT_FOUND", fakeRes.status === 400 && fakeRes.json?.code === "COUPON_NOT_FOUND", `status=${fakeRes.status} code=${fakeRes.json?.code} msg=${fakeRes.json?.message}`);

      const futureRes = await apiNode("POST", "/api/coupons/apply", { token: apiToken, body: { couponCode: "FUTURE50" } });
      check("API - FUTURE50 -> 400 OFFER_NOT_STARTED", futureRes.status === 400 && futureRes.json?.code === "OFFER_NOT_STARTED", `status=${futureRes.status} code=${futureRes.json?.code} msg=${futureRes.json?.message}`);

      await apiNode("POST", "/api/coupons/remove", { token: apiToken });
      const validRes = await apiNode("POST", "/api/coupons/apply", { token: apiToken, body: { couponCode: "SAVE10" } });
      check("API - SAVE10 -> 200 success", validRes.status === 200, `status=${validRes.status}`);
      check("API - SAVE10 discount = 500 (capped at 500)", validRes.json?.data?.discount === 500, `discount=${validRes.json?.data?.discount}`);

      const validateRes = await apiNode("POST", "/api/coupons/validate", { token: apiToken, body: { code: "SAVE10" } });
      check("API - POST /validate SAVE10 valid=true + discount=500", validateRes.json?.data?.valid === true && validateRes.json?.data?.discount === 500, `valid=${validateRes.json?.data?.valid} disc=${validateRes.json?.data?.discount}`);

      await apiNode("POST", "/api/coupons/remove", { token: apiToken });
      await apiNode("DELETE", "/api/cart/clear", { token: apiToken });
      await apiNode("POST", "/api/cart/add", { token: apiToken, body: { product_id: 19, quantity: 1 } });
      const minRes = await apiNode("POST", "/api/coupons/apply", { token: apiToken, body: { couponCode: "FLAT200" } });
      check("API - FLAT200 min order (1000<1499) -> MIN_CART_NOT_REACHED", minRes.status === 400 && minRes.json?.code === "MIN_CART_NOT_REACHED", `status=${minRes.status} code=${minRes.json?.code} msg=${minRes.json?.message}`);

      const availRes = await apiNode("GET", "/api/coupons/available", { token: apiToken });
      const availCoupons = availRes.json?.data?.coupons || [];
      const save10Card = availCoupons.find((c) => c.code === "SAVE10");
      check("API - GET /available includes SAVE10 card", save10Card, `found=${!!save10Card}`);
      if (save10Card) {
        check("API - SAVE10 card has eligible=true", save10Card.eligible === true, `eligible=${save10Card.eligible}`);
      }
    } catch (apiErr) {
      log("API TEST ERR: " + apiErr.message);
    }
    log(`\n========================================`);
    log(`Browser E2E v3 RESULT  PASS=${pass} FAIL=${fail}`);
    log(`========================================`);
    process.exit(0);
  }
})();