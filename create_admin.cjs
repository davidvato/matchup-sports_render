const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.upsert({
      where: { username: 'admin' },
      update: { password: 'admin123' },
      create: {
        username: 'admin',
        password: 'admin123',
        role: 'ADMIN'
      }
    });
    console.log('Admin user created/updated successfully:', user.username);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
