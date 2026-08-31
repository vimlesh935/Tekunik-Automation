const { launchChrome, attachToPage, evalJs, waitFor, shutdownChrome, sleep } = require("./cdp");
const API = "http://localhost:8787";
const fs = require("node:fs");
const OUT = "ui-locked.out.txt";
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
let pass = 0, fail = 0;
const check = (label, ok, detail) => { const tag = ok ? "PASS" : "FAIL"; ok ? pass++ : fail++; log(`[${tag}] ${label} — ${detail}`); };
(async () => {
  const ts = Date.now();
  fs.writeFileSync(OUT, `\n=== Locked-coupon UI ${ts} ===\n`);
  try {
    const email = `ul.${ts}@teknode.test`;
    await apiNode("POST", "/api/auth/register", { body: { email, password: "Passw0rd!123", username: `ul_${ts}`, first_name: "U", last_name: "L", phone: "9999999994", age: 30, address: "1 U", city: "Indore", pincode: "452001" } });
    const login = await apiNode("POST", "/api/auth/login", { body: { email, password: "Passw0rd!123" } });
    const token = login.json?.data?.token;
    await apiNode("POST", "/api/cart/add", { token, body: { product_id: 19, quantity: 1 } }); // gross ₹1000, FLAT200 needs ₹1499

    const avail = await apiNode("GET", "/api/coupons/available", { token });
    const flat = (avail.json?.data?.coupons || []).find((c) => c.code === "FLAT200");
    check("API - FLAT200 card locked with reason", flat && flat.locked === true && flat.reasonCode === "MIN_CART_NOT_REACHED", flat ? `locked=${flat.locked} reason=${flat.reasonCode} msg="${flat.lockMessage}" shortfall=${flat.shortfall}` : "missing");

    const targets = await launchChrome({ port: 9250 });
    const { client } = await attachToPage(targets);
    await client.send("Page.navigate", { url: "http://localhost:5173/" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(1500);
    await evalJs(client, `(() => { localStorage.setItem('authToken', ${JSON.stringify(token)}); localStorage.removeItem('teknode_guest_cart'); return true; })();`);
    await client.send("Page.navigate", { url: "http://localhost:5173/checkout" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(6000);

    const lockDiag = await poll(client, `(() => {
      const el = document.querySelector('[data-testid^="shortfall-FLAT200"]');
      const copyBtn = document.querySelector('[aria-label^="Copy coupon code FLAT200"]');
      if (!el || !copyBtn) return null;
      return { lockLine: el.textContent.trim(), hasApply: !!document.querySelector('[aria-label^="Apply coupon FLAT200"]') };
    })()`, 45000);
    check("UI - FLAT200 locked card rendered (shortfall + copy button)", !!lockDiag, lockDiag ? `shortfall="${lockDiag.lockLine}" apply=${lockDiag.hasApply}` : "not rendered in time");
    if (lockDiag) {
      check("UI - Lock reason shown (Add ₹499.00 more to unlock)", /Add ₹499\.00 more to unlock/.test(lockDiag.lockLine), lockDiag.lockLine || "no text");
      check("UI - No enabled Apply button for locked FLAT200", lockDiag.hasApply === false, lockDiag.hasApply ? "apply button exists (BUG)" : "no apply button (correct)");
      check("UI - Copy button still available for locked code", true, "yes");
    }
    client.close();
  } catch (e) { log("ERR: " + e.message); log(e.stack); }
  try { await shutdownChrome(); } catch {}
  log(`\nLOCKED-UI RESULT PASS=${pass} FAIL=${fail}`);
  process.exit(0);
})();