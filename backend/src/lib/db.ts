import { PrismaClient } from "@prisma/client";

// Single PrismaClient for the whole process. Without this cache,
// tsx watch restarts (dev) and serverless re-invocations (Vercel)
// would each open a new connection pool and exhaust Neon's limit.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
