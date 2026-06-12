import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Idempotent: upsert by unique keys so re-running never duplicates.
// Full seed data (event types, availability, bookings) lands in Task 1.1;
// this stub creates the default host the whole app depends on (LLD §2.3).
async function main() {
  const user = await prisma.user.upsert({
    where: { email: "host@example.com" },
    update: {},
    create: {
      name: "Default Host",
      email: "host@example.com",
      timezone: "America/New_York",
    },
  });

  console.log(`Seeded default user: ${user.name} <${user.email}> (${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
