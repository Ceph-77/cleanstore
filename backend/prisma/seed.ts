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
  chef_equipe: "Chef d'équipe",
  comptable: "Comptable",
  mecanicien: "Mécanicien",
  developpeur: "Développeur",
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

  await seedTaskTemplates();

  console.log(`Seeded roles and admin user: ${adminEmail}`);
}

/**
 * Starter task templates — deliberately generic. Céphas edits the real content
 * (equipment, checkpoints, targets, price) in /admin/task-templates.
 * Upsert by name so re-seeding never duplicates or overwrites his edits
 * (update: {} = leave existing rows alone).
 */
async function seedTaskTemplates() {
  const templates: {
    name: string;
    description: string;
    taskType: string;
    estimatedDurationMinutes: number;
    isRecurringDefault: boolean;
    expectedResultText: string;
    howToText: string;
    requiredEquipment: string[];
    metricLabel?: string;
    metricUnit?: string;
    defaultMetricTarget?: number;
    steps: string[];
  }[] = [
    {
      name: "Polissage",
      description: "Polissage des planchers durs de la surface de vente.",
      taskType: "Entretien plancher",
      estimatedDurationMinutes: 90,
      isRecurringDefault: true,
      expectedResultText:
        "Planchers uniformément brillants, sans traces ni marques de talon, allées dégagées. Aucune zone sautée.",
      howToText:
        "Passer l'autolaveuse puis la polisseuse haute vitesse sur toutes les allées de la surface de vente. Reprendre les bordures et sous les présentoirs accessibles.",
      requiredEquipment: ["Polisseuse haute vitesse", "Tampons de polissage", "Autolaveuse", "Balai à franges"],
      metricLabel: "Distance polie",
      metricUnit: "km",
      defaultMetricTarget: 1.6,
      steps: [
        "Zone de vente dégagée et signalisation « plancher glissant » posée",
        "Toutes les allées principales polies",
        "Bordures et pourtours des présentoirs repris",
        "Aucune trace ni résidu de tampon visible",
        "Équipement rincé et rangé, signalisation retirée",
      ],
    },
    {
      name: "Balayage",
      description: "Balayage et ramassage des débris de la surface de vente et de l'entrepôt.",
      taskType: "Entretien plancher",
      estimatedDurationMinutes: 45,
      isRecurringDefault: true,
      expectedResultText: "Sols exempts de débris, poussière et emballages. Coins et dessous de présentoirs inclus.",
      howToText:
        "Balayer toutes les allées, l'entrepôt et les zones de caisses. Ramasser et jeter les débris. Vider les poubelles de plancher.",
      requiredEquipment: ["Balai", "Porte-poussière", "Sacs à ordures"],
      steps: [
        "Allées de vente balayées",
        "Entrepôt et réserve balayés",
        "Coins et dessous de présentoirs dégagés",
        "Débris jetés, poubelles de plancher vidées",
      ],
    },
  ];

  for (const t of templates) {
    const { steps, ...scalars } = t;
    await prisma.taskTemplate.upsert({
      where: { name: t.name },
      update: {},
      create: {
        ...scalars,
        steps: { create: steps.map((text, i) => ({ order: i, text })) },
      },
    });
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
