# 🚀 Tekunik Automation - Complete Setup Guide

## 🎯 **Quick Fix for "backend stopped with code 1"**

### **The Problem**
Your backend server is crashing because one of these is wrong:
- ❌ MySQL is not running
- ❌ Database doesn't exist
- ❌ Dependencies not installed
- ❌ Port is already in use

### **The Solution (5 Minutes)**

#### **Step 1: Start MySQL** ⚡
1. Open **XAMPP Control Panel**
2. Click **Start** next to **MySQL**
3. Wait for green **"Running"** status

#### **Step 2: Create Database** 💾
1. Open: `http://localhost/phpmyadmin`
2. Click **"New"** → Database name: **`Technique`**
3. Click **"Create"**
4. Select `Technique` → Click **"Import"**
5. Choose file: `database/database.sql` → Click **"Go"**

#### **Step 3: Install & Start** 🔧
```bash
# Option A: Automatic (Easiest)
Double-click: start-servers.bat

# Option B: Manual
cd backend
npm install
node diagnose.js
npm run dev
```

**Done! ✅** Your server should now be running on `http://localhost:8787`

---

## 📋 **Complete Setup Instructions**

### **Prerequisites**
- ✅ Node.js (v16 or higher)
- ✅ XAMPP (for MySQL)
- ✅ Git (optional)

### **1. Install XAMPP**
1. Download from: https://www.apachefriends.org/
2. Install with default settings
3. Start **Apache** and **MySQL**

### **2. Create Database**
```sql
-- In phpMyAdmin (http://localhost/phpmyadmin)
CREATE DATABASE Technique;
USE Technique;
-- Then import database/database.sql
```

### **3. Install Dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### **4. Configure Environment**
Create `backend/.env`:
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

### **5. Start Servers**
```bash
# Method 1: Automatic
start-servers.bat

# Method 2: Manual
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

---

## 🛠️ **Troubleshooting Tools**

### **Quick Check**
```bash
check-system.bat
```
Verifies MySQL, dependencies, and configuration.

### **Full Diagnostics**
```bash
cd backend
node diagnose.js
```
Runs comprehensive system check.

### **Auto Start**
```bash
start-servers.bat
```
Checks everything and starts both servers.

---

## 🐛 **Common Errors & Solutions**

### **Error: ECONNREFUSED**
```
❌ Problem: MySQL is not running
✅ Solution: Start MySQL in XAMPP Control Panel
```

### **Error: ER_BAD_DB_ERROR**
```
❌ Problem: Database 'Technique' doesn't exist
✅ Solution: Create database in phpMyAdmin
   1. Go to http://localhost/phpmyadmin
   2. Click "New" → Name: "Technique"
   3. Import database/database.sql
```

### **Error: EADDRINUSE**
```
❌ Problem: Port 8787 is already in use
✅ Solution: Kill the process
   Windows: netstat -ano | findstr :8787
           taskkill /PID <PID> /F
   Or change PORT in .env to 8788
```

### **Error: Cannot find module**
```
❌ Problem: Dependencies not installed
✅ Solution: npm install
   cd backend
   npm install
```

### **Error: bcrypt**
```
❌ Problem: bcrypt compilation issue
✅ Solution: Rebuild bcrypt
   cd backend
   npm rebuild bcrypt
