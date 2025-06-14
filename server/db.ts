import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

// For testing environments, provide a fallback database URL
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
    // Use a test database URL for development/testing
    databaseUrl = 'postgresql://test:test@localhost:5432/test_db';
    console.warn('⚠️  Using test database URL. Set DATABASE_URL for production.');
  } else {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
}

try {
  const sql = neon(databaseUrl);
  export const db = drizzle(sql, { schema });
  console.log('✅ Database connection initialized');
} catch (error) {
  console.error('❌ Database connection failed:', error);
  // For testing, create a mock database
  if (process.env.NODE_ENV === 'test') {
    console.log('🔧 Creating mock database for testing...');
    export const db = {
      select: () => ({ from: () => ({ where: () => [] }) }),
      insert: () => ({ values: () => ({ returning: () => [] }) }),
      update: () => ({ set: () => ({ where: () => [] }) }),
      delete: () => ({ where: () => [] }),
      execute: () => Promise.resolve([]),
    } as any;
  } else {
    throw error;
  }
}