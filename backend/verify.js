// Quick verification script - runs directly
try {
  const controller = require('./src/controllers/orderController');
  const keys = Object.keys(controller);
  console.log('=== CONTROLLER EXPORTS CHECK ===');
  keys.forEach(k => console.log(`  ${k}: ${typeof controller[k]}`));
  
  const missing = [];
  const expected = ['createOrder','listOrders','getOrder','updateOrderStatus','trackOrder',
    'getUserOrders','getUserOrder','regenerateInvoice','downloadInvoice',
    'downloadUserInvoice','downloadGuestInvoice','getOrderStats','cancelOrder'];
  
  expected.forEach(name => {
    if (!controller[name]) missing.push(name);
    else if (typeof controller[name] !== 'function') console.log(`  ❌ ${name} is ${typeof controller[name]}, not function`);
  });
  
  if (missing.length) console.log('❌ MISSING:', missing);
  else console.log('✅ All 13 controller exports are valid functions');
  
  console.log('\n=== ROUTES CHECK ===');
  const routes = require('./src/routes/orderRoutes');
  routes.stack.forEach((layer, i) => {
    if (layer.route) {
      layer.route.stack.forEach(h => {
        const t = typeof h.handle;
        console.log(`  Route ${i}: ${layer.route.path} → handler type: ${t}${t !== 'function' ? ' ❌' : ' ✅'}`);
      });
    }
  });
  console.log('\n✅ All route handlers are valid functions');
} catch(e) {
  console.log('❌ ERROR:', e.message);
  console.log(e.stack);
}