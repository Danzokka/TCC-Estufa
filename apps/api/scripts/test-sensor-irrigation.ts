/**
 * Script simples para testar envio de dados de sensor via HTTP
 *
 * Uso: npx ts-node scripts/test-sensor-irrigation.ts <greenhouseId>
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testSensorIrrigationDetection() {
  // Pegar greenhouseId dos argumentos ou usar um padrão
  const greenhouseId = process.argv[2];

  if (!greenhouseId) {
    console.log('❌ Erro: Forneça o greenhouseId como argumento');
    console.log(
      '   Uso: npx ts-node scripts/test-sensor-irrigation.ts <greenhouseId>',
    );
    console.log('\n💡 Para encontrar seu greenhouseId:');
    console.log('   1. Acesse o dashboard');
    console.log('   2. Abra o DevTools (F12) → Network');
    console.log('   3. Procure requisições para /sensor ou /greenhouse');
    return;
  }

  console.log('🧪 Teste de Detecção de Irrigação');
  console.log('==================================\n');
  console.log(`📍 Greenhouse ID: ${greenhouseId}\n`);

  try {
    // Passo 1: Enviar leitura com umidade baixa
    console.log('📊 Passo 1: Enviando leitura com umidade baixa (20%)...');

    const response1 = await fetch(`${API_BASE_URL}/sensor/sendData`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        greenhouseId,
        air_temperature: 25.0,
        air_humidity: 60.0,
        soil_temperature: 22.0,
        soil_moisture: 20.0,
      }),
    });

    if (!response1.ok) {
      const error = await response1.text();
      console.log('❌ Erro na leitura 1:', error);
      return;
    }

    console.log('✅ Leitura 1 enviada com sucesso');

    // Passo 2: Aguardar
    console.log('\n⏳ Aguardando 3 segundos...');
    await delay(3000);

    // Passo 3: Enviar leitura com aumento de umidade
    console.log(
      '\n📊 Passo 2: Enviando leitura com aumento de umidade (55%)...',
    );
    console.log('   Aumento: +35% (20% → 55%) - acima do threshold de 15%');

    const response2 = await fetch(`${API_BASE_URL}/sensor/sendData`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        greenhouseId,
        air_temperature: 24.5,
        air_humidity: 65.0,
        soil_temperature: 21.5,
        soil_moisture: 55.0,
      }),
    });

    if (!response2.ok) {
      const error = await response2.text();
      console.log('❌ Erro na leitura 2:', error);
      return;
    }

    console.log('✅ Leitura 2 enviada com sucesso');

    console.log('\n🎉 Teste concluído!');
    console.log('\n📱 Próximos passos:');
    console.log('1. Abra o dashboard no navegador');
    console.log('2. Clique no ícone de sino (🔔) no canto superior direito');
    console.log(
      '3. Verifique se aparece uma notificação "Irrigação Detectada"',
    );
    console.log(
      '4. Se conectado via WebSocket, a notificação deve aparecer automaticamente',
    );

    console.log('\n💡 Se não aparecer notificação:');
    console.log(
      '   - Pode já existir uma irrigação detectada nas últimas 2 horas',
    );
    console.log('   - Verifique se o greenhouseId está correto');
    console.log('   - Verifique os logs do servidor NestJS');
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testSensorIrrigationDetection();
