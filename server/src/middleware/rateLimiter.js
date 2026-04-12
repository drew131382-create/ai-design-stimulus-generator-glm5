import rateLimit from "express-rate-limit";

function buildLimiter({ windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: {
          message
        }
      });
    }
  });
}

export const generateSubmitRateLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  message: "???????????????"
});

export const generateStatusRateLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  message: "???????????????"
});
