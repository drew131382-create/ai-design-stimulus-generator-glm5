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
  message: "提交任务过于频繁，请稍后再试。"
});

export const generateStatusRateLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  message: "状态查询过于频繁，请稍后再试。"
});
