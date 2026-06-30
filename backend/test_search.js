const http = require('http');

const req = http.get('http://localhost:8787/api/products/search?q=s&limit=8', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', JSON.stringify(res.headers));
    try {
      const parsed = JSON.parse(data);
      console.log('BODY:', JSON.stringify(parsed, null, 2));
    } catch(e) {
      console.log('RAW BODY:', data.substring(0, 500));
    }
  });
});
req.on('error', e => console.log('ERROR:', e.message));
req.end();