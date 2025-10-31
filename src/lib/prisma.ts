import { PrismaClient } from '../generated/prisma';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const enableQueryLogs = process.env.PRISMA_LOG_QUERIES === 'true' || false;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    ...(enableQueryLogs ? { log: ['query'] } : {}),
    transactionOptions: {
      maxWait: 5000,
      timeout: 15000,
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
