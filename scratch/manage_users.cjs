const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Create or update admin user
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: 'admin123' },
    create: {
      username: 'admin',
      password: 'admin123',
      role: 'SUPERADMIN'
    }
  });
  console.log('Admin user created/updated:', admin);

  // 2. Find davidvato
  const david = await prisma.user.findUnique({
    where: { username: 'davidvato' }
  });

  if (david) {
    // 3. Move tournaments to admin before deleting if necessary
    // Actually, let's just update the creatorId of all tournaments to admin's id
    const updateResult = await prisma.tournament.updateMany({
      where: { creatorId: david.id },
      data: { creatorId: admin.id }
    });
    console.log(`Moved ${updateResult.count} tournaments from davidvato to admin.`);

    // 4. Delete davidvato
    await prisma.user.delete({
      where: { id: david.id }
    });
    console.log('User davidvato deleted.');
  } else {
    console.log('User davidvato not found.');
  }
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
