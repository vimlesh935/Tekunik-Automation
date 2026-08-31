const { launchChrome, attachToPage, evalJs, waitFor, shutdownChrome, sleep } = require("./cdp");
const API = "http://localhost:8787";
const fs = require("node:fs");
const OUT = "diag.out.txt";
const log = (m) => { console.log(m); fs.appendFileSync(OUT, m + "\n"); };
const apiNode = async (m, p, { token, body } = {}) => {
  const r = await fetch(`${API}${p}`, { method: m, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
(async () => {
  const ts = Date.now(); const email = `dg.${ts}@teknode.test`;
  try {
    await apiNode("POST", "/api/auth/register", { body: { email, password: "Passw0rd!123", username: `dg_${ts}`, first_name: "D", last_name: "T", phone: "9999999998", age: 30, address: "1 Dg Ln", city: "Indore", pincode: "452001" } });
    const login = await apiNode("POST", "/api/auth/login", { body: { email, password: "Passw0rd!123" } });
    const token = login.json?.data?.token;
    await apiNode("POST", "/api/cart/add", { token, body: { product_id: 19, quantity: 1 } });
    log("[1] registered+logged in + server cart 1x prod19");

    const targets = await launchChrome({ port: 9230 });
    const { client } = await attachToPage(targets);
    // Load HOME first (empty cart), then set localStorage on home origin, then go to checkout
    await client.send("Page.navigate", { url: "http://localhost:5173/" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(2500);
    await evalJs(client, `(() => {
      localStorage.setItem('authToken', ${JSON.stringify(token)});
      localStorage.setItem('teknode_guest_cart', JSON.stringify([{ product_id:19, name:'2M 4Touch', price:500, original_price:1000, discount_percent:50, discount_amount:500, final_price:500, quantity:1, image_url:'/uploads/products/x.jpg', stock_quantity:74 }]));
      return 'set';
    })();`);
    await client.send("Page.navigate", { url: "http://localhost:5173/checkout" });
    await sleep(5000);
    const ls = await evalJs(client, `(() => ({
      token: !!localStorage.getItem('authToken'),
      guestCart: localStorage.getItem('teknode_guest_cart')
    }))();`);
    log(`[2] localStorage: token=${ls.token} guestCart=${ls.guestCart}`);
    const pageText = await evalJs(client, "document.body.innerText");
    log(`[3] emptyState=${pageText.includes("Your Cart is Empty")} hasCouponSection=${/Available Offers/i.test(pageText)}`);
    // Inspect how many item rows in summary
    const itemCount = await evalJs(client, `(() => document.querySelectorAll('[class*="divide-y"] img, [class*="divide-y"]').length)()`);
    log(`[4] summary img count ~ ${itemCount}`);
    client.close();
  } catch (e) { log("ERR: " + e.message); }
  try { await shutdownChrome(); } catch {}
  process.exit(0);
})();