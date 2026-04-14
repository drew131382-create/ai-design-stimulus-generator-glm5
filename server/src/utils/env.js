import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(10000),
  ZHIPU_API_KEY: z.string().min(1, "ZHIPU_API_KEY is required"),
  ZHIPU_EMBEDDING_API_KEY: z.string().optional(),
  ZHIPU_BASE_URL: z
    .string()
    .url("ZHIPU_BASE_URL must be a valid URL")
    .default("https://open.bigmodel.cn/api/paas/v4"),
  REDIS_URL: z.preprocess(
    (value) => (typeof value === "string" && value.trim() ? value.trim() : undefined),
    z
      .string()
      .url("REDIS_URL must be a valid URL")
      .optional()
  ),
  ZHIPU_CHAT_MODEL: z.string().min(1).default("glm-5"),
  ZHIPU_EMBEDDING_MODEL: z.string().min(1).default("embedding-3"),
  LLM_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(45000),
  START_EMBEDDED_WORKER: z
    .preprocess(
      (value) => {
        if (typeof value === "boolean") {
          return value;
        }

        if (typeof value === "string") {
          if (value.toLowerCase() === "true") {
            return true;
          }

          if (value.toLowerCase() === "false") {
            return false;
          }
        }

        return undefined;
      },
      z.boolean().default(false)
    ),
  JOB_QUEUE_NAME: z.string().min(1).default("generate-stimuli"),
  JOB_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(3),
  JOB_QUEUE_MAX_SIZE: z.coerce.number().int().positive().default(30),
  JOB_RESULT_TTL_MS: z.coerce.number().int().positive().default(3600000),
  JOB_ESTIMATED_DURATION_SECONDS: z.coerce.number().int().positive().default(150),
  ALLOWED_ORIGIN: z.string().optional()
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.flatten().fieldErrors;
  throw new Error(
    `Invalid server environment variables: ${JSON.stringify(details)}`
  );
}

export const env = parsedEnv.data;
