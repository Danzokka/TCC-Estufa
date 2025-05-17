#include <Arduino.h>
#include <Oled.h>
#include <TH_SENSOR.h>
#include <SERVER.h>
#include <SOIL_SENSOR.h>

#define SWITCHPIN 22

// Intervalo de tempo para envio de dados ao servidor (2 minutos e meio = 150000 ms)
const unsigned long SEND_INTERVAL = 30 * 1000; // 30 segundos
unsigned long lastSendTime = 0;

void setup()
{
    Serial.begin(9600);

    // Inicializa o gerador de números aleatórios
    randomSeed(analogRead(0));

    if (!server.begin())
    {
        Serial.println(F("Error initializing server!"));
        for (;;)
            ;
    }

    if (!th_sensor.begin())
    {
        Serial.println(F("Error initializing sensor!"));
        for (;;)
            ;
    }

    if (!oled.begin())
    {
        Serial.println(F("SSD1306 allocation failed"));
        for (;;)
            ;
    }

    if (!soil_sensor.begin())
    {
        Serial.println(F("Error initializing soil sensor!"));
        for (;;)
            ;
    }
    pinMode(SWITCHPIN, INPUT);

    oled.clear();
    delay(200);

    Serial.println("Setup completed. System running.");
}

void loop()
{
    // Leitura dos sensores
    th_sensor.read();
    soil_sensor.read();

    // Atualiza o display
    if (digitalRead(SWITCHPIN) == HIGH)
    {
        oled.showBitmap(myBitmap);
        oled.update();
    }
    else
    {
        // Adicionando temperatura do solo no display
        oled.output(th_sensor.temperature, th_sensor.humidity, soil_sensor.soilHumidity + " " + String(soil_sensor.soilTemperature, 1) + "C");
        oled.update();
    } // Verifica se é hora de enviar dados ao servidor
    unsigned long currentMillis = millis();

    // Adiciona leituras atuais para calcular a média posteriormente
    server.addSensorReading(
        th_sensor.temperature,
        th_sensor.humidity,
        soil_sensor.soilTemperature,
        soil_sensor.moistureRaw);

    if (currentMillis - lastSendTime >= SEND_INTERVAL)
    {
        // Envia as médias dos dados coletados no intervalo para o backend
        server.sendAverageSensorData();

        // Atualiza o tempo do último envio
        lastSendTime = currentMillis;
    }

    delay(1000);
}
