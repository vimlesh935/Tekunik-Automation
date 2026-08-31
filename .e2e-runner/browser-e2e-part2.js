const { evalJs, sleep } = require("./cdp");

module.exports.run = async ({ client, netTraffic, rec }) => {
  // ── 5. Click APPLY on SAVE10 card ──────────────────────────────────
  const clicked = await evalJs(client, `
    (() => {
      const b = document.querySelector('[aria-label="Apply coupon SAVE10"]');
      if (!b) return { clicked:false };
      b.click(); return { clicked:true };
    })();
  `);
  rec(`[5] clicked SAVE10 apply: ${JSON.stringify(clicked)}`);
  await sleep(2500);

  const afterApply = await evalJs(client, `
    (() => {
      const toast = Array.from(document.querySelectorAll('*')).filter(e =>
        e.children.length===0 && /Coupon applied|Coupon not found|not applicable|Unable|Locked|assign|enter a coupon/i.test(e.textContent||''))
        .map(e=>e.textContent.trim());
      const saved = document.body.innerText.match(/You save[^\\n]{0,30}/i) || [];
      return { toast: [...new Set(toast)].slice(0,15), saved: saved.slice(0,2) };
    })();
  `);
  rec(`[6] after SAVE10 apply: ${JSON.stringify(afterApply)}`);

  // ── 6. Manual fake code → expected COUPON_NOT_FOUND ────────────────
  const manual = await evalJs(client, `
    (() => {
      const input = document.querySelector('input[placeholder="Enter coupon code"]');
      if (!input) return { done:false };
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
      setter.call(input, 'DOESNOTEXIST123');
      input.dispatchEvent(new Event('input', { bubbles:true }));
      const apply = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim()==='APPLY');
      if (apply) apply.click(); return { done:true };
    })();
  `);
  rec(`[7] manual fake entry: ${JSON.stringify(manual)}`);
  await sleep(2500);
  const afterFake = await evalJs(client, `
    (() => {
      const t = Array.from(document.querySelectorAll('*')).filter(e =>
        e.children.length===0 && /not found|not applicable|Unable|coupon not|enter a coupon/i.test(e.textContent||''))
        .map(e=>e.textContent.trim());
      return [...new Set(t)].slice(0,15);
    })();
  `);
  rec(`[8] after fake code: ${JSON.stringify(afterFake)}`);

  // ── 7. Manual real code SAVE10 (lowercase) ─────────────────────────
  const manual2 = await evalJs(client, `
    (() => {
      const input = document.querySelector('input[placeholder="Enter coupon code"]');
      if (!input) return { done:false };
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
      setter.call(input, 'save10');
      input.dispatchEvent(new Event('input', { bubbles:true }));
      const apply = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim()==='APPLY');
      if (apply) apply.click(); return { done:true };
    })();
  `);
  rec(`[9] manual lowercase save10: ${JSON.stringify(manual2)}`);
  await sleep(2500);
  const afterManual2 = await evalJs(client, `
    (() => {
      const t = Array.from(document.querySelectorAll('*')).filter(e =>
        e.children.length===0 && /Coupon applied|Coupon not found|not applicable|Unable|You save|coupon not/i.test(e.textContent||''))
        .map(e=>e.textContent.trim());
      return [...new Set(t)].slice(0,15);
    })();
  `);
  rec(`[10] after lowercase save10: ${JSON.stringify(afterManual2)}`);
  return true;
};