// Using native fetch (Node.js 18+)

async function testSensorEndpoint() {
  try {
    console.log('🧪 Testando endpoint /sensor...\n');

    const testData = {
      air_temperature: 25.0,
      air_humidity: 60.0,
      soil_temperature: 22.0,
      soil_moisture: 30,
      light_intensity: 500.0,
      water_level: 80.0,
      water_reserve: 100.0,
      userPlant: '91ebde10-0b6a-4b20-9099-1f92603045dd',
    };

    console.log('📤 Enviando dados:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:5000/sensor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Headers:`, Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log(`📊 Response:`, responseText);

    if (response.ok) {
      console.log('✅ Sucesso!');
    } else {
      console.log('❌ Erro na requisição');
    }
  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

testSensorEndpoint();
