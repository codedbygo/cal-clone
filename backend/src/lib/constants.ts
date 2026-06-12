import prisma from "./db";

export const DEFAULT_USER_EMAIL = "host@example.com";

let cachedUserId: string | null = null;

// Every admin route acts as the seeded host — the client never supplies
// a userId (prevents IDOR; LLD §2.3). Resolved by email rather than env
// var so deploys don't depend on a generated cuid.
export async function getDefaultUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;

  const user = await prisma.user.findUnique({
    where: { email: DEFAULT_USER_EMAIL },
    select: { id: true },
  });
  if (!user) {
    throw new Error(
      `Default user ${DEFAULT_USER_EMAIL} not found — run \`npx prisma db seed\``,
    );
  }

  cachedUserId = user.id;
  return cachedUserId;
}
