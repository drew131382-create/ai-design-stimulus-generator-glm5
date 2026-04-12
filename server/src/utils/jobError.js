import { HttpError } from "./httpError.js";

const DEFAULT_QUEUE_ERROR = {
  message: "生成失败，请稍后重试。",
  statusCode: 500,
  details: null
};

export function serializeQueueError(error) {
  if (error instanceof HttpError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      details: error.details || null
    };
  }

  return {
    message: error?.message || DEFAULT_QUEUE_ERROR.message,
    statusCode: 500,
    details: null
  };
}

export function deserializeQueueError(rawError) {
  if (!rawError) {
    return DEFAULT_QUEUE_ERROR;
  }

  if (typeof rawError === "object" && rawError.message) {
    return {
      message: rawError.message,
      statusCode: Number(rawError.statusCode) || DEFAULT_QUEUE_ERROR.statusCode,
      details: rawError.details || null
    };
  }

  if (typeof rawError === "string") {
    try {
      const parsed = JSON.parse(rawError);
      if (parsed?.message) {
        return {
          message: parsed.message,
          statusCode:
            Number(parsed.statusCode) || DEFAULT_QUEUE_ERROR.statusCode,
          details: parsed.details || null
        };
      }
    } catch {
      return {
        ...DEFAULT_QUEUE_ERROR,
        message: rawError
      };
    }
  }

  return DEFAULT_QUEUE_ERROR;
}
