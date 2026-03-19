import { ZodError } from "zod";
import { HttpError } from "../utils/httpError.js";

export function errorHandler(error, _req, res, _next) {
  if (typeof error?.statusCode === "number") {
    return res.status(error.statusCode).json({
      error: {
        message: error.message || "请求失败。"
      }
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: error.issues[0]?.message || "请求数据校验失败。",
        details: error.flatten()
      }
    });
  }

  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      error: {
        message: error.message,
        details:
          process.env.NODE_ENV === "production" && error.statusCode >= 500
            ? undefined
            : error.details
      }
    });
  }

  return res.status(500).json({
    error: {
      message: "服务器内部错误。",
      details:
        process.env.NODE_ENV === "production" ? undefined : error.message
    }
  });
}
