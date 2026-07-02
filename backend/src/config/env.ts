import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env relative to this file: src/config/env.ts → ../../.env = backend/.env
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env'), override: true });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().min(1),
  DB_PASS: z.string().default(''),
  DB_NAME: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  BREVO_API_KEY: z.string().min(1),
  BREVO_SENDER_EMAIL: z.string().email(),
  BREVO_SENDER_NAME: z.string().default('ThriveFund'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  PAYMENT_PROVIDER: z.enum(['nomba']).default('nomba'),
  /** Log HTTP requests/responses to terminal (default: on in development) */
  LOG_HTTP: z.enum(['true', 'false']).optional(),
  /** basic | detailed | debug — verbosity of HTTP logs */
  LOG_HTTP_LEVEL: z.enum(['basic', 'detailed', 'debug']).optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(1000),
  NOMBA_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  NOMBA_BASE_URL: z.string().url().optional(),
  NOMBA_CLIENT_ID: z.string().optional(),
  NOMBA_PRIVATE_KEY: z.string().optional(),
  NOMBA_CLIENT_SECRET: z.string().optional(),
  NOMBA_PARENT_ACCOUNT_ID: z.string().optional(),
  NOMBA_SUB_ACCOUNT_ID: z.string().optional(),
  NOMBA_VIRTUAL_ACCOUNT_SCOPE: z.enum(['parent', 'sub_account']).default('parent'),
  /** Legacy aliases kept so older deployments fail less sharply during rollout. */
  NOMBA_API_KEY: z.string().optional(),
  NOMBA_ACCOUNT_ID: z.string().optional(),
  NOMBA_WEBHOOK_SECRET: z.string().optional(),
}).superRefine((data, ctx) => {
  const required: Array<[keyof typeof data, boolean]> = [
    ['NOMBA_CLIENT_ID', Boolean(data.NOMBA_CLIENT_ID)],
    ['NOMBA_PRIVATE_KEY', Boolean(data.NOMBA_PRIVATE_KEY || data.NOMBA_CLIENT_SECRET || data.NOMBA_API_KEY)],
    ['NOMBA_PARENT_ACCOUNT_ID', Boolean(data.NOMBA_PARENT_ACCOUNT_ID || data.NOMBA_ACCOUNT_ID)],
  ];

  if (data.NOMBA_VIRTUAL_ACCOUNT_SCOPE === 'sub_account') {
    required.push(['NOMBA_SUB_ACCOUNT_ID', Boolean(data.NOMBA_SUB_ACCOUNT_ID)]);
  }

  for (const [field, present] of required) {
    if (!present) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message: 'Required when PAYMENT_PROVIDER=nomba',
      });
    }
  }
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
