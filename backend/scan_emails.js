const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const results = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(full);
    } else if (e.name.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      const matchingLines = lines.filter(l => 
        /sendMail|sendOtpEmail|transporter\.sendMail|sendTemplatedMessage|\.sendMail\(|notifyUsers|sendCoupon|backInStock/.test(l)
      );
      if (matchingLines.length > 0) {
        results.push({
          file: full.replace(srcDir, ''),
          matches: matchingLines.map(l => l.trim()).slice(0, 10)
        });
      }
    }
  }
}

walk(srcDir);
console.log(JSON.stringify(results, null, 2));
