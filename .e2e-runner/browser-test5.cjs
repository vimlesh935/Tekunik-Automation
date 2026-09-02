/* Browser E2E v5 — REPRODUCE "Invalid coupon code" with the EXISTING Admin coupon SAVE20.
 * Captures the real network request/response for /api/coupons/* from the browser. */
const { launchChrome, attachToPage, evalJs, waitFor, shutdownChrome, sleep } = require("./cdp");
const API = "http://localhost:8787";
const fs = require("node:fs");
const OUT = "browser-test5.out.txt";
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
const pollText = (client, pattern, timeout) => poll(client, `(() => { const m = document.body.innerText.match(${pattern}); return m ? m[0].replace(/\\s+/g,' ').slice(0,120) : null; })()`, timeout);
const SET_INPUT = (val) => `(() => { const i=document.querySelector('input[aria-label="Coupon code"]'); if(!i) return false; const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; s.call(i, ${JSON.stringify(val)}); i.dispatchEvent(new Event('input',{bubbles:true})); return true; })()`;
const CLICK_APPLY = `(() => { const i=document.querySelector('input[aria-label="Coupon code"]'); if(!i) return false; const b=i.parentElement.querySelector('button'); if(b){b.click(); return true;} return false; })()`;
const CLICK_REMOVE = `(() => { const b=Array.from(document.querySelectorAll('button')).find(x=>/^Remove Coupon$/i.test(x.textContent.trim())); if(b){b.click(); return true;} return false; })()`;

