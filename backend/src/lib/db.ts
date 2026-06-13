import { PrismaClient } from "@prisma/client";

// Single PrismaClient for the whole process. Without this cache,
// tsx watch restarts (dev) and serverless re-invocations (Vercel)
// would each open a new connection pool and exhaust Neon's limit.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaDirect?: PrismaClient;
};

function createClient(url?: string) {
  if (url) {
    return new PrismaClient({ datasources: { db: { url } } });
  }
  return new PrismaClient();
}

const prisma = globalForPrisma.prisma ?? createClient();

// Neon pooled URLs (PgBouncer) do not support interactive transactions.
// Use DIRECT_URL for $transaction callbacks (bookings overlap check).
const prismaDirect =
  globalForPrisma.prismaDirect ??
  createClient(process.env.DIRECT_URL ?? process.env.DATABASE_URL);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaDirect = prismaDirect;
}

export { prismaDirect };
export default prisma;
