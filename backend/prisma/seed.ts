import "dotenv/config";
import { PrismaClient, RoleKey } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

const ROLE_LABELS: Record<RoleKey, string> = {
  admin: "Administrateur",
  grande_compagnie: "Grande compagnie",
  sous_traitant: "Sous-traitant",
  inspecteur: "Inspecteur",
  travailleur: "Travailleur autonome",
};

async function main() {
  for (const key of Object.values(RoleKey)) {
    await prisma.role.upsert({
      where: { key },
      update: {},
      create: { key, label: ROLE_LABELS[key] },
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@cleanstore.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { key: RoleKey.admin } });
  const passwordHash = await hashPassword(adminPassword);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      fullName: "Admin",
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });

  console.log(`Seeded roles and admin user: ${adminEmail}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
