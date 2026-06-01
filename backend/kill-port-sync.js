const { execSync } = require('child_process');

// Load environment variables
try {
  require('dotenv').config();
} catch (e) {
  console.log('⚠️  dotenv not available, using default port');
}

const PORT = process.env.PORT || 8787;

function killPort() {
  console.log(`\n🔍 Checking if port ${PORT} is in use...`);
  
  try {
    // Find all processes using the port
    const command = `netstat -ano | findstr :${PORT}`;
    const output = execSync(command, { encoding: 'utf8' });
    
    if (output) {
      const lines = output.split('\n').filter(line => line.trim() && line.includes('LISTENING'));
      
      if (lines.length > 0) {
        const pids = new Set();
        
        // Extract all PIDs
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && !isNaN(pid)) {
            pids.add(pid);
          }
        });
        
        // Kill each process
        pids.forEach(pid => {
          try {
            console.log(`⚠️  Port ${PORT} is in use by PID ${pid}`);
            console.log(`🔪 Killing process ${pid}...`);
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            console.log(`✅ Process ${pid} killed successfully`);
          } catch (killError) {
            console.log(`⚠️  Could not kill PID ${pid} (might already be dead)`);
          }
        });
        
        console.log(`✅ Port ${PORT} is now free\n`);
        
        // Wait for port to be fully released
        const waitTime = 3000;
        console.log(`⏳ Waiting ${waitTime/1000} seconds for port to be released...`);
        
        const start = Date.now();
        while (Date.now() - start < waitTime) {
          // Busy wait
        }
        
        console.log(`✅ Ready to start server\n`);
      } else {
        console.log(`✅ Port ${PORT} is free\n`);
      }
    } else {
      console.log(`✅ Port ${PORT} is free\n`);
    }
  } catch (error) {
    // If netstat returns nothing or error, port is likely free
    if (error.status === 1 || error.message.includes('findstr')) {
      console.log(`✅ Port ${PORT} is free\n`);
    } else {
      console.log(`⚠️  Could not check port status: ${error.message}`);
      console.log(`✅ Attempting to start server anyway...\n`);
    }
  }
}

// Run if called directly
if (require.main === module) {
  killPort();
  console.log('Done!');
}

module.exports = killPort;
