const { launchChrome, attachToPage, evalJs, waitFor, shutdownChrome, sleep } = require("./cdp");
const API = "http://localhost:8787";
const apiNode = async (method, path, { token, body } = {}) => {
  const res = await fetch(`${API}${path}`, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let json = null; try { json = await res.json(); } catch {}
  return { status: res.status, json };
};
(async () => {
  const ts = Date.now(); const email = `ui.${ts}@teknode.test`;
  try {
    await apiNode("POST", "/api/auth/register", { body: { email, password: "Passw0rd!123", username: `ui_${ts}`, first_name: "UI", last_name: "T", phone: "9999999996", age: 30, address: "1 Ui Ln", city: "Indore", pincode: "452001" } });
    const login = await apiNode("POST", "/api/auth/login", { body: { email, password: "Passw0rd!123" } });
    const token = login.json?.data?.token;
    await apiNode("POST", "/api/cart/add", { token, body: { product_id: 19, quantity: 1 } });
    const targets = await launchChrome({ port: 9227 });
    const { client } = await attachToPage(targets);
    await client.send("Page.navigate", { url: "http://localhost:5173/checkout" });
    await waitFor(client, "document.readyState === 'interactive'", { timeout: 20000 });
    await sleep(5000);
    // Set auth and reload so React sees the token
    await evalJs(client, `(() => { localStorage.setItem('authToken','x'); })();`);
    await evalJs(client, `(() => { localStorage.setItem('authToken', ${JSON.stringify(token)}); return true; })();`);
    await client.send("Page.navigate", { url: "http://localhost:5173/checkout" });
    await sleep(7000);
    const body = await evalJs(client, "document.body ? document.body.innerText : ''");
    console.log("==== BODY (first 3500 chars) ====");
    console.log(body.slice(0, 3500));
    client.close();
  } catch (e) { console.error("ERR", e.message); }
  await shutdownChrome();
})();