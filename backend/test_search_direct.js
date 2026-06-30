// Direct test of search endpoint using http module
const http = require('http');

const testEndpoint = (path) => {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:8787${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', (e) => reject(e.message));
    req.setTimeout(5000, () => { req.destroy(); reject('timeout'); });
    req.end();
  });
};

async function main() {
  console.log('=== TESTING SEARCH ENDPOINT ===\n');

  // Test 1: Basic search
  console.log('Test 1: GET /api/products/search?q=S');
  try {
    const result = await testEndpoint('/api/products/search?q=S&limit=8');
    console.log('Status:', result.status);
    try {
      const parsed = JSON.parse(result.body);
      console.log('Has success:', parsed.success);
      console.log('Has data:', !!parsed.data);
      if (parsed.data) {
        console.log('Products array:', Array.isArray(parsed.data.products));
        console.log('Products count:', parsed.data.products?.length);
        if (parsed.data.products?.length > 0) {
          console.log('First product name:', parsed.data.products[0].name);
        }
      }
      console.log('Full response keys:', Object.keys(parsed));
      console.log('data keys:', parsed.data ? Object.keys(parsed.data) : 'N/A');
    } catch(e) {
      console.log('RAW body:', result.body.substring(0, 500));
    }
  } catch(e) {
    console.log('CONNECTION ERROR:', e);
  }

  // Test 2: Health check
  console.log('\nTest 2: GET /health');
  try {
    const result = await testEndpoint('/health');
    console.log('Status:', result.status);
    console.log('Body:', result.body.substring(0, 200));
  } catch(e) {
    console.log('CONNECTION ERROR:', e);
  }

  // Test 3: Products listing
  console.log('\nTest 3: GET /api/products?limit=3');
  try {
    const result = await testEndpoint('/api/products?limit=3');
    console.log('Status:', result.status);
    try {
      const parsed = JSON.parse(result.body);
      console.log('Has success:', parsed.success);
      if (parsed.data) {
        console.log('Products count:', parsed.data.products?.length);
        if (parsed.data.products?.length > 0) {
          console.log('First product name:', parsed.data.products[0].name);
          console.log('First product status:', parsed.data.products[0].status);
        }
      }
    } catch(e) {
      console.log('RAW body:', result.body.substring(0, 300));
    }
  } catch(e) {
    console.log('CONNECTION ERROR:', e);
  }
}

main().catch(console.error);