import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Recent Automatic Irrigations ===');

  const irrigations = await prisma.irrigation.findMany({
    where: { type: 'automatic' },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  irrigations.forEach((i) => {
    console.log(`  ID: ${i.id}`);
    console.log(`  Type: ${i.type} | Water: ${i.waterAmount}L`);
    console.log(`  Notes: ${(i.notes || 'N/A').substring(0, 80)}`);
    console.log('');
  });

  console.log('\n=== Recent Pump Notifications ===');

  const notifications = await prisma.notification.findMany({
    where: { type: { in: ['pump_activated', 'pump_error'] } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  notifications.forEach((n) => {
    console.log(`  ID: ${n.id}`);
    console.log(`  Type: ${n.type} | Title: ${n.title}`);
    console.log(`  Message: ${(n.message || 'N/A').substring(0, 60)}`);
    console.log('');
  });

  await prisma.$disconnect();
}

main().catch(console.error);
