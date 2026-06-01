# 🌐 FRONTEND-BACKEND CONNECTION GUIDE

## ✅ **YOUR SERVERS ARE CONFIGURED CORRECTLY!**

### **Current Configuration:**

```
Frontend:  http://localhost:5173  (Vite Dev Server)
Backend:   http://localhost:8787  (Express API Server)
Database:  localhost:3306          (MySQL via XAMPP)
```

---

## 🔗 **HOW THEY CONNECT**

### **1. Frontend → Backend Connection**

Your `frontend/vite.config.js` is already configured with proxy:

```javascript
server: {
  proxy: {
    "/api": "http://localhost:8787",      // All /api/* requests
    "/login": "http://localhost:8787",    // Login endpoint
    "/register": "http://localhost:8787", // Register endpoint
    "/health": "http://localhost:8787",   // Health check
    // ... more routes
  }
}
```

**What this means:**
- ✅ Frontend makes requests to `/api/products`
- ✅ Vite proxy forwards to `http://localhost:8787/api/products`
- ✅ Backend responds with data
- ✅ Frontend receives the response

### **2. Backend → Database Connection**

Your `backend/.env` configures MySQL:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=Technique
```

**Connection flow:**
- ✅ Backend connects to MySQL on port 3306
- ✅ Uses database "Technique"
- ✅ Executes queries
- ✅ Returns data to frontend

---

## 🚀 **HOW TO START EVERYTHING**

### **Method 1: One-Click Start (EASIEST)**

```bash
# Just double-click this file:
START-FULL-STACK.bat
```

**This will:**
1. ✅ Kill any processes on ports 8787 and 5173
2. ✅ Check if MySQL is running
3. ✅ Install dependencies if needed
4. ✅ Verify database exists
5. ✅ Start backend server (port 8787)
6. ✅ Start frontend server (port 5173)
7. ✅ Open browser automatically

### **Method 2: Manual Start**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## 🔍 **VERIFY CONNECTION**

### **Test 1: Backend Health Check**

Open browser: `http://localhost:8787/health`

**Expected response:**
```json
{
  "success": true,
  "message": "API is running"
}
```

### **Test 2: Frontend Access**

Open browser: `http://localhost:5173`

**Expected:**
- ✅ Home page loads
- ✅ Products display
- ✅ No console errors

### **Test 3: API Connection**

Open browser console (F12) and run:

```javascript
fetch('/api/products')
  .then(r => r.json())
  .then(d => console.log(d))
```

**Expected:**
- ✅ Products data returned
- ✅ No CORS errors
- ✅ No 404 errors

---

## 📊 **CONNECTION FLOW DIAGRAM**

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER                             │
│                 http://localhost:5173                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Request: /api/products
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              VITE DEV SERVER (Frontend)                     │
│                   Port: 5173                                │
│                                                             │
│  • Serves React application                                │
│  • Proxies API requests to backend                         │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Proxy to: http://localhost:8787/api/products
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              EXPRESS SERVER (Backend)                       │
│                   Port: 8787                                │
│                                                             │
│  • Handles API requests                                    │
│  • Authenticates users (JWT)                               │
│  • Queries database                                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ SQL Query
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              MYSQL DATABASE (XAMPP)                         │
│                   Port: 3306                                │
│                                                             │
│  • Database: Technique                                     │
│  • Tables: users, products, orders, etc.                   │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Data Response
                          ↓
                    (Back to Browser)
```

---

## 🛠️ **API ENDPOINTS**

### **Public Endpoints (No Auth Required)**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get product by ID |
| GET | `/api/categories` | Get all categories |
| POST | `/register` | Register new user |
| POST | `/login` | User login |

### **Protected Endpoints (Auth Required)**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get user profile |
| PUT | `/api/user/profile` | Update profile |
| GET | `/api/user/orders` | Get user orders |
| GET | `/api/cart` | Get cart items |
| POST | `/api/cart/add` | Add to cart |
| DELETE | `/api/cart/item/:id` | Remove from cart |

### **Admin Endpoints (Admin Auth Required)**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/dashboard/stats` | Dashboard stats |
| GET | `/api/admin/products` | Manage products |
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/:id` | Update product |
| DELETE | `/api/admin/products/:id` | Delete product |

---

## 🔐 **AUTHENTICATION FLOW**

### **User Login:**

```
1. User enters email/password
   ↓
