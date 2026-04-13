import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  const superAdmin = await prisma.user.upsert({
    where: { username: 'davidvato' },
    update: {},
    create: {
      username: 'davidvato',
      password: 'BleuBerry2026..', 
      role: 'SUPERADMIN',
    },
  });

  console.log('SuperAdmin verified:', superAdmin.username);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
