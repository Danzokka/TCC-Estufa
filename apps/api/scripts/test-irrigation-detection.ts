/**
 * Script para testar detecção de irrigação baseada em leituras de sensor
 *
 * Este script simula o fluxo:
 * 1. Envia leitura de sensor com umidade baixa
 * 2. Espera alguns segundos
 * 3. Envia leitura com aumento significativo de umidade (>15%)
 * 4. Verifica se irrigação foi detectada e notificação criada
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testIrrigationDetection() {
  console.log('🧪 Teste de Detecção de Irrigação via Sensor');
  console.log('=============================================\n');

  try {
    // 1. Buscar uma estufa com usuário
    console.log('🔍 Buscando estufa para teste...');
    const greenhouse = await prisma.greenhouse.findFirst({
      where: {
        ownerId: { not: undefined },
      },
      select: {
        id: true,
        name: true,
        ownerId: true,
      },
    });

    if (!greenhouse || !greenhouse.ownerId) {
      console.error('❌ Nenhuma estufa com dono encontrada');
      return;
    }

    console.log(`✅ Usando estufa: ${greenhouse.name} (${greenhouse.id})`);
    console.log(`   Dono: ${greenhouse.ownerId}\n`);

    // 2. Enviar leitura com umidade baixa
    console.log('📊 Enviando leitura 1 com umidade baixa (25%)...');

    const reading1 = await fetch(`${API_BASE_URL}/sensor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        greenhouseId: greenhouse.id,
        air_temperature: 25.0,
        air_humidity: 60.0,
        soil_temperature: 22.0,
        soil_moisture: 25.0, // Umidade baixa
      }),
    });

    const data1 = await reading1.json();
    console.log('✅ Leitura 1 enviada:', data1.message || 'OK');

    // 3. Aguardar para simular tempo entre leituras
    console.log('\n⏳ Aguardando 3 segundos...\n');
    await delay(3000);

    // 4. Enviar leitura com aumento significativo (>15%)
    console.log('📊 Enviando leitura 2 com aumento de umidade (50%)...');
    console.log('   Aumento esperado: +25% (25% → 50%)');

    const reading2 = await fetch(`${API_BASE_URL}/sensor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        greenhouseId: greenhouse.id,
        air_temperature: 24.5,
        air_humidity: 62.0,
        soil_temperature: 21.5,
        soil_moisture: 50.0, // Aumento de 25% (maior que threshold de 15%)
      }),
    });

    const data2 = await reading2.json();
    console.log('✅ Leitura 2 enviada:', data2.message || 'OK');

    // 5. Verificar se irrigação foi detectada
    console.log('\n🔍 Verificando irrigações detectadas...');
    await delay(2000);

    const irrigations = await prisma.irrigation.findMany({
      where: {
        greenhouseId: greenhouse.id,
        type: 'detected',
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Últimos 5 minutos
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (irrigations.length > 0) {
      console.log(`✅ ${irrigations.length} irrigação(ões) detectada(s)!`);
      irrigations.forEach((irr, i) => {
        console.log(`   ${i + 1}. ID: ${irr.id}`);
        console.log(`      Notas: ${irr.notes}`);
        console.log(`      Data: ${irr.createdAt.toISOString()}`);
      });
    } else {
      console.log('⚠️ Nenhuma irrigação detectada');
      console.log(
        '   Isso pode ocorrer se já existe uma irrigação recente (últimas 2h)',
      );
    }

    // 6. Verificar notificações criadas
    console.log('\n🔔 Verificando notificações...');

    const notifications = await prisma.notification.findMany({
      where: {
        userId: greenhouse.ownerId,
        type: 'irrigation_detected',
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (notifications.length > 0) {
      console.log(`✅ ${notifications.length} notificação(ões) encontrada(s)!`);
      notifications.forEach((notif, i) => {
        console.log(`   ${i + 1}. Título: ${notif.title}`);
        console.log(`      Mensagem: ${notif.message}`);
        console.log(`      Lida: ${notif.isRead ? 'Sim' : 'Não'}`);
      });
    } else {
      console.log('ℹ️ Nenhuma notificação de irrigação encontrada');
    }

    console.log('\n📋 Resumo:');
    console.log('===========');
    console.log(`✅ Leituras enviadas: 2`);
    console.log(`📊 Irrigações detectadas: ${irrigations.length}`);
    console.log(`🔔 Notificações criadas: ${notifications.length}`);

    console.log('\n🎉 Teste concluído!');
    console.log('\n📱 Para verificar no frontend:');
    console.log('1. Acesse o dashboard');
    console.log('2. Clique no ícone de sino (🔔)');
    console.log(
      '3. Verifique se a notificação de "Irrigação Detectada" aparece',
    );
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
testIrrigationDetection();
