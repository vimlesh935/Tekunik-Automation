const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Load environment variables
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available, use default
}

const PORT = process.env.PORT || 8787;

async function killPort() {
  console.log(`\n🔍 Checking if port ${PORT} is in use...`);
  
  try {
    // Find process using the port
    const { stdout } = await execPromise(`netstat -ano | findstr :${PORT}`);
    
    if (stdout) {
      // Extract PID from netstat output
      const lines = stdout.split('\n').filter(line => line.includes('LISTENING'));
      
      if (lines.length > 0) {
        const pidMatch = lines[0].trim().split(/\s+/);
        const pid = pidMatch[pidMatch.length - 1];
        
        console.log(`⚠️  Port ${PORT} is in use by PID ${pid}`);
        console.log(`🔪 Killing process...`);
        
        // Kill the process
        await execPromise(`taskkill /F /PID ${pid}`);
        
        console.log(`✅ Process killed successfully`);
        console.log(`✅ Port ${PORT} is now free\n`);
        
        // Wait a moment for the port to be released
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log(`✅ Port ${PORT} is free\n`);
      }
    } else {
      console.log(`✅ Port ${PORT} is free\n`);
    }
  } catch (error) {
    // If netstat returns nothing, port is free
    if (error.stdout === '') {
      console.log(`✅ Port ${PORT} is free\n`);
    } else {
      console.error(`❌ Error checking port:`, error.message);
    }
  }
}

// Run if called directly
if (require.main === module) {
  killPort().then(() => {
    console.log('Done!');
  }).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

module.exports = killPort;
