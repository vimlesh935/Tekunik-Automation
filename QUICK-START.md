# 🚀 QUICK START GUIDE - Fix Backend Error

## ⚡ **FASTEST FIX (Do This First)**

### **Step 1: Start XAMPP MySQL**
1. Open **XAMPP Control Panel**
2. Click **Start** next to **MySQL**
3. Wait for green **"Running"** status
4. ✅ MySQL must be running!

### **Step 2: Create Database**
1. Open browser: `http://localhost/phpmyadmin`
2. Click **"New"** in left sidebar
3. Database name: **`Technique`**
4. Click **"Create"**

### **Step 3: Import Database**
1. Select **`Technique`** database
2. Click **"Import"** tab
3. Click **"Choose File"**
4. Select: `database/database.sql`
5. Click **"Go"** at bottom

### **Step 4: Install Dependencies**
Open terminal in project root:
```bash
cd backend
npm install
```

### **Step 5: Run Diagnostics**
```bash
node diagnose.js
```

### **Step 6: Start Server**
```bash
npm run dev
```

---

## 🔧 **If Still Not Working**

### **Option A: Use Startup Script (Easiest)**
Double-click: `start-servers.bat`

This will:
- ✅ Check if MySQL is running
- ✅ Install dependencies if missing
- ✅ Run diagnostics
- ✅ Start both servers automatically

### **Option B: Manual Fix**

#### **1. Check Port 8787**
```bash
# Windows
netstat -ano | findstr :8787
```

If port is in use:
```bash
# Kill the process (replace <PID> with actual number)
taskkill /PID <PID> /F
```

#### **2. Rebuild bcrypt (if error)**
```bash
cd backend
npm rebuild bcrypt
```

#### **3. Clear and Reinstall**
```bash
cd backend
rmdir /s /q node_modules
del package-lock.json
npm install
```

#### **4. Check .env File**
Make sure `backend/.env` exists with:
```env
PORT=8787
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=Technique
```

---

## ✅ **Verify Everything Works**

### **Test 1: Check MySQL**
```bash
cd backend
node diagnose.js
```

Should show all ✅ green checkmarks

### **Test 2: Start Backend**
```bash
cd backend
npm run dev
```

Should show:
```
╔════════════════════════════════════════╗
║  🚀 SERVER RUNNING ON PORT 8787       ║
╚════════════════════════════════════════╝
```

### **Test 3: Test API**
Open browser: `http://localhost:8787/health`

Should show:
```json
{"success":true,"message":"API is running"}
```

### **Test 4: Start Frontend**
```bash
cd frontend
npm run dev
```

Should show:
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

---

## 🐛 **Common Errors & Quick Fixes**

| Error | Quick Fix |
|-------|-----------|
| `ECONNREFUSED` | Start MySQL in XAMPP |
| `ER_BAD_DB_ERROR` | Create `Technique` database |
| `EADDRINUSE` | Kill process on port 8787 |
| `Cannot find module` | Run `npm install` |
| `bcrypt error` | Run `npm rebuild bcrypt` |

---

## 📞 **Still Having Issues?**

1. **Read the error message** in terminal
2. **Check TROUBLESHOOTING.md** for detailed solutions
3. **Run diagnostics**: `node diagnose.js`
4. **Check logs**: `backend/backend-dev.err.log`

---

## 🎯 **Final Checklist**

Before starting servers, verify:

- [ ] XAMPP MySQL is **running** (green status)
- [ ] Database `Technique` **exists** in phpMyAdmin
- [ ] Tables are **imported** (users, products, orders, etc.)
- [ ] `backend/.env` file **exists**
- [ ] `backend/node_modules` folder **exists**
- [ ] Port **8787** is **available**
- [ ] No errors when running `node diagnose.js`

---

## 🚀 **Start Everything**

### **Method 1: Automatic (Recommended)**
```bash
# Double-click this file:
start-servers.bat
```

### **Method 2: Manual**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### **Access Your App**
- 🌐 Frontend: http://localhost:5173
- 🔌 Backend API: http://localhost:8787/health
- 💾 Database: http://localhost/phpmyadmin

---

## ✨ **Success!**

If you see:
- ✅ Backend: "SERVER RUNNING ON PORT 8787"
- ✅ Frontend: "VITE ready"
- ✅ Browser opens automatically

**You're all set! 🎉**

---

## 💡 **Pro Tips**

1. **Always start XAMPP MySQL first**
2. **Keep XAMPP running** while developing
3. **Don't close terminal windows** while servers are running
4. **Use Ctrl+C** to stop servers gracefully
5. **Check console** for any error messages

---

Need more help? Check **TROUBLESHOOTING.md** for detailed solutions!