```

---

## 📁 **Project Structure**

```
Tekunik/
├── backend/
│   ├── src/
│   │   ├── config/      # Database, env config
│   │   ├── controllers/ # Business logic
│   │   ├── middleware/  # Auth, error handling
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Email, OTP services
│   │   └── utils/       # Helper functions
│   ├── uploads/         # Product images
│   ├── .env            # Environment variables
│   ├── server.js       # Main server file
│   └── diagnose.js     # Diagnostic tool
├── frontend/
│   ├── src/
│   │   ├── components/  # Navbar, Footer
│   │   ├── pages/       # All pages
│   │   ├── services/    # API calls
│   │   └── index.css    # Global styles
│   └── vite.config.js
├── database/
│   └── database.sql     # Database schema
├── start-servers.bat    # Auto-start script
├── check-system.bat     # Quick check
├── QUICK-START.md       # Quick start guide
└── TROUBLESHOOTING.md   # Detailed solutions
```

---

## 🌐 **Access Points**

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Main website |
| Backend API | http://localhost:8787 | REST API |
| Health Check | http://localhost:8787/health | API status |
| phpMyAdmin | http://localhost/phpmyadmin | Database admin |

---

## 🔐 **Default Credentials**

### **Admin Panel**
- Email: `admin@tekunik.com`
- Secret Key: `AutoAdmin2024!`
- Access: http://localhost:5173/admin-login

### **Database**
- Host: `localhost`
- User: `root`
- Password: *(empty)*
- Database: `Technique`

---

## 📝 **Development Workflow**

### **Daily Startup**
1. Start XAMPP (MySQL)
2. Run `start-servers.bat`
3. Open http://localhost:5173

### **Making Changes**
- Frontend: Changes auto-reload (Vite HMR)
- Backend: Restart server after changes
- Database: Use phpMyAdmin

### **Stopping Servers**
- Press `Ctrl+C` in terminal
- Or close terminal windows

---

## 🎨 **Features**

### **Frontend**
- ✅ Modern glassmorphism design
- ✅ Responsive layout (mobile-first)
- ✅ Smooth animations
- ✅ Product catalog with search
- ✅ Shopping cart
- ✅ User authentication
- ✅ Admin panel

### **Backend**
- ✅ RESTful API
- ✅ JWT authentication
- ✅ Email OTP verification
- ✅ Product management
- ✅ Order processing
- ✅ Inventory tracking
- ✅ Admin dashboard

---

## 📚 **Documentation**

- **QUICK-START.md** - Fast setup guide
- **TROUBLESHOOTING.md** - Detailed error solutions
- **database/database.sql** - Database schema

---

## 🆘 **Getting Help**

### **Step 1: Run Diagnostics**
```bash
cd backend
node diagnose.js
```

### **Step 2: Check Logs**
```bash
# Backend logs
backend/backend-dev.log
backend/backend-dev.err.log
```

### **Step 3: Verify Checklist**
- [ ] XAMPP MySQL running (green)
- [ ] Database `Technique` exists
- [ ] Tables imported (20+ tables)
- [ ] `backend/.env` exists
- [ ] `backend/node_modules` exists
- [ ] Port 8787 available
- [ ] No errors in `node diagnose.js`

---

## ✅ **Success Indicators**

### **Backend Started Successfully**
```
╔════════════════════════════════════════╗
║  🚀 SERVER RUNNING ON PORT 8787       ║
╚════════════════════════════════════════╝
Frontend URL: http://localhost:5173
API Health: http://localhost:8787/health
```

### **Frontend Started Successfully**
```
VITE v5.x.x ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### **Everything Working**
- ✅ Backend console shows no errors
- ✅ Frontend opens in browser
- ✅ Can navigate pages
- ✅ Can login/register
- ✅ Products load correctly

---

## 🚀 **You're Ready!**

If you see all success indicators above, your application is running perfectly!

**Next Steps:**
1. Browse products: http://localhost:5173/shop
2. Create account: http://localhost:5173/register
3. Admin panel: http://localhost:5173/admin-login

---

## 💡 **Pro Tips**

1. **Always start XAMPP MySQL first** before backend
2. **Keep terminals open** while developing
3. **Use `start-servers.bat`** for easy startup
4. **Check console** for any error messages
5. **Run diagnostics** if something breaks

---

## 📞 **Still Having Issues?**

1. Read the error message carefully
2. Check **TROUBLESHOOTING.md**
3. Run `node diagnose.js`
4. Verify all checklist items above
5. Check if XAMPP MySQL is running

---

**Happy Coding! 🎉**
