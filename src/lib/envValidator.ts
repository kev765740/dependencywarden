import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
  // Vite environment variables (client-side)
  VITE_STRIPE_PUBLIC_KEY: z.string().optional(),
  VITE_POSTHOG_API_KEY: z.string().optional(),
  VITE_ENCRYPTION_KEY: z.string().optional(),
  VITE_API_BASE_URL: z.string().url().optional(),

  // Development vs Production
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEV: z.boolean().optional(),
  PROD: z.boolean().optional(),
});

export type Environment = z.infer<typeof envSchema>;

// Validate environment variables
export function validateEnvironment(): { 
  isValid: boolean; 
  errors: string[]; 
  env?: Environment 
} {
  try {
    const env = {
      VITE_STRIPE_PUBLIC_KEY: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
      VITE_POSTHOG_API_KEY: import.meta.env.VITE_POSTHOG_API_KEY,
      VITE_ENCRYPTION_KEY: import.meta.env.VITE_ENCRYPTION_KEY,
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      NODE_ENV: import.meta.env.NODE_ENV || 'development',
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
    };

    const result = envSchema.safeParse(env);

    if (result.success) {
      return {
        isValid: true,
        errors: [],
        env: result.data
      };
    } else {
      const errors = result.error.errors.map(
        (error) => `${error.path.join('.')}: ${error.message}`
      );

      return {
        isValid: false,
        errors,
      };
    }
  } catch (error) {
    return {
      isValid: false,
      errors: [`Environment validation failed: ${error}`],
    };
  }
}

// Get validated environment or throw error
export function getValidatedEnv(): Environment {
  const { isValid, errors, env } = validateEnvironment();

  if (!isValid) {
    console.error('Environment validation failed:', errors);
    throw new Error(`Environment validation failed: ${errors.join(', ')}`);
  }

  return env!;
}

// Check if running in production
export function isProduction(): boolean {
  return import.meta.env.PROD || import.meta.env.NODE_ENV === 'production';
}

// Check if running in development
export function isDevelopment(): boolean {
  return import.meta.env.DEV || import.meta.env.NODE_ENV === 'development';
}

// Validate specific environment variables
export function validateRequiredEnvVars(requiredVars: string[]): {
  isValid: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  for (const varName of requiredVars) {
    const value = (import.meta.env as any)[varName];
    if (!value || value.trim() === '') {
      missing.push(varName);
    }
  }

  return {
    isValid: missing.length === 0,
    missing
  };
}

// Export default validation function
export default validateEnvironment;