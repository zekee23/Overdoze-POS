import arcjet, { tokenBucket, shield, detectBot } from "@arcjet/node";

// Check if Arcjet key is available
const arcjetKey = process.env.ARCJET_KEY;

if (!arcjetKey) {
  console.warn("ARCJET_KEY not found in environment variables. Arcjet protection will be disabled.");
}

// General Arcjet instance for most endpoints
const aj = arcjetKey ? arcjet({
  key: arcjetKey,
  characteristics: ["ip.src"], // Rate limit by IP address
  rules: [
    // Shield: General security protection
    shield({
      mode: "LIVE",
    }),
    // Bot detection - allow common development tools
    detectBot({
      mode: "LIVE", // Block known bots
      allow: [
        "curl",           // Allow curl
        "wget",           // Allow wget
        "postman",        // Allow Postman
        "insomnia",       // Allow Insomnia
        "httpie",         // Allow HTTPie
        "axios",          // Allow axios
        "fetch",          // Allow fetch API
      ], // Allow common development tools
    }),
    // Token bucket rate limiting
    tokenBucket({
      mode: "LIVE",
      refillRate: 5, // 5 tokens per hour
      interval: 3600, // 1 hour in seconds
      capacity: 10, // Maximum 10 requests
    }),
  ],
}) : null;

// Stricter Arcjet instance for admin registration
const ajAdmin = arcjetKey ? arcjet({
  key: arcjetKey,
  characteristics: ["ip.src"],
  rules: [
    shield({
      mode: "LIVE",
    }),
    detectBot({
      mode: "LIVE",
      allow: [
        "curl",           // Allow curl
        "wget",           // Allow wget
        "postman",        // Allow Postman
        "insomnia",       // Allow Insomnia
        "httpie",         // Allow HTTPie
        "axios",          // Allow axios
        "fetch",          // Allow fetch API
      ],
    }),
    tokenBucket({
      mode: "LIVE",
      refillRate: 1, // 1 token per 24 hours
      interval: 86400, // 24 hours in seconds
      capacity: 3, // Maximum 3 admin registration attempts
    }),
  ],
}) : null;

// Arcjet instance for regular user registration
const ajRegistration = arcjetKey ? arcjet({
  key: arcjetKey,
  characteristics: ["ip.src"],
  rules: [
    shield({
      mode: "LIVE",
    }),
    detectBot({
      mode: "LIVE",
      allow: [
        "curl",           // Allow curl
        "wget",           // Allow wget
        "postman",        // Allow Postman
        "insomnia",       // Allow Insomnia
        "httpie",         // Allow HTTPie
        "axios",          // Allow axios
        "fetch",          // Allow fetch API
      ],
    }),
    tokenBucket({
      mode: "LIVE",
      refillRate: 3, // 3 tokens per hour
      interval: 3600, // 1 hour in seconds
      capacity: 5, // Maximum 5 registration attempts per hour
    }),
  ],
}) : null;

// Arcjet instance for products refresh endpoint - production-ready limits
const ajProductsRefresh = arcjetKey ? arcjet({
  key: arcjetKey,
  characteristics: ["ip.src"], // IP-based rate limiting
  rules: [
    shield({
      mode: "LIVE",
    }),
    tokenBucket({
      mode: "LIVE",
      refillRate: 10, // 10 requests per minute (reasonable for production)
      interval: 60, // 1 minute in seconds
      capacity: 20, // 20 burst capacity (allows occasional bursts)
    }),
  ],
}) : null;

// Middleware functions
export const arcjetProtection = async (req, res, next) => {
  if (!aj) {
    // Arcjet not configured, skip protection
    return next();
  }

  try {
    const decision = await aj.protect(req, { requested: 1 });
    
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res.status(429).json({ 
          error: 'Too many requests, please try again later.',
          resetTime: decision.reason.resetTime
        });
      } else if (decision.reason.isBot()) {
        return res.status(403).json({ error: 'Bot access denied.' });
      } else {
        return res.status(403).json({ error: 'Access forbidden.' });
      }
    }

    if (decision.results.some((result) => result.reason.isBot() && result.reason.isSpoofed())) {
      return res.status(403).json({ error: 'Spoofed bot access denied.' });
    }

    next();
  } catch (error) {
    console.error("Arcjet error:", error);
    next(error);
  }
};

export const adminRegistrationProtection = async (req, res, next) => {
  if (!ajAdmin) {
    // Arcjet not configured, skip protection
    return next();
  }

  try {
    const decision = await ajAdmin.protect(req, { requested: 1 });
    
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res.status(429).json({ 
          error: 'Admin registration limit exceeded. Maximum 3 attempts per 24 hours.',
          resetTime: decision.reason.resetTime
        });
      } else if (decision.reason.isBot()) {
        return res.status(403).json({ error: 'Bot access denied.' });
      } else {
        return res.status(403).json({ error: 'Access forbidden.' });
      }
    }

    next();
  } catch (error) {
    console.error("Arcjet admin protection error:", error);
    next(error);
  }
};

export const registrationProtection = async (req, res, next) => {
  if (!ajRegistration) {
    // Arcjet not configured, skip protection
    return next();
  }

  try {
    const decision = await ajRegistration.protect(req, { requested: 1 });
    
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res.status(429).json({ 
          error: 'Registration limit exceeded. Maximum 5 attempts per hour.',
          resetTime: decision.reason.resetTime
        });
      } else if (decision.reason.isBot()) {
        return res.status(403).json({ error: 'Bot access denied.' });
      } else {
        return res.status(403).json({ error: 'Access forbidden.' });
      }
    }

    next();
  } catch (error) {
    console.error("Arcjet registration protection error:", error);
    next(error);
  }
};

export const productsRefreshProtection = async (req, res, next) => {
  if (!ajProductsRefresh) {
    // Arcjet not configured, skip protection
    return next();
  }

  try {
    const decision = await ajProductsRefresh.protect(req, { requested: 1 });
    
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res.status(429).json({ 
          error: 'Too many refresh requests. Please wait a moment before trying again.',
          resetTime: decision.reason.resetTime,
          retryAfter: Math.ceil((decision.reason.resetTime - Date.now()) / 1000)
        });
      } else {
        return res.status(403).json({ error: 'Access forbidden.' });
      }
    }

    next();
  } catch (error) {
    console.error("Arcjet products refresh protection error:", error);
    next(error);
  }
};

export { aj, ajAdmin, ajRegistration, ajProductsRefresh };