(async () => {
  const ts = Date.now();
  fs.writeFileSync(OUT, `\n=== Browser E2E v5 (SAVE20 repro) ${ts} ===\n`);
  const netLog = [];
  try {
    const email = `btv5.${ts}@teknode.test`;
    await apiNode("POST", "/api/auth/register", { body: { email, password: "Passw0rd!123", username: `btv5_${ts}`, first_name: "B", last_name: "T", phone: "9999999996", age: 30, address: "1 F", city: "Indore", pincode: "452001" } });
    const login = await apiNode("POST", "/api/auth/login", { body: { email, password: "Passw0rd!123" } });
    const token = login.json?.data?.token;
    await apiNode("POST", "/api/cart/add", { token, body: { product_id: 19, quantity: 1 } });
    check("Setup - fresh user, cart 1x product 19 (min cart ₹500 met)", !!token, `token=${!!token}`);

    const targets = await launchChrome({ port: 9252 });
    const { client } = await attachToPage(targets);

    client.on("Network.requestWillBeSent", (p) => {
      if (p.request && p.request.url.includes("/api/coupons") && p.request.method !== "OPTIONS") {
        netLog.push({ id: p.requestId, phase: "REQ", url: p.request.url, method: p.request.method, body: p.request.postData || null });
      }
    });
    client.on("Network.responseReceived", (p) => {
      if (p.response && p.response.url.includes("/api/coupons") && p.response.status !== 204) {
        netLog.push({ id: p.requestId, phase: "RES", url: p.response.url, status: p.response.status, body: null });
      }
    });
    client.on("Network.loadingFinished", async (p) => {
      try {
        const entry = netLog.find((e) => e.id === p.requestId && e.phase === "RES" && !e.body);
        if (entry) {
          const body = await client.send("Network.getResponseBody", { requestId: p.requestId });
          entry.body = (body.body || "").slice(0, 400);
        }
      } catch {}
    });

    await client.send("Page.navigate", { url: "http://localhost:5173/" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(1500);
    await evalJs(client, `(() => { localStorage.setItem('authToken', ${JSON.stringify(token)}); localStorage.removeItem('teknode_guest_cart'); return true; })();`);
    await client.send("Page.navigate", { url: "http://localhost:5173/checkout" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(6000);
    // TEST 1 — coupon section visible
    const hasBox = await poll(client, `(() => !!document.querySelector('input[placeholder="Enter coupon code"]'))()`, 30000);
    check("TEST 1 - Coupon input visible on Checkout", !!hasBox, `visible=${!!hasBox}`);

    // TEST 3 — THE BUG REPRO: existing admin coupon SAVE20
    await evalJs(client, SET_INPUT("SAVE20"));
    await sleep(600);
    const clicked = await evalJs(client, CLICK_APPLY);
    check("TEST 3a - Apply button clicked", !!clicked, `clicked=${clicked}`);

    const okMsg = await pollText(client, `/Coupon applied successfully/`, 20000);
    const badMsg = await pollText(client, `/Invalid coupon code|not applicable|Unable to apply[^\\n]{0,60}/`, 12000);
    if (okMsg) check("TEST 3b - SAVE20 applied (no 'Invalid coupon code')", true, okMsg);
    else check("TEST 3b - SAVE20 applied (no 'Invalid coupon code')", false, badMsg || "timeout — no success message");

    for (const r of netLog) log(`  NET ${r.phase}: ${r.method || r.status} ${r.url} ${r.phase === "REQ" ? `body=${r.body}` : `body=${(r.body || "").slice(0, 300)}`}`);

    // TEST 3c — applied row "Coupon (SAVE20)" + "-₹200" discount in totals
    const discLine = await pollText(client, `/Coupon \\(SAVE20\\)[^\\n]{0,30}/`, 10000);
    const neg200 = await poll(client, `(() => /-\\s?₹\\s?200(\\.00)?/.test(document.body.innerText))()`, 8000);
    check("TEST 3c - 'Coupon (SAVE20)' row + -₹200 discount shown", !!discLine && !!neg200, `row=${discLine || 'none'} neg200=${neg200}`);

    // TEST 7 — Remove coupon → input returns, applied box gone
    if (okMsg) {
      const rm = await evalJs(client, CLICK_REMOVE);
      const inputBack = await poll(client, `(() => !!document.querySelector('input[aria-label="Coupon code"]'))()`, 10000);
      const boxGone = await poll(client, `(() => !document.body.innerText.includes('Coupon applied'))()`, 8000);
      check("TEST 7 - Remove coupon clears applied state", !!(rm && inputBack && boxGone), `rm=${rm} inputBack=${inputBack} boxGone=${boxGone}`);

      // re-apply, then TEST 10 — refresh persistence
      await evalJs(client, SET_INPUT("SAVE20"));
      await sleep(500);
      await evalJs(client, CLICK_APPLY);
      await pollText(client, `/Coupon applied successfully/`, 15000);
      await client.send("Page.reload");
      await sleep(6000);
      const persisted = await pollText(client, `/Coupon applied[\\s\\S]{0,60}SAVE20|SAVE20[\\s\\S]{0,60}Coupon applied/`, 15000);
      check("TEST 10 - Coupon persists after refresh", !!persisted, persisted || "not persisted");
      await evalJs(client, CLICK_REMOVE);
      await sleep(2000);
    }

    // TEST 4 — invalid coupon
    await evalJs(client, SET_INPUT("INVALIDXYZ999"));
    await sleep(500);
    await evalJs(client, CLICK_APPLY);
    const inv = await pollText(client, `/Invalid coupon code/`, 15000);
    check("TEST 4 - INVALIDXYZ999 -> 'Invalid coupon code'", !!inv, inv || "no error shown");

    // TEST 2 — empty apply
    await evalJs(client, SET_INPUT(""));
    await sleep(400);
    await evalJs(client, CLICK_APPLY);
    const emptyMsg = await pollText(client, `/Please enter a coupon code/`, 8000);
    check("TEST 2 - Empty input -> 'Please enter a coupon code'", !!emptyMsg, emptyMsg || "no message");
    const emptyReqs = netLog.filter((e) => e.phase === "REQ" && e.method === "POST" && e.url.includes("/apply") && (!e.body || e.body.includes('""'))).length;
    const totalApplyReqs = netLog.filter((e) => e.phase === "REQ" && e.method === "POST" && e.url.includes("/apply")).length;
    check("TEST 2b - No API call made for empty input", emptyReqs === 0, `empty-apply requests=${emptyReqs} (total apply reqs=${totalApplyReqs})`);
  } catch (e) {
    log("ERR: " + e.message);
    log(e.stack);
  } finally {
    try { await shutdownChrome(); } catch {}
    log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
  }
  process.exit(fail ? 1 : 0);
})();
