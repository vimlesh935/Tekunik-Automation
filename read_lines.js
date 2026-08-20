const fs = require('fs');
const lines = fs.readFileSync('c:/Users/visha/Desktop/Tekunik/Automation/frontend/src/pages/AdminPanel.jsx', 'utf8').split('\n');
for (let i = 1895; i < Math.min(1935, lines.length); i++) {
  console.log(`${i+1}: ${JSON.stringify(lines[i])}`);
}
