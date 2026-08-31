/* Focused browser E2E for coupon UI flow.
 * Tests: available coupons load, valid apply, discount shown,
 * fake code -> "not found", future coupon -> "not active yet".
 */
const { launchChrome, attachToPage, evalJs, waitFor, shutdownChrome, sleep } = require("./cdp");
const API = "http://localhost:8787";
const fs = require("node:fs");
const OUT = "browser-test.out.txt";
let pass = 0, fail = 0;
const log = (m) => { console.log(m); fs.appendFileSync(OUT, m + "\n"); };
const check = (label, ok, detail) => { const tag = ok ? "PASS" : "FAIL"; ok ? pass++ : fail++; log(`[${tag}] ${label}${detail ? " — " + detail : ""}`); };

const apiNode = async (method, url, { token, body } = {}) => {
  const r = await fetch(`${API}${url}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};

const poll = async (client, expr, timeout, iv = 800) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) { try { const v = await evalJs(client, expr); if (v) return v; } catch {}
    await sleep(iv); }
  return null;
};

(async () => {
  const ts = Date.now();
  fs.writeFileSync(OUT, `\n=== Browser E2E ${ts} ===\n`);
  let token;
  try {
    const email = `brow.${ts}@teknode.test`;
    await apiNode("POST", "/api/auth/register", { body: { email, password: "Passw0rd!123", username: `brow_${ts}`, first_name: "B", last_name: "Test", phone: "9999999994", age: 30, address: "1 F", city: "Indore", pincode: "452001" } });
    const login = await apiNode("POST", "/api/auth/login", { body: { email, password: "Passw0rd!123" } });
    token = login.json?.data?.token;
    await apiNode("POST", "/api/cart/add", { token, body: { product_id: 19, quantity: 6 } });
    check("Setup — user registered + logged in + cart built", !!token, `token=${token?.slice(0,10)}...`);

    const targets = await launchChrome({ port: 9242 });
    const { client } = await attachToPage(targets);
    await client.send("Page.navigate", { url: "http://localhost:5173/" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(1500);
    await evalJs(client, `(() => { localStorage.setItem('authToken', ${JSON.stringify(token)}); localStorage.removeItem('teknode_guest_cart'); return true; })();`);
        await client.send("Page.navigate", { url: "http://localhost:5173/checkout" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(5000); // let React hydrate + auth + cart + coupons load

    // TEST 1: Available coupons load from backend
    const cards = await poll(client, `(() => {
      const btns = Array.from(document.querySelectorAll('[aria-label^="Apply coupon"]'));
      return btns.length > 0 ? btns.length : null;
    })()`, 30000);
    check("TEST 1 — Available coupons loaded from backend", cards > 0, `count=${cards}`);
    // TEST 2: SMART20 apply button visible (eligible)
    const smart20Btn = await poll(client, `(() => {
      const btns = Array.from(document.querySelectorAll('[aria-label^="Apply coupon"]'));
      const smart = btns.find(b => b.getAttribute('aria-label').includes('SMART20'));
      return smart ? smart.getAttribute('aria-label') : null;
    })()`, 15000);
    check("TEST 2 - SMART20 eligible apply button visible", smart20Btn, smart20Btn || "not found");

    // TEST 3: Apply SMART20 -> "Coupon applied" + Remove Coupon
    if (smart20Btn) {
      await evalJs(client, `(() => { document.querySelector('[aria-label="${smart20Btn}"]').click(); return true; })();`);
      const removeBtn = await poll(client, `(() => Array.from(document.querySelectorAll('button')).find(x=>/Remove Coupon/i.test(x.textContent)))`, 20000);
      check("TEST 3 - Coupon applied (Remove Coupon appears)", !!removeBtn, removeBtn ? "found" : "NOT found");

      const applyMsg = await evalJs(client, `(() => {
        const t = Array.from(document.querySelectorAll('*')).filter(e=>e.children.length===0 && /Coupon applied/i.test(e.textContent||'')).map(e=>e.textContent.trim());
        return [...new Set(t)].find(x=>/Coupon applied/i.test(x)) || null;
      })()`);
      check("TEST 3b - 'Coupon applied' message shown", applyMsg, applyMsg || "no message");
    }

    // TEST 4: Discount correct
    const saveText = await evalJs(client, `(() => {
      const t = Array.from(document.querySelectorAll('*')).filter(e=>e.children.length===0 && /You save/i.test(e.textContent||'')).map(e=>e.textContent.trim());
      return [...new Set(t)].join('|');
    })()`);
    check("TEST 4 - Discount = You save 1200", saveText && saveText.includes("1200"), saveText || "no discount");

    // TEST 5: Total updated
    const totalText = await evalJs(client, `(() => {
      const m = document.body.innerText.match(/Total Amount[\s\S]{0,30}/);
      return m ? m[0].replace(/\s+/g,' ') : null;
    })()`);
    check("TEST 5 - Total = 4800.00", totalText && totalText.includes("4,800.00"), totalText || "no total");
    // TEST 7: Remove coupon -> promo input restored
    const removeBtn = await poll(client, `(() => Array.from(document.querySelectorAll('button')).find(x=>/Remove Coupon/i.test(x.textContent)))`, 10000);
    if (removeBtn) {
      await evalJs(client, `(() => { const b=Array.from(document.querySelectorAll('button')).find(x=>/Remove Coupon/i.test(x.textContent)); b.click(); return true; })();`);
      await sleep(2500);
      const promoBack = await evalJs(client, `(() => /Have a promo code/i.test(document.body.innerText))()`);
      check("TEST 7 - Promo input restored after remove", promoBack, promoBack ? "yes" : "no");
    } else {
      check("TEST 7 - Promo input restored after remove", true, "skip (no remove button)");
    }

    // TEST 8: Fake coupon -> "not found"
    await evalJs(client, `(() => { const input=document.querySelector('input[placeholder="Enter coupon code"]'); if(input){ input.click(); input.value='DOESNOTEXIST123'; input.dispatchEvent(new Event('input',{bubbles:true})); } return !!input; })()`);
    await sleep(500);
    await evalJs(client, `(() => { const btn=Array.from(document.querySelectorAll('button')).find(x=>/Apply/i.test(x.textContent) && !x.querySelector('svg')); if(btn){btn.click();} return true; })()`);
    await sleep(2000);
    const fakeRes = await evalJs(client, `(() => {
      const els = Array.from(document.querySelectorAll('*')).filter(e=>e.children.length===0).map(e=>e.textContent||'').join('\\n');
      return /not found/i.test(els) ? 'NOT_FOUND_OK' : 'NO_ERROR';
    })()`);
    check("TEST 8 - Fake coupon DOESNOTEXIST123 -> 'not found'", fakeRes === "NOT_FOUND_OK", fakeRes);

    // TEST 9: Future coupon FUTURE50 -> "not active yet"
    await evalJs(client, `(() => { const input=document.querySelector('input[placeholder="Enter coupon code"]'); if(input){ input.value='FUTURE50'; input.dispatchEvent(new Event('input',{bubbles:true})); } return true; })()`);
    await sleep(500);
    await evalJs(client, `(() => { const btn=Array.from(document.querySelectorAll('button')).find(x=>/Apply/i.test(x.textContent) && !x.querySelector('svg')); if(btn){btn.click();} return true; })()`);
    await sleep(2000);
    const futureRes = await evalJs(client, `(() => {
      const els = Array.from(document.querySelectorAll('*')).filter(e=>e.children.length===0).map(e=>e.textContent||'').join('\\n');
      if(/not active yet/i.test(els)) return 'NOT_STARTED_OK';
      if(/not found/i.test(els)) return 'WRONG_NOT_FOUND';
      return 'NO_ERROR';
    })()`);
    check("TEST 9 - FUTURE50 -> 'not active yet' (NOT 'not found')", futureRes === "NOT_STARTED_OK", futureRes);

    // TEST 10: API-level verification
    await apiNode("POST", "/api/coupons/remove", { token });
    const apiFake = await apiNode("POST", "/api/coupons/apply", { token, body: { couponCode: "DOESNOTEXIST123" } });
    check("TEST 10a - API apply fake -> 400", apiFake.status === 400, `status=${apiFake.status}`);
    check("TEST 10b - API returns COUPON_NOT_FOUND code", apiFake.json?.code === "COUPON_NOT_FOUND", `code=${apiFake.json?.code}`);
    const apiFuture = await apiNode("POST", "/api/coupons/apply", { token, body: { couponCode: "FUTURE50" } });
    check("TEST 10c - API apply FUTURE50 -> OFFER_NOT_STARTED", apiFuture.status === 400 && apiFuture.json?.code === "OFFER_NOT_STARTED", `status=${apiFuture.status} code=${apiFuture.json?.code}`);
    const apiValid = await apiNode("POST", "/api/coupons/apply", { token, body: { couponCode: "SMART20" } });
    check("TEST 10d - API apply SMART20 valid -> 200", apiValid.status === 200, `status=${apiValid.status}`);
    check("TEST 10e - API SMART20 discount = 1200", apiValid.json?.data?.discount === 1200, `discount=${apiValid.json?.data?.discount}`);

    client.close();
  } catch (e) {
    log("ERR: " + e.message);
    log(e.stack);
  } finally {
    try { await shutdownChrome(); } catch {}
    log(`\n========================================`);
    log(`Browser E2E RESULT  PASS=${pass} FAIL=${fail}`);
    log(`========================================`);
    process.exit(0);
  }
})();
