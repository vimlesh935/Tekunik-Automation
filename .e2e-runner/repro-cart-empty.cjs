/* Browser E2E - REPRODUCE "Your Cart is Empty" after applying coupon.
 * Mirrors the user path: local guest cart HAS the product; server cart is EMPTY;
 * /cart shows item -> /checkout shows item -> apply SAVE20 -> observe page. */
const { launchChrome, attachToPage, evalJs, waitFor, shutdownChrome, sleep } = require("./cdp");
const fs = require("node:fs");
const OUT = "repro-cart-empty.out.txt";
const API = "http://localhost:8787";
let pass = 0, fail = 0;
const log = (m) => { console.log(m); fs.appendFileSync(OUT, m + "\n"); };
const check = (label, ok, detail) => { const tag = ok ? "PASS" : "FAIL"; ok ? pass++ : fail++; log(`[${tag}] ${label} - ${detail}`); };
const apiNode = async (method, url, { token, body } = {}) => {
  const r = await fetch(`${API}${url}`, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};

(async () => {
  const ts = Date.now();
  fs.writeFileSync(OUT, `=== REPRO cart-empty ${ts} ===\n`);
  try {
    // 1. Fresh user (NO server cart items) + auth token
    const email = `rce.${ts}@teknode.test`;
    await apiNode("POST", "/api/auth/register", { body: { email, password: "Passw0rd!123", username: `rce_${ts}`, first_name: "R", last_name: "E", phone: "9999999997", age: 30, address: "1 R", city: "Indore", pincode: "452001" } });
    const login = await apiNode("POST", "/api/auth/login", { body: { email, password: "Passw0rd!123" } });
    const token = login.json?.data?.token;
    check("Setup - fresh logged-in user (server cart EMPTY)", !!token, `token=${!!token}`);
    const serverCart = await apiNode("GET", "/api/cart", { token });
    const scLen = (serverCart.json?.data?.cart?.items || serverCart.json?.data?.items || []).length;
    check("Server cart starts empty", scLen === 0, `len=${scLen}`);

    // 2. Launch browser; seed LOCAL guest cart with 2 x product 19 (500 each = 1000)
    const targets = await launchChrome({ port: 9270 });
    const { client } = await attachToPage(targets);
    const netLog = []; const couponRes = [];
   client.on("Network.requestWillBeSent", (p) => {
      if (p.request && p.request.url.includes("/api/coupons") && p.request.method !== "OPTIONS") {
        netLog.push({ id: p.requestId, phase: "REQ", url: p.request.url, method: p.request.method, body: p.request.postData || null }); }
    });
   client.on("Network.responseReceived", (p) => {
      if (p.response && p.response.url.includes("/api/coupons") && p.response.status !== 204) {
        netLog.push({ id: p.requestId, phase: "RES", url: p.response.url, status: p.response.status, body: null }); }
    });
   client.on("Network.loadingFinished", async (p) => {
      try {
        const entry = netLog.find((e) => e.id === p.requestId && e.phase === "RES" && !e.body);
        if (entry && entry.url.includes("/api/coupons/apply")) {
          const body = await client.send("Network.getResponseBody", { requestId: p.requestId });
          couponRes.push({ url: entry.url, status: entry.status, body: (body.body || "").slice(0, 300) }); }
        } catch {}
      });

    const GUEST_ITEM = { product_id: 19, name: "2M 4Touch", image_url: "/uploads/products/1780647185789-617150121-zimi-powermesh-smart-quad-multi-purpose-switch-black.jpg", original_price: 1000, price: 500, discount_percent: 50, discount_amount: 500, final_price: 500, quantity: 2, max_quantity: 189, product_status: "active", stock_quantity: 189 };
    await client.send("Page.navigate", { url: "http://localhost:5173/" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(1500);
    await evalJs(client, `(() => { localStorage.setItem('authToken', ${JSON.stringify(token)}); localStorage.setItem('teknode_guest_cart', JSON.stringify([${JSON.stringify(GUEST_ITEM)}])); return true; })();`);
// 3. Go to /cart -> verify product visible
    await client.send("Page.navigate", { url: "http://localhost:5173/cart" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(2500);
    const cartItemVisible = await evalJs(client, "(() => document.body.innerText.includes('2M 4Touch'))()");
    check("TEST A - /cart shows the product", !!cartItemVisible, `visible=${cartItemVisible}`);

    // 4. Proceed to Checkout (click the button - same as user)
    const proceeded = await evalJs(client, `(() => { const b=Array.from(document.querySelectorAll('button')).find(x=>/Proceed to Checkout/i.test(x.textContent)); if(b){b.click(); return true;} return false; })()`);
    check("TEST A2 - Proceed to Checkout clicked", !!proceeded, `clicked=${proceeded}`);
await sleep(4000);
    const checkoutItemVisible = await evalJs(client, "(() => document.body.innerText.includes('2M 4Touch'))()");
    const emptyPageBefore = await evalJs(client, "(() => document.body.innerText.includes('Your Cart is Empty'))()");
    check("TEST B - Checkout shows the product (before Apply)", !!checkoutItemVisible, `itemVisible=${checkoutItemVisible} emptyPage=${emptyPageBefore}`);
// 5. Enter SAVE20 -> click Apply
    await evalJs(client, `(() => { const i=document.querySelector('input[aria-label="Coupon code"]'); if(!i) return false; const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; s.call(i,'SAVE20'); i.dispatchEvent(new Event('input',{bubbles:true})); return true; })()`);
    await sleep(500);
    const clicked = await evalJs(client, `(() => { const i=document.querySelector('input[aria-label="Coupon code"]'); if(!i) return false; const b=i.parentElement.querySelector('button'); if(b){b.click(); return true;} return false; })()`);
    check("TEST C - Apply clicked", !!clicked, `clicked=${clicked}`);
    await sleep(3500);

    // 6. OBSERVE THE RESULT - full-page empty? coupon message? product still there?
    const emptyPageAfter = await evalJs(client, "(() => document.body.innerText.includes('Your Cart is Empty'))()");
    const productStillVisible = await evalJs(client, "(() => document.body.innerText.includes('2M 4Touch'))()");
    const couponMsg = await evalJs(client, `(() => { const el=document.querySelector('[data-testid="coupon-status-message"]'); return el ? el.innerText.trim() : null; })()`);
    const pageSnippet = await evalJs(client, `(() => document.body.innerText.replace(/\s+/g,' ').slice(0,300))()`);
    log("PAGE SNIPPET AFTER APPLY: " + pageSnippet);
    check("TEST D - Cart page NOT replaced by empty state", !emptyPageAfter, `emptyPage=${emptyPageAfter}`);
    check("TEST D2 - Product still visible after Apply", !!productStillVisible, `visible=${productStillVisible}`);
    check("TEST D3 - Coupon message", !!couponMsg, `msg=${couponMsg || "none"}`);
    await sleep(1200);
    netLog.forEach((e) => log("  NET " + e.phase + ": " + (e.method || "") + " " + e.url + " body=" + (e.body || "")));
    couponRes.forEach((e) => log("  APPLY RESP: " + e.status + " " + e.body));
    const serverCartAfter = await apiNode("GET", "/api/cart", { token });
    const itemsAfter = (serverCartAfter.json?.data?.cart?.items || serverCartAfter.json?.data?.items || []).length;
    check("Server cart intact after apply (not cleared)", itemsAfter === 0, `itemsAfter=${itemsAfter}`);
  } catch (e) {
    log("FATAL: " + e.message);
   } finally {
    await shutdownChrome();
   }
  log("\nRESULT: " + pass + " passed, " + fail + " failed.");
  process.exit(fail ? 1 : 0);
})();