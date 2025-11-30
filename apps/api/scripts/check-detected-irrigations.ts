import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDetectedIrrigations() {
  const greenhouseId = 'f28ed112-f59c-47ac-a43b-4138f656f93e';

  console.log(
    `\n🔍 Checking detected irrigations for greenhouse: ${greenhouseId}\n`,
  );

  // Find all irrigations
  const irrigations = await prisma.irrigation.findMany({
    where: { greenhouseId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      greenhouse: { select: { name: true } },
      sensor: { select: { id: true, timestamp: true, soilMoisture: true } },
    },
  });

  if (irrigations.length === 0) {
    console.log('❌ No irrigations found for this greenhouse');
  } else {
    console.log(`✅ Found ${irrigations.length} irrigation(s):\n`);
    irrigations.forEach((irr, i) => {
      console.log(`${i + 1}. ID: ${irr.id}`);
      console.log(`   Type: ${irr.type}`);
      console.log(`   Notes: ${irr.notes || 'N/A'}`);
      console.log(`   Created: ${irr.createdAt}`);
      console.log(`   Status: ${irr.type}`);
      if (irr.sensor) {
        console.log(
          `   Sensor Reading: ${irr.sensor.soilMoisture}% at ${irr.sensor.timestamp}`,
        );
      }
      console.log('');
    });
  }

  // Also check notifications
  console.log('\n📬 Checking related notifications:\n');
  const notifications = await prisma.notification.findMany({
    where: {
      type: 'irrigation_detected',
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  if (notifications.length === 0) {
    console.log('❌ No irrigation_detected notifications found');
  } else {
    console.log(`✅ Found ${notifications.length} notification(s):\n`);
    notifications.forEach((n, i) => {
      console.log(`${i + 1}. ${n.title}`);
      console.log(`   Message: ${n.message}`);
      console.log(`   Created: ${n.createdAt}`);
      console.log(`   Read: ${n.isRead}`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

checkDetectedIrrigations().catch(console.error);