2. Frontend sends POST to /login
   ↓
3. Backend validates credentials
   ↓
4. Backend generates JWT token
   ↓
5. Frontend stores token in localStorage
   ↓
6. Frontend includes token in all API requests
   ↓
7. Backend verifies token for protected routes
```

### **Token Storage:**

```javascript
// Frontend stores token
localStorage.setItem('authToken', token);

// Frontend sends token with requests
headers: {
  'Authorization': `Bearer ${token}`
}

// Backend verifies token
const token = req.headers.authorization?.split(' ')[1];
const decoded = jwt.verify(token, JWT_SECRET);
```

---

## 📁 **FILE STRUCTURE**

```
Tekunik/
├── backend/                    # Express API Server
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js          # MySQL connection
│   │   │   └── env.js         # Environment config
│   │   ├── routes/
│   │   │   ├── authRoutes.js  # /login, /register
│   │   │   ├── productRoutes.js # /api/products
│   │   │   └── cartRoutes.js  # /api/cart
│   │   └── middleware/
│   │       └── authMiddleware.js # JWT verification
│   ├── .env                   # Backend config
│   └── server.js              # Main server file
│
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js         # API calls
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Shop.jsx
│   │   │   └── Login.jsx
│   │   └── components/
│   │       ├── Navbar.jsx
│   │       └── Footer.jsx
│   ├── vite.config.js         # Proxy configuration
│   └── package.json
│
└── database/
    └── database.sql           # Database schema
```

---

## ✅ **VERIFICATION CHECKLIST**

Before starting, ensure:

- [ ] XAMPP MySQL is running (green in control panel)
- [ ] Database "Technique" exists
- [ ] Tables are imported from database.sql
- [ ] `backend/.env` file exists with correct values
- [ ] `backend/node_modules` folder exists
- [ ] `frontend/node_modules` folder exists
- [ ] Ports 8787 and 5173 are free

---

## 🚀 **START YOUR SERVERS**

```bash
# EASIEST WAY:
Double-click: START-FULL-STACK.bat

# This will:
✅ Clean up ports
✅ Check MySQL
✅ Install dependencies
✅ Start backend (8787)
✅ Start frontend (5173)
✅ Open browser
```

---

## 🌐 **ACCESS YOUR APPLICATION**

Once servers are running:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Main website |
| **Backend API** | http://localhost:8787 | REST API |
| **Health Check** | http://localhost:8787/health | API status |
| **Database** | http://localhost/phpmyadmin | MySQL admin |

---

## 🎯 **TESTING THE CONNECTION**

### **Test 1: Home Page**
1. Open: http://localhost:5173
2. Should see: Home page with products
3. Check console: No errors

### **Test 2: Shop Page**
1. Go to: http://localhost:5173/shop
2. Should see: Product grid
3. Products load from backend

### **Test 3: Login**
1. Go to: http://localhost:5173/login
2. Enter credentials
3. Should login successfully
4. Token stored in localStorage

### **Test 4: Cart**
1. Add product to cart
2. Go to: http://localhost:5173/cart
3. Should see cart items
4. Data from backend

---

## 🐛 **TROUBLESHOOTING**

### **Frontend can't connect to backend**

**Symptoms:**
- Network errors in console
- "Failed to fetch" errors
- 404 errors

**Solution:**
1. Check backend is running on port 8787
2. Check `vite.config.js` proxy settings
3. Restart both servers

### **Backend can't connect to database**

**Symptoms:**
- "ECONNREFUSED" error
- "ER_BAD_DB_ERROR"

**Solution:**
1. Start MySQL in XAMPP
2. Create "Technique" database
3. Import database.sql

### **CORS errors**

**Symptoms:**
- "CORS policy" errors in console

**Solution:**
- Already fixed! Backend has CORS enabled
- Vite proxy handles requests
- No CORS issues should occur

---

## 🎉 **YOU'RE ALL SET!**

Your frontend and backend are properly connected!

**Just run:**
```bash
START-FULL-STACK.bat
```

**And enjoy your application! 🚀**

---

## 📞 **NEED HELP?**

- **Connection issues:** Check this guide
- **Port errors:** Read ULTIMATE-PORT-FIX.md
- **Database errors:** Read TROUBLESHOOTING.md
- **General help:** Read README.md
