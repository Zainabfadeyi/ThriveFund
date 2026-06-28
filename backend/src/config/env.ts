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
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  BREVO_API_KEY: z.string().min(1),
  BREVO_SENDER_EMAIL: z.string().email(),
  BREVO_SENDER_NAME: z.string().default('ThriveFund'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  /** mock_nomba (default) | nomba — live Nomba only after hackathon build phase */
  PAYMENT_PROVIDER: z.enum(['mock_nomba', 'nomba']).default('mock_nomba'),
  NOMBA_BASE_URL: z.string().url().optional(),
  NOMBA_API_KEY: z.string().optional(),
  NOMBA_ACCOUNT_ID: z.string().optional(),
  NOMBA_WEBHOOK_SECRET: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
