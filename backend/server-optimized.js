const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const env = require("./src/config/env");
const { testConnection, pool } = require("./src/config/db");
const { ensureUsersOtpColumns, ensureAdminTables } = require("./src/config/migrate");
const { verifyTransporter } = require("./src/services/mailService");
const { ensureUploadsDir } = require("./src/utils/uploadPaths");

// Auth routes
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const publicRoutes = require("./src/routes/publicRoutes");

// Admin panel API routes
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const productRoutes = require("./src/routes/productRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const userAdminRoutes = require("./src/routes/userAdminRoutes");
const uploadRoutes = require("./src/routes/uploadRoutes");
const inventoryRoutes = require("./src/routes/inventoryRoutes");
const discountRoutes = require("./src/routes/discountRoutes");
const cartRoutes = require("./src/routes/cartRoutes");
const userRoutes = require("./src/routes/userRoutes");

const requestLogger = require("./src/middleware/requestLogger");
const responseNormalizer = require("./src/middleware/responseNormalizer");
const simpleCookieParser = require("./src/middleware/simpleCookieParser");
const { notFound, errorHandler } = require("./src/middleware/errorMiddleware");

let cors = null;
let cookieParser = null;
let compression = null;
let helmet = null;

try {
  cors = require("cors");
  cookieParser = require("cookie-parser");
  compression = require("compression");
  helmet = require("helmet");
} catch (error) {
  console.warn("⚠️  Some optional packages not installed. Run: npm install");
}

const app = express();
const distDir = path.join(__dirname, "..", "frontend", "dist");

// ═══════════════════════════════════════════════════════════════
// SECURITY & PERFORMANCE MIDDLEWARE
// ═══════════════════════════════════════════════════════════════

// Security headers
if (helmet) {
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
    crossOriginEmbedderPolicy: false,
  }));
}

// Response compression
if (compression) {
  app.use(compression());
}

// CORS configuration
if (cors) {
  app.use(
    cors({
      origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
          env.frontendUrl,
          'http://localhost:5173',
          'http://localhost:3000',
          'http://127.0.0.1:5173',
        ];
        
        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(null, true); // Allow all in development
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
} else {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin || env.frontendUrl);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
}

// Request timeout (30 seconds)
app.use((req, res, next) => {
  req.setTimeout(30000);
  res.setTimeout(30000);
  next();
});

// Body parsing
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser ? cookieParser() : simpleCookieParser);

// Request logging
app.use(requestLogger);

// Response normalization
app.use(responseNormalizer);

// ═══════════════════════════════════════════════════════════════
// HEALTH & MONITORING ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// Health check
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    await pool.query("SELECT 1");
    
    res.json({
      success: true,
      message: "API is running",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + "MB",
      },
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Service unavailable",
      database: "disconnected",
    });
  }
});

