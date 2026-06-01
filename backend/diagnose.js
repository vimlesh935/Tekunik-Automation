const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════╗');
console.log('║   BACKEND DIAGNOSTIC TOOL            ║');
console.log('╚════════════════════════════════════════╝\n');

async function runDiagnostics() {
  let allPassed = true;

  // 1. Check .env file
  console.log('📋 [1/6] Checking .env file...');
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    console.log('✅ .env file exists\n');
  } else {
    console.log('❌ .env file NOT FOUND!');
    console.log('   Create .env file in backend folder\n');
    allPassed = false;
  }

  // 2. Check node_modules
  console.log('📦 [2/6] Checking dependencies...');
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    console.log('✅ node_modules exists\n');
  } else {
    console.log('❌ node_modules NOT FOUND!');
    console.log('   Run: npm install\n');
    allPassed = false;
  }

  // 3. Check required packages
  console.log('📚 [3/6] Checking required packages...');
  const requiredPackages = ['express', 'mysql2', 'bcrypt', 'jsonwebtoken', 'nodemailer', 'cors', 'dotenv'];
  const missingPackages = [];
  
  for (const pkg of requiredPackages) {
    try {
      require.resolve(pkg);
    } catch (e) {
      missingPackages.push(pkg);
    }
  }
  
  if (missingPackages.length === 0) {
    console.log('✅ All required packages installed\n');
  } else {
    console.log('❌ Missing packages:', missingPackages.join(', '));
    console.log('   Run: npm install\n');
    allPassed = false;
  }

  // 4. Load environment variables
  console.log('⚙️  [4/6] Loading environment variables...');
  try {
    require('dotenv').config();
    console.log('✅ Environment variables loaded');
    console.log(`   DB_HOST: ${process.env.DB_HOST || 'NOT SET'}`);
    console.log(`   DB_USER: ${process.env.DB_USER || 'NOT SET'}`);
    console.log(`   DB_NAME: ${process.env.DB_NAME || 'NOT SET'}`);
    console.log(`   PORT: ${process.env.PORT || 'NOT SET'}\n`);
  } catch (error) {
    console.log('❌ Failed to load .env:', error.message, '\n');
    allPassed = false;
  }

  // 5. Test MySQL connection
  console.log('🔌 [5/6] Testing MySQL connection...');
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });
    console.log('✅ MySQL server is reachable\n');
    await connection.end();
  } catch (error) {
    console.log('❌ MySQL connection FAILED!');
    console.log('   Error:', error.message);
    console.log('   Solution: Start MySQL in XAMPP Control Panel\n');
    allPassed = false;
    return; // Stop here if MySQL is not running
  }

  // 6. Test database existence
  console.log('🗄️  [6/6] Checking database...');
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'Technique',
    });
    console.log('✅ Database "Technique" exists and is accessible\n');
    
    // Check if tables exist
    const [tables] = await connection.query('SHOW TABLES');
    if (tables.length > 0) {
      console.log(`✅ Found ${tables.length} tables in database`);
      console.log('   Tables:', tables.map(t => Object.values(t)[0]).join(', '), '\n');
    } else {
      console.log('⚠️  Database exists but has NO TABLES');
      console.log('   Import database/database.sql in phpMyAdmin\n');
    }
    
    await connection.end();
  } catch (error) {
    console.log('❌ Database "Technique" NOT FOUND!');
    console.log('   Error:', error.message);
    console.log('   Solution: Create database in phpMyAdmin');
    console.log('   1. Go to http://localhost/phpmyadmin');
    console.log('   2. Click "New" → Create database "Technique"');
    console.log('   3. Import database/database.sql\n');
    allPassed = false;
  }

  // Final result
  console.log('╔════════════════════════════════════════╗');
  if (allPassed) {
    console.log('║  ✅ ALL CHECKS PASSED!               ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('\n🚀 Your backend should start successfully!');
    console.log('   Run: npm run dev\n');
  } else {
    console.log('║  ❌ SOME CHECKS FAILED               ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('\n⚠️  Fix the issues above before starting the server');
    console.log('   See TROUBLESHOOTING.md for detailed solutions\n');
  }
}

runDiagnostics().catch(error => {
  console.error('\n❌ Diagnostic tool error:', error.message);
  console.log('   This might indicate a serious configuration issue\n');
});
