import { z } from "zod";

/** Validate and normalize process env at boot — fail fast on misconfiguration. */
const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    API_PORT: z.coerce.number().int().positive().default(4000),
    WEB_ORIGIN: z
      .string()
      .default("http://localhost:3000")
      .transform((value) => value.split(",").map((origin) => origin.trim())),
    DATABASE_URL: z.string().url().optional(),
    REDIS_URL: z.string().url().optional(),
    RESEND_API_KEY: z.string().optional(),
    CONTACT_INBOX: z.string().email().default("team@stayboost.com"),
    EMAIL_FROM: z.string().default("StayBoost <hello@stayboost.com>"),
    MAX_BODY_SIZE: z.string().default("16kb"),
  })
  .superRefine((env, ctx) => {
    // In production, dependencies that have safe dev fallbacks must be present.
    if (env.NODE_ENV !== "production") return;
    const required: ReadonlyArray<["DATABASE_URL" | "REDIS_URL" | "RESEND_API_KEY", unknown]> = [
      ["DATABASE_URL", env.DATABASE_URL],
      ["REDIS_URL", env.REDIS_URL],
      ["RESEND_API_KEY", env.RESEND_API_KEY],
    ];
    for (const [key, value] of required) {
      if (!value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} is required in production`,
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration — ${detail}`);
  }
  return parsed.data;
}
