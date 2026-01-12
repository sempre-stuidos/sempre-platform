import { z } from 'zod';

const envSchema = z.object({
  AI_API_KEY: z.string().min(20),
  AI_BASE_URL: z.string().url(),
  AI_DEFAULT_MODEL: z.string(),
  BREVO_API_KEY: z.string().min(20),
  BREVO_FROM_EMAIL: z.string(),
  BREVO_FROM_NAME: z.string(),
  BREVO_PASSWORD_RESET_TEMPLATE_ID: z.string(),
  BREVO_RESERVATION_CONFIRMATION_TEMPLATE_ID: z.string(),
  BREVO_RESERVATION_REJECTION_TEMPLATE_ID: z.string(),
  BREVO_SENDER_EMAIL: z.string(),
  BREVO_SENDER_NAME: z.string(),
  BREVO_WELCOME_EMAIL_TEMPLATE_ID: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string().min(20),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_RESTAURANT_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  SUPER_ADMIN_SECRET_KEY: z.string().min(20),
  VERCEL_ENV: z.string(),
  VERCEL_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
