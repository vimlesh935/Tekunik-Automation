const fs = require('fs');
const content = fs.readFileSync('src/services/couponService.js', 'utf8');
const lines = content.split('\n');
const matchingLines = lines.filter(l => 
  /sendMail|sendOtpEmail|transporter\.sendMail|sendTemplatedMessage|notifyUsers|sendCoupon|email/.test(l)
);
console.log('Lines with email/notification references:');
matchingLines.slice(0, 50).forEach((l, i) => console.log(`${i}: ${l.trim()}`));
