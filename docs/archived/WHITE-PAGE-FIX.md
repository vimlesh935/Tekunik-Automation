# 🔍 WHITE PAGE ISSUE - COMPLETE FIX GUIDE

## 🎯 Quick Fix (Try This First)

### Option 1: Automated Fix
```bash
Double-click: FIX-WHITE-PAGE.bat
```
This will:
- Clear all caches
- Reinstall dependencies
- Restart frontend server
- Open browser automatically

### Option 2: Manual Fix
```bash
# 1. Stop frontend server (Ctrl+C)

# 2. Clear cache
cd frontend
rmdir /s /q node_modules
rmdir /s /q dist
rmdir /s /q .vite

# 3. Reinstall
npm install

# 4. Start server
npm run dev

# 5. Hard refresh browser (Ctrl+Shift+R)
```

---

## 🐛 Common Causes & Solutions

### 1. **Backend Not Running**
**Symptom:** White page, API calls fail in console

**Solution:**
```bash
cd backend
npm run dev
```
✅ Backend must be running BEFORE frontend

---

### 2. **Browser Cache**
**Symptom:** White page, no console errors

**Solution:**
- Press `Ctrl+Shift+R` (hard refresh)
- Or `Ctrl+F5`
- Or clear browser cache completely:
  - Chrome: Settings → Privacy → Clear browsing data
  - Firefox: Settings → Privacy → Clear Data
  - Edge: Settings → Privacy → Clear browsing data

---

### 3. **JavaScript Errors**
**Symptom:** White page with console errors

**Solution:**
1. Press `F12` to open DevTools
2. Go to "Console" tab
3. Look for red error messages
4. Common errors:

**Error: "Failed to fetch"**
```
→ Backend is not running
→ Start backend: cd backend && npm run dev
```

**Error: "Cannot find module"**
```
→ Dependencies missing
→ Run: cd frontend && npm install
```

**Error: "Unexpected token"**
```
→ Syntax error in code
→ Check recent changes
```

---

### 4. **Port Conflicts**
**Symptom:** Server won't start or crashes

**Solution:**
```bash
# Kill port 5173
powershell -Command "Get-NetTCPConnection -LocalPort 5173 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"

# Then restart
cd frontend
npm run dev
```

---

### 5. **Missing Dependencies**
**Symptom:** White page, module errors in console

**Solution:**
```bash
cd frontend
npm install
```

---

### 6. **Vite Cache Issues**
**Symptom:** Changes not reflecting, white page

**Solution:**
```bash
cd frontend
rmdir /s /q .vite
rmdir /s /q dist
npm run dev
```

---

## 🔧 Diagnostic Steps

### Step 1: Check Browser Console
1. Open page: http://localhost:5173
2. Press `F12`
3. Click "Console" tab
4. Look for errors (red text)

**No errors?** → Go to Step 2
**Has errors?** → Read error message and fix accordingly

---

### Step 2: Check Network Tab
1. Press `F12`
2. Click "Network" tab
3. Refresh page (`Ctrl+R`)
4. Look for failed requests (red)

**All green?** → Go to Step 3
**Has red?** → Check which API is failing

---

### Step 3: Check Backend
```bash
# Test backend health
curl http://localhost:8787/health

# Or open in browser:
http://localhost:8787/health
```

**Response OK?** → Backend is working
**No response?** → Start backend

---

### Step 4: Check Frontend Server
Look at the terminal where frontend is running:

**Good output:**
```
VITE v6.x.x ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Bad output:**
```
Error: EADDRINUSE
Port 5173 is already in use
```
→ Kill port and restart

---

## 🎯 Test Checklist

Run through this checklist:

- [ ] Backend is running on port 8787
- [ ] Frontend is running on port 5173
- [ ] Browser console has no errors (F12)
- [ ] Network tab shows successful requests
- [ ] Hard refresh done (Ctrl+Shift+R)
- [ ] Cache cleared
- [ ] Dependencies installed (`node_modules` exists)

---

## 🚀 Complete Reset (Nuclear Option)

If nothing works, do a complete reset:

```bash
# 1. Stop all servers (Ctrl+C in all terminals)

# 2. Kill all ports
powershell -Command "Get-NetTCPConnection -LocalPort 5173 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"
powershell -Command "Get-NetTCPConnection -LocalPort 8787 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"

# 3. Clean frontend
cd frontend
rmdir /s /q node_modules
rmdir /s /q dist
rmdir /s /q .vite
npm install

# 4. Clean backend
cd ../backend
rmdir /s /q node_modules
npm install

# 5. Start backend
npm run dev

# 6. Start frontend (new terminal)
cd ../frontend
npm run dev

# 7. Clear browser cache and hard refresh
```

---

## 📊 Expected Behavior

### When Everything Works:

**Backend Terminal:**
```
╔════════════════════════════════════════╗
║  🚀 SERVER RUNNING ON PORT 8787       ║
╚════════════════════════════════════════╝

Frontend:  http://localhost:5173
API:       http://localhost:8787
Health:    http://localhost:8787/health
```

**Frontend Terminal:**
```
VITE v6.x.x ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Browser:**
- Shows Tekunik homepage
- No console errors
- Can navigate pages
- Can see products

---

## 🆘 Still Not Working?

### Debug Mode:

1. **Test with diagnostic page:**
   ```
   http://localhost:5173/test.html
   ```
   This will run automated tests

2. **Check file structure:**
   ```bash
   cd frontend
   dir src\main.jsx
   dir src\index.css
   dir index.html
   ```
   All files should exist

3. **Check package.json:**
   ```bash
   cd frontend
   type package.json
   ```
   Should have all dependencies

4. **Test backend directly:**
   ```
   http://localhost:8787/health
   ```
   Should return JSON response

---

## 💡 Prevention Tips

1. **Always start backend first**, then frontend
2. **Keep terminals open** while developing
3. **Use hard refresh** (Ctrl+Shift+R) after changes
4. **Clear cache** if things look weird
5. **Check console** (F12) for errors regularly

---

## 🎉 Success Indicators

You'll know it's working when:

✅ Backend shows "SERVER RUNNING ON PORT 8787"
✅ Frontend shows "Local: http://localhost:5173/"
✅ Browser shows Tekunik homepage (not white page)
✅ Console has no red errors (F12)
✅ Can navigate to /shop, /login, etc.
✅ Can see products and categories

---

## 📞 Quick Commands Reference

```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Kill port 5173
powershell -Command "Get-NetTCPConnection -LocalPort 5173 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"

# Kill port 8787
powershell -Command "Get-NetTCPConnection -LocalPort 8787 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"

# Clear frontend cache
cd frontend && rmdir /s /q .vite && rmdir /s /q dist

# Reinstall frontend
cd frontend && rmdir /s /q node_modules && npm install

# Hard refresh browser
Ctrl+Shift+R or Ctrl+F5

# Open DevTools
F12
```

---

## ✅ Most Common Fix

**90% of white page issues are solved by:**

1. Making sure backend is running
2. Hard refresh (Ctrl+Shift+R)
3. Clearing browser cache

**Try these three things first!**
