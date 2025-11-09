import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUpdate() {
  const reading = await prisma.greenhouseSensorReading.findUnique({
    where: { id: '7ee279c2-26fa-48f4-af5a-7e35d12a2d36' }
  });
  
  if (!reading) {
    console.log('Leitura nao encontrada');
    await prisma.$disconnect();
    return;
  }
  
  console.log('Leitura apos AI analysis:');
  console.log('  ID:', reading.id.substring(0, 8) + '...');
  console.log('  Temp:', reading.airTemperature + 'C');
  console.log('  Solo:', reading.soilMoisture + '%');
  console.log('  Health Score:', reading.plantHealthScore || 'aguardando...');
  console.log('  Timestamp:', reading.timestamp.toLocaleString());
  
  await prisma.$disconnect();
}

checkUpdate();
