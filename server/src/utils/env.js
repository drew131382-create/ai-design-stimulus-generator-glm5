import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(10000),
  MODELSCOPE_API_KEY: z.string().min(1, "MODELSCOPE_API_KEY is required"),
  MODELSCOPE_BASE_URL: z
    .string()
    .url("MODELSCOPE_BASE_URL must be a valid URL"),
  MODELSCOPE_MODEL: z.string().min(1).default("ZhipuAI/GLM-5"),
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

