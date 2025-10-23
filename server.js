require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const { connectDB, syncDB } = require("./config/sequelize");
const models = require("./models/sequelize");
const { swaggerUi, swaggerSpec } = require("./config/swagger");

const {
  apiRateLimit,
  authRateLimit,
  uploadRateLimit,
  securityHeaders,
  requestLogger,
  validateIP,
  enhancedSanitization,
  attackDetection,
} = require("./middleware/security");

// Custom CORS middleware - MUST be before any other middleware
app.use((req, res, next) => {
  const allowedOrigins = [
    "https://admindashboard.batikwindasari.my.id",
    "https://batikwindasari.my.id",
    "https://ecommerce.fitrinurazis.com",
    "https://admin30.fitrinurazis.com"

  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin) || !origin) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
    res.setHeader("Access-Control-Expose-Headers", "Set-Cookie");
    res.setHeader("Access-Control-Max-Age", "86400");
  }

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// Helmet disabled temporarily to fix CORS - re-enable after testing
// app.use(helmet());

app.use(validateIP);
app.use(requestLogger);

app.use("/api/", apiRateLimit);
app.use("/api/auth/", authRateLimit);
app.use("/api/upload/", uploadRateLimit);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(enhancedSanitization);
app.use(attackDetection);

// Serve static media files with proper CORS headers
app.use(
  "/api/media",
  (req, res, next) => {
    // Set CORS headers for media files
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Cross-Origin-Resource-Policy", "cross-origin"); // Allow cross-origin requests
    res.header("Cache-Control", "public, max-age=31536000"); // 1 year cache
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// Swagger documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Batik E-Commerce API Docs",
  })
);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/stats", require("./routes/stats"));
app.use("/api/search", require("./routes/search"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/email", require("./routes/email"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/whatsapp", require("./routes/whatsapp"));
app.use("/api/payments", require("./routes/payments"));

// Import error handlers
const { globalErrorHandler, notFoundHandler } = require("./utils/errorHandler");

// Enhanced health check endpoint with database status
app.get("/api/health", async (req, res) => {
  try {
    // Check Sequelize database connection
    await models.sequelize.authenticate();
    const dbHealth = {
      status: "healthy",
      connected: true,
      dialect: models.sequelize.getDialect(),
      database: models.sequelize.getDatabaseName(),
    };

    const logger = require("./utils/logger");
    const logStats = await logger.getLogStats();

    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      database: dbHealth,
      logs: logStats,
      memory: process.memoryUsage(),
      version: require("./package.json").version,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      message: error.message,
      database: {
        status: "error",
        connected: false,
      },
    });
  }
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

const startServer = async () => {
  try {
    await connectDB();
    await syncDB();
    console.log("✅ Database berhasil terhubung dengan Sequelize");

    // Initialize WhatsApp if enabled
    if (process.env.WHATSAPP_ENABLED === 'true' && process.env.WHATSAPP_AUTO_INIT === 'true') {
      const whatsappService = require('./services/WhatsAppService');
      whatsappService.initialize();
      console.log("📱 WhatsApp service initializing... Check console for QR code.");
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
      console.log(`💊 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`📊 phpMyAdmin: http://localhost/phpmyadmin (jika tersedia)`);
    });
  } catch (error) {
    console.error("❌ Gagal memulai server:", error);
    process.exit(1);
  }
};

startServer();

process.on("SIGINT", async () => {
  console.log("\n🔄 Menutup server...");
  try {
    await models.sequelize.close();
    console.log("✅ Koneksi Sequelize database ditutup");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error saat menutup server:", error);
    process.exit(1);
  }
});
