const killPort = require('./kill-port-sync');

console.log('\n╔════════════════════════════════════════╗');
console.log('║   BACKEND SERVER - SAFE START        ║');
console.log('╚════════════════════════════════════════╝\n');

// Kill any process using port 8787 (synchronous)
killPort();

// Now start the actual server
console.log('🚀 Starting server...\n');
require('./server');
