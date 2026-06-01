const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const env = require("./src/config/env");
const { testConnection } = require("./src/config/db");
const { ensureUsersOtpColumns, ensureAdminTables } = require("./src/config/migrate");
const { ensureGuestOrderColumns } = require("./src/config/migrate");
const { ensureOrderTrackingTable } = require("./src/config/orderMigration");
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

try {
  cors = require("cors");
  cookieParser = require("cookie-parser");
} catch (error) {
  // The app still runs with small local fallbacks if npm install is pending.
}

const app = express();
const distDir = path.join(__dirname, "..", "frontend", "dist");

if (cors) {
  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
    })
  );
} else {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", env.frontendUrl);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
}

app.use(express.json({ limit: "5mb", type: ["application/json", "text/plain"] }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser ? cookieParser() : simpleCookieParser);
app.use(requestLogger);
app.use(responseNormalizer);

// Health check
app.get("/health", (req, res) => {
  res.json({ success: true, message: "API is running" });
});

// ── Auth Routes ──────────────────────────────────────────────────────────────
app.use(authRoutes);

// ── Admin Auth + Token ───────────────────────────────────────────────────────
app.use(adminRoutes);

// ── Public API Routes (no auth required) ────────────────────────────────────
app.use(publicRoutes);

// ── User API Routes (JWT-protected) ─────────────────────────────────────────
app.use(userRoutes);

// ── Admin API Routes (JWT-protected) ────────────────────────────────────────
app.use(dashboardRoutes);
app.use(productRoutes);
app.use(categoryRoutes);
app.use(orderRoutes);
app.use(userAdminRoutes);
app.use(inventoryRoutes);
app.use(discountRoutes);
app.use(cartRoutes);
app.use('/api/admin/upload', uploadRoutes);

// Ensure uploads dir exists and serve static files
const uploadDir = ensureUploadsDir();
console.log(`[SERVER] Uploads directory: ${uploadDir}`);

// Serve uploaded files as static assets
app.use('/uploads', express.static(uploadDir, {
  fallthrough: false,
  maxAge: env.nodeEnv === "production" ? "7d" : 0,
}));

// ── 404 handler for unmatched API routes ────────────────────────────────────
app.use(notFound);

// ── SPA static files (production build) ─────────────────────────────────────
app.use(express.static(distDir));

app.use((req, res) => {
  const indexPath = path.join(distDir, "index.html");
  if (!fs.existsSync(indexPath)) {
    return res.status(404).send("Build not found. Run npm run build from the frontend folder first.");
  }
  return res.sendFile(indexPath);
});

// ── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

const startServer = async () => {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║     SERVER STARTUP SEQUENCE          ║");
  console.log("╚════════════════════════════════════════╝\n");

  // Test MySQL connection
  try {
    console.log("[STARTUP] Testing MySQL connection...");
    await testConnection();
    console.log("✅ [STARTUP] MySQL connection successful\n");
  } catch (error) {
    console.error("❌ [STARTUP] MySQL connection failed:", error.message);
    console.error("   Ensure XAMPP MySQL is running and database 'Technique' exists\n");
  }

  // Run database migrations
  try {
    console.log("[STARTUP] Ensuring users table is ready...");
    await ensureUsersOtpColumns();
    console.log("✅ [STARTUP] Database schema verified\n");
  } catch (error) {
    console.error("❌ [STARTUP] Database schema check failed:", error.message, "\n");
  }

  try {
    console.log("[STARTUP] Ensuring admin system tables...");
    await ensureAdminTables();
    console.log("✅ [STARTUP] Admin tables ready\n");
  } catch (error) {
    console.error("❌ [STARTUP] Admin tables setup failed:", error.message, "\n");
  }

  try {
    console.log("[STARTUP] Ensuring guest order columns...");
    await ensureGuestOrderColumns();
    console.log("✅ [STARTUP] Guest order columns ready\n");
  } catch (error) {
    console.error("❌ [STARTUP] Guest order columns setup failed:", error.message, "\n");
  }

  try {
    console.log("[STARTUP] Ensuring order tracking tables...");
    await ensureOrderTrackingTable();
    console.log("✅ [STARTUP] Order tracking tables ready\n");
  } catch (error) {
    console.error("❌ [STARTUP] Order tracking setup failed:", error.message, "\n");
  }

  // Verify Gmail SMTP (non-blocking - server starts regardless)
  try {
    console.log("[STARTUP] Verifying Gmail SMTP configuration...");
    await verifyTransporter();
    console.log("✅ [STARTUP] Gmail SMTP transporter ready\n");
  } catch (error) {
    console.error("❌ [STARTUP] Gmail SMTP verification failed!\n");
    console.error("   Error details:", error.message, "\n");
  }

  // Start HTTP server
  const server = app.listen(env.port, () => {
    console.log("╔════════════════════════════════════════╗");
    console.log(`║  🚀 SERVER RUNNING ON PORT ${env.port}       ║`);
    console.log("╚════════════════════════════════════════╝");
    console.log(`Frontend URL: ${env.frontendUrl}`);
    console.log(`API Health: http://localhost:${env.port}/health\n`);
  });

  // Handle server errors gracefully
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`❌ Port ${env.port} is already in use. Please stop the other process or change PORT in .env`);
    } else {
      console.error("❌ Server error:", error.message);
    }
    process.exit(1);
  });
};

// Handle uncaught errors gracefully
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Promise Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error.message);
  console.error(error.stack);
  // Don't exit - allow the server to continue running
});

startServer();