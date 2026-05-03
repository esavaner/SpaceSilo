import { prisma } from './prisma';

const DEV_USER = {
  email: 't@t.com',
  password: '123456',
  passwordHash: '$2b$10$aRzulguMjlMOTKqGbBbHZuqW/ryrFbUfcnn0tC0OauV.7.Noja7I6',
  groupId: 'testcom',
  groupName: 'Personal',
} as const;

async function main() {
  const user = await prisma.user.upsert({
    where: { email: DEV_USER.email },
    update: {
      password: DEV_USER.passwordHash,
      role: 'user',
    },
    create: {
      email: DEV_USER.email,
      password: DEV_USER.passwordHash,
      role: 'user',
    },
  });

  await prisma.group.upsert({
    where: { id: DEV_USER.groupId },
    update: {
      ownerId: user.id,
      name: DEV_USER.groupName,
      personal: true,
    },
    create: {
      id: DEV_USER.groupId,
      ownerId: user.id,
      name: DEV_USER.groupName,
      personal: true,
    },
  });

  console.log(`Seeded dev user ${DEV_USER.email} with personal group ${DEV_USER.groupId}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