// Detailed status (admin only in production)
app.get("/status", async (req, res) => {
  try {
    const [dbStatus] = await pool.query("SELECT VERSION() as version");
    
    res.json({
      success: true,
      server: {
        environment: env.nodeEnv,
        port: env.port,
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        pid: process.pid,
      },
      database: {
        connected: true,
        version: dbStatus.version,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Status check failed",
      error: error.message,
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════

// Auth Routes
app.use(authRoutes);

// Admin Auth + Token
app.use(adminRoutes);

// Public API Routes (no auth required)
app.use(publicRoutes);

// User API Routes (JWT-protected)
app.use(userRoutes);

// Admin API Routes (JWT-protected)
app.use(dashboardRoutes);
app.use(productRoutes);
app.use(categoryRoutes);
app.use(orderRoutes);
app.use(userAdminRoutes);
app.use(inventoryRoutes);
app.use(discountRoutes);
app.use(cartRoutes);
app.use('/api/admin/upload', uploadRoutes);

// ═══════════════════════════════════════════════════════════════
// STATIC FILES & UPLOADS
// ═══════════════════════════════════════════════════════════════

// Ensure uploads directory exists
const uploadDir = ensureUploadsDir();
app.use('/uploads', express.static(uploadDir, {
  fallthrough: false,
  maxAge: env.nodeEnv === "production" ? "7d" : 0,
}));

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log("✅ Created logs directory");
}

// ═══════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════

// 404 handler for unmatched API routes
app.use(notFound);

// SPA static files (production build)
app.use(express.static(distDir));

// SPA fallback
app.use((req, res, next) => {
  const indexPath = path.join(distDir, "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

// Global error handler (must be last)
app.use(errorHandler);

// ═══════════════════════════════════════════════════════════════
// PORT CLEANUP UTILITY
// ═══════════════════════════════════════════════════════════════

const { execSync } = require('child_process');

const killPort = async (port) => {
  console.log(`🔍 Checking if port ${port} is in use...`);
  
  try {
    // Use PowerShell to find and kill processes
    const psCommand = `powershell -Command "$procs = Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($procs) { $procs | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"`;
    
    execSync(psCommand, { stdio: 'ignore' });
    console.log(`✅ Port ${port} is now free\n`);
    
    // Wait for port to be fully released
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    // Port is already free or cleanup completed
    console.log(`✅ Port ${port} is ready\n`);
  }
};

// ═══════════════════════════════════════════════════════════════
// SERVER STARTUP
// ═══════════════════════════════════════════════════════════════

const startServer = async () => {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║   SERVER STARTUP SEQUENCE            ║");
  console.log("╚════════════════════════════════════════╝\n");
  
  // Kill port before starting
  await killPort(env.port);

  let startupErrors = [];

  // Test MySQL connection
  try {
    console.log("[1/4] Testing MySQL connection...");
    await testConnection();
    console.log("✅ MySQL connection successful\n");
  } catch (error) {
    console.error("❌ MySQL connection failed:", error.message);
    console.error("   Ensure XAMPP MySQL is running and database 'Technique' exists\n");
    startupErrors.push("MySQL connection failed");
  }

  // Run database migrations
  try {
    console.log("[2/4] Verifying database schema...");
    await ensureUsersOtpColumns();
    await ensureAdminTables();
    console.log("✅ Database schema verified\n");
  } catch (error) {
    console.error("❌ Database schema check failed:", error.message, "\n");
    startupErrors.push("Database schema check failed");
  }

  // Verify Gmail SMTP (non-blocking)
  try {
    console.log("[3/4] Verifying email service...");
    await verifyTransporter();
    console.log("✅ Email service ready\n");
  } catch (error) {
    console.warn("⚠️  Email service verification failed");
    console.warn("   Emails will not be sent. Check SMTP configuration in .env\n");
  }

  // Start HTTP server with retry logic
  console.log("[4/4] Starting HTTP server...");
  
  let server;
  let retries = 3;
  
  while (retries > 0) {
    try {
      server = await new Promise((resolve, reject) => {
        const srv = app.listen(env.port, () => resolve(srv));
        srv.on('error', reject);
      });
      break; // Success
    } catch (error) {
      if (error.code === 'EADDRINUSE' && retries > 1) {
        console.log(`⚠️  Port ${env.port} still in use, cleaning up again...`);
        await killPort(env.port);
        retries--;
        continue;
      }
      throw error; // Give up
    }
  }
  
  if (!server) {
    console.error(`\n❌ Failed to start server after multiple attempts\n`);
    process.exit(1);
  }
  
  // Server started successfully
    console.log("\n╔════════════════════════════════════════╗");
    console.log(`║  🚀 SERVER RUNNING ON PORT ${env.port}       ║`);
    console.log("╚════════════════════════════════════════╝");
    console.log(`\n📍 Access Points:`);
    console.log(`   Frontend:  ${env.frontendUrl}`);
    console.log(`   API:       http://localhost:${env.port}`);
    console.log(`   Health:    http://localhost:${env.port}/health`);
    console.log(`   Status:    http://localhost:${env.port}/status`);
    
    if (startupErrors.length > 0) {
      console.log(`\n⚠️  Startup Warnings: ${startupErrors.length}`);
      startupErrors.forEach(err => console.log(`   - ${err}`));
    }
    
    console.log(`\n💡 Server is ready to accept connections`);
    console.log(`   Press Ctrl+C to stop\n`);

  // Set server timeouts
  server.timeout = 30000; // 30 seconds
  server.keepAliveTimeout = 65000; // 65 seconds
  server.headersTimeout = 66000; // 66 seconds



  // Graceful shutdown
  const gracefulShutdown = async (signal) => {
    console.log(`\n\n⚠️  ${signal} received. Starting graceful shutdown...`);
    
    server.close(async () => {
      console.log("✅ HTTP server closed");
      
      try {
        await pool.end();
        console.log("✅ Database connections closed");
      } catch (error) {
        console.error("❌ Error closing database:", error.message);
      }
      
      console.log("✅ Graceful shutdown complete\n");
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error("❌ Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  // Handle shutdown signals
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
};

// ═══════════════════════════════════════════════════════════════
// ERROR HANDLERS
// ═══════════════════════════════════════════════════════════════

// Handle uncaught errors
process.on("unhandledRejection", (reason, promise) => {
  console.error("\n❌ Unhandled Promise Rejection:");
  console.error("   Reason:", reason);
  console.error("   Promise:", promise);
  
  // Log to file
  const logPath = path.join(__dirname, "logs", "backend-error.log");
  const logMessage = `[${new Date().toISOString()}] Unhandled Rejection: ${reason}\n`;
  fs.appendFileSync(logPath, logMessage);
});

process.on("uncaughtException", (error) => {
  console.error("\n❌ Uncaught Exception:");
  console.error("   Message:", error.message);
  console.error("   Stack:", error.stack);
  
  // Log to file
  const logPath = path.join(__dirname, "logs", "backend-error.log");
  const logMessage = `[${new Date().toISOString()}] Uncaught Exception: ${error.message}\n${error.stack}\n\n`;
  fs.appendFileSync(logPath, logMessage);
  
  // Exit process on critical errors
  if (error.code === "ECONNREFUSED" || error.code === "ER_BAD_DB_ERROR") {
    console.error("\n❌ Critical error detected. Exiting...\n");
    process.exit(1);
  }
});

// Monitor memory usage
setInterval(() => {
  const used = process.memoryUsage();
  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  
  // Warn if memory usage is high
  if (heapUsedMB > 500) {
    console.warn(`⚠️  High memory usage: ${heapUsedMB}MB`);
  }
}, 60000); // Check every minute

// Start the server
startServer();

module.exports = app;
