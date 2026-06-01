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
    // Use PowerShell to find processes using the port (works on all Windows)
    const psCommand = `powershell -Command "Get-NetTCPConnection -LocalPort ${PORT} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"`;
    
    const output = execSync(psCommand, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    
    if (output && output.trim()) {
      const pids = output.trim().split('\n').map(pid => pid.trim()).filter(pid => pid && !isNaN(pid));
      
      if (pids.length > 0) {
        console.log(`⚠️  Port ${PORT} is in use by ${pids.length} process(es)`);
        
        pids.forEach(pid => {
          try {
            console.log(`🔪 Killing process ${pid}...`);
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            console.log(`✅ Process ${pid} killed`);
          } catch (killError) {
            console.log(`⚠️  Could not kill PID ${pid}`);
          }
        });
        
        console.log(`✅ Port ${PORT} is now free\n`);
        
        // Wait 2 seconds for port to be fully released
        console.log(`⏳ Waiting 2 seconds for port to be released...`);
        execSync('timeout /t 2 /nobreak > nul', { stdio: 'ignore' });
        console.log(`✅ Ready to start server\n`);
      } else {
        console.log(`✅ Port ${PORT} is free\n`);
      }
    } else {
      console.log(`✅ Port ${PORT} is free\n`);
    }
  } catch (error) {
    // Port is free or PowerShell command failed
    console.log(`✅ Port ${PORT} appears to be free\n`);
  }
}

// Run if called directly
if (require.main === module) {
  killPort();
}

module.exports = killPort;
