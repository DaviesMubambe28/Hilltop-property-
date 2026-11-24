import { z } from 'zod';

const schema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(20),
  VITE_SITE_URL: z.string().url().default('http://localhost:4173'),
  VITE_WHATSAPP_NUMBER: z.string().regex(/^\d{8,15}$/).optional().or(z.literal('')),
  VITE_GA_MEASUREMENT_ID: z.string().optional(),
});

export type AppConfig = z.infer<typeof schema>;

export function readConfig(environment: Record<string, string | undefined> = import.meta.env): AppConfig | null {
  const result = schema.safeParse(environment);
  return result.success ? result.data : null;
}

export const config = readConfig();
