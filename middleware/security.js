const rateLimit = require("express-rate-limit");
const logger = require("../utils/logger");

const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.securityEvent("RATE_LIMIT_EXCEEDED", req, {
        limit: max,
        window: windowMs,
      });
      res.status(429).json({ error: message });
    },
  });
};

// Development vs Production limits
const isDev = process.env.NODE_ENV !== "production";

const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  isDev ? 1000 : 30, // 1000 attempts in dev, 30 in production
  "Terlalu banyak percobaan autentikasi, silakan coba lagi nanti"
);

const uploadRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  isDev ? 100 : 5, // 100 uploads in dev, 5 in production
  "Terlalu banyak percobaan upload, silakan tunggu"
);

const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  isDev ? 10000 : 100, // 10000 requests in dev, 100 in production
  "Terlalu banyak permintaan, silakan coba lagi nanti"
);

const securityHeaders = (req, res, next) => {
  res.removeHeader("X-Powered-By");

  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  if (req.secure) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  next();
};

const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const responseTime = Date.now() - start;
    logger.request(req, res, responseTime);

    if (res.statusCode === 401) {
      logger.securityEvent("UNAUTHORIZED_ACCESS", req);
    }

    if (res.statusCode === 403) {
      logger.securityEvent("FORBIDDEN_ACCESS", req);
    }

    if (res.statusCode >= 500) {
      logger.error("Server error", {
        url: req.url,
        method: req.method,
        statusCode: res.statusCode,
        userAgent: req.get("User-Agent"),
        ip: req.ip,
      });
    }
  });

  next();
};

const validateIP = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;

  if (process.env.NODE_ENV === "production") {
    const privateIPs = [
      /^127\./,
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[0-1])\./,
      /^::1$/,
      /^localhost$/,
    ];

    if (privateIPs.some((pattern) => pattern.test(ip))) {
      logger.securityEvent("PRIVATE_IP_ACCESS", req, { ip });
    }
  }

  next();
};

const enhancedSanitization = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === "string") {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+=/gi, "")
        .trim();
    }
    return value;
  };

  const sanitizeObject = (obj) => {
    if (typeof obj !== "object" || obj === null) return obj;

    const sanitized = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === "object" && obj[key] !== null) {
          sanitized[key] = sanitizeObject(obj[key]);
        } else {
          sanitized[key] = sanitizeValue(obj[key]);
        }
      }
    }
    return sanitized;
  };

  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);

  next();
};

const attackDetection = (req, res, next) => {
  const suspiciousPatterns = [
    /union.*select/i,
    /select.*from/i,
    /'.*or.*'.*=/i,
    /script.*alert/i,
    /javascript:/i,
    /<script/i,
    /exec\(/i,
    /eval\(/i,
  ];

  const checkString =
    JSON.stringify(req.body) + JSON.stringify(req.query) + req.url;

  const detected = suspiciousPatterns.some((pattern) =>
    pattern.test(checkString)
  );

  if (detected) {
    logger.securityEvent("POTENTIAL_ATTACK_DETECTED", req, {
      suspicious_content: checkString.substring(0, 200),
    });

    return res.status(400).json({ error: "Permintaan tidak valid" });
  }

  next();
};

module.exports = {
  authRateLimit,
  uploadRateLimit,
  apiRateLimit,
  securityHeaders,
  requestLogger,
  validateIP,
  enhancedSanitization,
  attackDetection,
};
