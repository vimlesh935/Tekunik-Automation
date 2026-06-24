const fs = require('fs');
const path = require('path');

console.log('=== ORDER ROUTES DIAGNOSTIC ===');
console.log('CWD:', process.cwd());

// 1. Read the actual orderRoutes.js file content
const routesPath = path.join(__dirname, 'src', 'routes', 'orderRoutes.js');
console.log('\n--- Reading:', routesPath, '---');
const content = fs.readFileSync(routesPath, 'utf8');
const lines = content.split('\n');
console.log('Total lines:', lines.length);

// 2. Print lines 30-40 to inspect the area around line 33
console.log('\n--- Lines 30-40 ---');
for (let i = 29; i < Math.min(40, lines.length); i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

// 3. Try loading the orderController first to check exports
console.log('\n--- Loading orderController.js ---');
try {
  const controller = require(path.join(__dirname, 'src', 'controllers', 'orderController'));
  console.log('Controller loaded. Exports:', Object.keys(controller));
  for (const key of Object.keys(controller)) {
    console.log(`  ${key}: ${typeof controller[key]}`);
  }
} catch (e) {
  console.log('FAILED to load controller:', e.message);
}

// 4. Try loading middleware
console.log('\n--- Loading authMiddleware.js ---');
try {
  const auth = require(path.join(__dirname, 'src', 'middleware', 'authMiddleware'));
  console.log('requireAuth:', typeof auth.requireAuth);
} catch (e) {
  console.log('FAILED to load authMiddleware:', e.message);
}

console.log('\n--- Loading adminMiddleware.js ---');
try {
  const admin = require(path.join(__dirname, 'src', 'middleware', 'adminMiddleware'));
  console.log('requireAdmin:', typeof admin.requireAdmin);
} catch (e) {
  console.log('FAILED to load adminMiddleware:', e.message);
}

// 5. Now try loading orderRoutes
console.log('\n--- Loading orderRoutes.js ---');
try {
  const routes = require(path.join(__dirname, 'src', 'routes', 'orderRoutes'));
  console.log('Routes loaded successfully');
  console.log('Routes type:', typeof routes);
  
  // Check each route stack
  if (routes.stack) {
    routes.stack.forEach((layer, idx) => {
      if (layer.route) {
        const handlers = layer.route.stack;
        handlers.forEach((h, hIdx) => {
          const handleType = typeof h.handle;
          console.log(`  Route ${idx}: ${h.route.path}, Handler ${hIdx}: ${handleType}${handleType !== 'function' ? ' ❌ NOT A FUNCTION' : ''}`);
        });
      }
    });
  }
} catch (e) {
  console.log('FAILED to load orderRoutes:', e.message);
  console.log('Stack:', e.stack);
}