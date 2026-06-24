import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;

if (databaseUrl && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaDatabaseUrl?: string;
};

const shouldReuseClient =
  globalForPrisma.prisma && globalForPrisma.prismaDatabaseUrl === databaseUrl;

export const prisma =
  shouldReuseClient
    ? globalForPrisma.prisma!
    : new PrismaClient(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaDatabaseUrl = databaseUrl;
}
