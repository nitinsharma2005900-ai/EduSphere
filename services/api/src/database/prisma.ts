import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient | null {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
    if (!prisma) {
      prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      });
    }
    return prisma;
  }
  return null;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  const client = getPrismaClient();
  if (!client) return false;
  try {
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (err) {
    console.warn('⚠️ PostgreSQL connection failed, operating with in-memory relational store fallback:', (err as any).message);
    return false;
  }
}
