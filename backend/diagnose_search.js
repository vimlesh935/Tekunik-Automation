const http = require('http');

const get = (path) => new Promise((resolve, reject) => {
  const req = http.get(`http://localhost:8787${path}`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => resolve({ status: res.statusCode, body: data }));
  });
  req.on('error', e => reject(e.message));
  req.setTimeout(5000, () => { req.destroy(); reject('timeout'); });
  req.end();
});

async function main() {
  console.log('=== ROUTE DIAGNOSTIC ===\n');

  // Test 1: search route
  console.log('1. GET /api/products/search?q=S');
  let r = await get('/api/products/search?q=S');
  console.log('   Status:', r.status);
  console.log('   Body:', r.body.substring(0, 200));

  // Test 2: search with encoded q
  console.log('\n2. GET /api/products/search?q=Smart');
  r = await get('/api/products/search?q=Smart');
  console.log('   Status:', r.status);
  console.log('   Body:', r.body.substring(0, 200));

  // Test 3: search with search param instead of q
  console.log('\n3. GET /api/products/search?search=S');
  r = await get('/api/products/search?search=S');
  console.log('   Status:', r.status);
  console.log('   Body:', r.body.substring(0, 200));

  // Test 4: Direct products listing with search
  console.log('\n4. GET /api/products?search=S');
  r = await get('/api/products?search=S');
  console.log('   Status:', r.status);
  console.log('   Body:', r.body.substring(0, 300));

  // Test 5: product by id "search" (to check :id shadowing)
  console.log('\n5. GET /api/products/search (as :id)');
  r = await get('/api/products/search');
  console.log('   Status:', r.status);
  console.log('   Body:', r.body.substring(0, 200));

  // Test 6: raw 404
  console.log('\n6. GET /api/products/search/extra');
  r = await get('/api/products/search/extra');
  console.log('   Status:', r.status);
  console.log('   Body:', r.body.substring(0, 200));
}

main().catch(console.error);