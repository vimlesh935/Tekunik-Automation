# 🔧 Backend Server Troubleshooting Guide

## ❌ Error: "backend stopped with code 1"

This error means the backend server crashed. Here are the most common causes and solutions:

---

## 📋 **STEP-BY-STEP FIX**

### **1. Check if XAMPP MySQL is Running**

✅ **Open XAMPP Control Panel**
- Start **Apache** (if not already running)
- Start **MySQL** (MUST be running)
- Both should show green "Running" status

❌ **If MySQL won't start:**
- Port 3306 might be in use
- Click "Config" → "my.ini" and change port to 3307
- Update `.env` file: `DB_HOST=localhost:3307`

---

### **2. Create Database**

✅ **Open phpMyAdmin:**
1. Go to: `http://localhost/phpmyadmin`
2. Click "New" in left sidebar
3. Database name: `Technique`
4. Collation: `utf8mb4_general_ci`
5. Click "Create"

✅ **Import Database Schema:**
1. Select `Technique` database
2. Click "Import" tab
3. Choose file: `database/database.sql`
4. Click "Go"

---

### **3. Install Backend Dependencies**

Open terminal in `backend` folder:

```bash
cd backend
npm install
```

**Required packages:**
- express
- mysql2
- bcrypt
- jsonwebtoken
- nodemailer
- cors
- cookie-parser
- dotenv
- multer

---

### **4. Check .env Configuration**

Verify `backend/.env` file exists with correct values:

```env
PORT=8787
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=Technique

SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
OTP_FROM=your-email@gmail.com

JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1d

ADMIN_EMAIL=admin@tekunik.com
ADMIN_SECRET_KEY=AutoAdmin2024!
```

---

### **5. Test Database Connection**

Create a test file `backend/test-db.js`:

```javascript
const mysql = require('mysql2/promise');

async function testDB() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'Technique'
    });
    console.log('✅ Database connection successful!');
    await connection.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testDB();
```

Run: `node test-db.js`

---

### **6. Check Port Availability**

**Windows:**
```bash
netstat -ano | findstr :8787
```

**If port is in use:**
- Kill the process: `taskkill /PID <PID> /F`
- Or change port in `.env`: `PORT=8788`

---

### **7. Start Backend Server**

```bash
cd backend
npm run dev
```

**Expected output:**
```
╔════════════════════════════════════════╗
║     SERVER STARTUP SEQUENCE          ║
╚════════════════════════════════════════╝

[STARTUP] Testing MySQL connection...
✅ [STARTUP] MySQL connection successful

[STARTUP] Ensuring users table is ready...
✅ [STARTUP] Database schema verified

╔════════════════════════════════════════╗
║  🚀 SERVER RUNNING ON PORT 8787       ║
╚════════════════════════════════════════╝
```

---

## 🐛 **Common Errors & Solutions**

### **Error: "ECONNREFUSED"**
❌ MySQL is not running
✅ Start MySQL in XAMPP

### **Error: "ER_BAD_DB_ERROR"**
❌ Database doesn't exist
✅ Create `Technique` database in phpMyAdmin

### **Error: "ER_ACCESS_DENIED_ERROR"**
❌ Wrong DB credentials
✅ Check DB_USER and DB_PASSWORD in `.env`

### **Error: "EADDRINUSE"**
❌ Port 8787 is already in use
✅ Kill process or change PORT in `.env`

### **Error: "Cannot find module"**
❌ Missing dependencies
✅ Run `npm install` in backend folder

### **Error: "bcrypt error"**
❌ bcrypt installation issue
✅ Run: `npm rebuild bcrypt`

---

## 🔄 **Complete Reset (If Nothing Works)**

```bash
# 1. Stop all servers
# Press Ctrl+C in all terminals

# 2. Delete node_modules
cd backend
rmdir /s /q node_modules
del package-lock.json

# 3. Reinstall
npm install

# 4. Restart XAMPP MySQL

# 5. Recreate database
# Drop and recreate Technique database in phpMyAdmin

# 6. Start server
npm run dev
```

---

## ✅ **Verification Checklist**

- [ ] XAMPP MySQL is running (green in control panel)
- [ ] Database `Technique` exists in phpMyAdmin
- [ ] All tables created (users, products, orders, etc.)
- [ ] `backend/.env` file exists with correct values
- [ ] `backend/node_modules` folder exists
- [ ] Port 8787 is available
- [ ] No other process using port 8787
- [ ] Backend starts without errors

---

## 📞 **Still Having Issues?**

Check the error message in terminal:
1. Read the error carefully
2. Look for keywords: "ECONNREFUSED", "ER_BAD_DB_ERROR", "EADDRINUSE"
3. Follow the specific solution above
4. Check `backend/backend-dev.err.log` for detailed errors

---

## 🚀 **Quick Start Command**

After fixing all issues, start everything:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8787/health
- phpMyAdmin: http://localhost/phpmyadmin

---

## 📝 **Notes**

- Always start XAMPP MySQL BEFORE starting backend
- Keep XAMPP running while developing
- Backend must be running for frontend to work
- Check console for any error messages
