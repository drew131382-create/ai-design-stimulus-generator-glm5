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
  ZHIPU_CHAT_MODEL: z.string().min(1).default("glm-4-flash"),
  ZHIPU_EMBEDDING_MODEL: z.string().min(1).default("embedding-3"),
  LLM_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(45000),
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
