const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("child_process");
const express = require("express");
const env = require("./src/config/env");
const { testConnection, pool } = require("./src/config/db");
const {
  ensureUsersOtpColumns,
  ensureReviewsTable,
  ensureAdminTables,
} = require("./src/config/migrate");
const { ensureProductUpgradeTables } = require("./src/config/productMigration");
const { ensureDemoEnquiriesTable } = require("./src/config/ensureDemoEnquiries");
const { verifyTransporter } = require("./src/services/mailService");
const { ensureUploadsDir } = require("./src/utils/uploadPaths");

// Middleware
const requestLogger = require("./src/middleware/requestLogger");
const responseNormalizer = require("./src/middleware/responseNormalizer");
const simpleCookieParser = require("./src/middleware/simpleCookieParser");
const { notFound, errorHandler } = require("./src/middleware/errorMiddleware");

// Routes
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const publicRoutes = require("./src/routes/publicRoutes");
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
const reviewRoutes = require("./src/routes/reviewRoutes");
const websiteReviewRoutes = require("./src/routes/websiteReviewRoutes");
const demoEnquiryRoutes = require("./src/routes/demoEnquiryRoutes");
const validationRoutes = require("./src/routes/validationRoutes");

let cors, cookieParser, compression, helmet;

try {
  cors = require("cors");
  cookieParser = require("cookie-parser");
  compression = require("compression");
  helmet = require("helmet");
} catch (error) {
  console.warn("⚠️  Optional packages not installed");
}

// Auto port cleanup
const killPort = async (port) => {
  try {
    const psCommand = `powershell -Command "$procs = Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($procs) { $procs | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"`;
    execSync(psCommand, { stdio: "ignore" });
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    // Port already free
  }
};

const app = express();
const distDir = path.join(__dirname, "..", "frontend", "dist");

// Security & Performance
if (helmet)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
if (compression) app.use(compression());

// CORS
if (cors) {
  app.use(
    cors({
      origin: function (origin, callback) {
        const allowedOrigins = [
          env.frontendUrl,
          "http://localhost:5173",
          "http://localhost:3000",
          "http://127.0.0.1:5173",
        ];
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(null, true); // Allow all in development
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
} else {
  app.use((req, res, next) => {
    res.header(
      "Access-Control-Allow-Origin",
      req.headers.origin || env.frontendUrl,
    );
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
}

// Request timeout
app.use((req, res, next) => {
  req.setTimeout(30000);
  res.setTimeout(30000);
  next();
});

// Body parsing
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser ? cookieParser() : simpleCookieParser);
app.use(requestLogger);
app.use(responseNormalizer);

// Health & Status endpoints
app.get("/health", async (req, res) => {
  try {
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

// API Routes
app.use(authRoutes);
app.use(adminRoutes);
app.use(publicRoutes);
app.use(userRoutes);
app.use(dashboardRoutes);
app.use(productRoutes);
app.use(categoryRoutes);
app.use(orderRoutes);
app.use(userAdminRoutes);
app.use(inventoryRoutes);
app.use(discountRoutes);
app.use(cartRoutes);
app.use(reviewRoutes);
app.use(websiteReviewRoutes);
app.use(demoEnquiryRoutes);
app.use(validationRoutes);
app.use("/api/admin/upload", uploadRoutes);

// Static files
const uploadDir = ensureUploadsDir();
app.use(
  "/uploads",
  express.static(uploadDir, {
    fallthrough: false,
    maxAge: env.nodeEnv === "production" ? "7d" : 0,
  }),
);

const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// 404 handler
app.use(notFound);

// SPA fallback
app.use(express.static(distDir));
app.use((req, res, next) => {
  const indexPath = path.join(distDir, "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

// Error handler
app.use(errorHandler);

// Server startup
const startServer = async () => {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║   TEK NODE SERVER STARTUP            ║");
  console.log("╚════════════════════════════════════════╝\n");

  // Kill port first
  await killPort(env.port);

  let startupErrors = [];

  // Test MySQL
  try {
    console.log("[1/4] Testing MySQL connection...");
    await testConnection();
    console.log("✅ MySQL connected\n");
  } catch (error) {
    console.error("❌ MySQL failed:", error.message);
    startupErrors.push("MySQL connection failed");
  }

  // Database migrations
  try {
    console.log("[2/4] Verifying database schema...");
    await ensureUsersOtpColumns();
    await ensureReviewsTable();
    await ensureAdminTables();
    await ensureDemoEnquiriesTable();
    await ensureProductUpgradeTables();
    console.log("✅ Database schema verified\n");
  } catch (error) {
    console.error("❌ Schema check failed:", error.message);
    startupErrors.push("Database schema check failed");
  }

  // Email service
  try {
    console.log("[3/4] Verifying email service...");
    await verifyTransporter();
    console.log("✅ Email service ready\n");
  } catch (error) {
    console.warn("⚠️  Email service unavailable");
  }

  // Start server
  console.log("[4/4] Starting HTTP server...");

  let server;
  let retries = 3;

  while (retries > 0) {
    try {
      server = await new Promise((resolve, reject) => {
        const srv = app.listen(env.port, () => resolve(srv));
        srv.on("error", reject);
      });
      break;
    } catch (error) {
      if (error.code === "EADDRINUSE" && retries > 1) {
        console.log(`⚠️  Port ${env.port} busy, cleaning up...`);
        await killPort(env.port);
        retries--;
        continue;
      }
      throw error;
    }
  }

  if (!server) {
    console.error("\n❌ Failed to start server\n");
    process.exit(1);
  }

  console.log("\n╔════════════════════════════════════════╗");
  console.log(`║  🚀 SERVER RUNNING ON PORT ${env.port}       ║`);
  console.log("╚════════════════════════════════════════╝");
  console.log(`\n📍 Access Points:`);
  console.log(`   Frontend:  ${env.frontendUrl}`);
  console.log(`   API:       http://localhost:${env.port}`);
  console.log(`   Health:    http://localhost:${env.port}/health`);

  if (startupErrors.length > 0) {
    console.log(`\n⚠️  Warnings: ${startupErrors.length}`);
    startupErrors.forEach((err) => console.log(`   - ${err}`));
  }

  console.log(`\n💡 Server ready - Press Ctrl+C to stop\n`);

  // Graceful shutdown
  const gracefulShutdown = async (signal) => {
    console.log(`\n\n⚠️  ${signal} received - shutting down gracefully...`);
    server.close(async () => {
      console.log("✅ HTTP server closed");
      try {
        await pool.end();
        console.log("✅ Database connections closed");
      } catch (error) {
        console.error("❌ Error closing database:", error.message);
      }
      console.log("✅ Shutdown complete\n");
      process.exit(0);
    });

    setTimeout(() => {
      console.error("❌ Forced shutdown");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
};

// Error handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("\n❌ Unhandled Promise Rejection:", reason);
  const logPath = path.join(__dirname, "logs", "error.log");
  const logMessage = `[${new Date().toISOString()}] Unhandled Rejection: ${reason}\n`;
  fs.appendFileSync(logPath, logMessage);
});

process.on("uncaughtException", (error) => {
  console.error("\n❌ Uncaught Exception:", error.message);
  const logPath = path.join(__dirname, "logs", "error.log");
  const logMessage = `[${new Date().toISOString()}] Uncaught Exception: ${error.message}\n${error.stack}\n\n`;
  fs.appendFileSync(logPath, logMessage);
});

startServer();

module.exports = app;
