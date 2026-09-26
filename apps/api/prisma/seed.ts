import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed demo user and categories
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: { email: 'demo@example.com', passwordHash: '$2b$12$u4b5c88sJ0I1x8a7Uo5x2eKiwqT7m3mQ5s1Jr0q1TQjYwXjH3hN9e' }, // 'password' (not for prod)
  });
  await prisma.category.createMany({
    data: [
      { userId: user.id, name: 'Food', color: '#ff6b6b' },
      { userId: user.id, name: 'Transport', color: '#4dabf7' },
    ],
    skipDuplicates: true,
  });
}

main().finally(() => prisma.$disconnect());
