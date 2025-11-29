#include "SERVER.h"
#include <HttpClient.h>

HTTPClient http;

SERVER::SERVER()
{
    // Inicializa variáveis
    airTemperatureSum = 0;
    airHumiditySum = 0;
    soilTemperatureSum = 0;
    soilMoistureSum = 0;
    readingsCount = 0;
}

bool SERVER::begin()
{
    int attempts = 0;
    const int maxAttempts = 20;
    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED && attempts < maxAttempts)
    {
        delay(1000);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.println(" Conectado!");
        return true;
    }
    else
    {
        Serial.println(" FALHOU!");
        return false;
    }
}

void SERVER::send(String data)
{
    if (WiFi.status() == WL_CONNECTED)
    {
        http.begin(String(server) + String(endpoint));
        http.addHeader("Content-Type", "application/json");
        int httpResponseCode = http.POST(data);
        if (httpResponseCode > 0)
        {
            String response = http.getString();
            Serial.println("[BACKEND] Resposta: " + String(httpResponseCode));
            if (response.length() > 0 && response.length() < 200)
            {
                Serial.println("[BACKEND] " + response);
            }
        }
        else
        {
            Serial.println("[BACKEND] ERRO: " + String(httpResponseCode));
        }
        http.end();
    }
    else
    {
        Serial.println("[BACKEND] ERRO: WiFi desconectado");
    }
}

// Gera um número aleatório dentro de um intervalo
float SERVER::getRandomNumber(float min, float max)
{
    return min + random(1000) / 1000.0 * (max - min);
}

// Adiciona uma leitura à soma para calcular a média posteriormente
void SERVER::addSensorReading(float airTemperature, float airHumidity, float soilTemperature, int soilMoisture, float flowRate, float totalVolume)
{
    airTemperatureSum += airTemperature;
    airHumiditySum += airHumidity;
    soilTemperatureSum += soilTemperature;
    soilMoistureSum += soilMoisture;
    readingsCount++;
}

// Envia a média dos dados coletados
void SERVER::sendAverageSensorData()
{
    // Se não há leituras, não envia nada
    if (readingsCount == 0)
    {
        return;
    }

    // Calcula as médias
    float avgAirTemp = airTemperatureSum / readingsCount;
    float avgAirHumidity = airHumiditySum / readingsCount;
    float avgSoilTemp = soilTemperatureSum / readingsCount;
    float avgSoilMoisture = soilMoistureSum / readingsCount;
    float avgFlowRate = flowRateSum / readingsCount;

    avgSoilMoisture = (1.0 - (avgSoilMoisture / 4095.0)) * 100.0; // Converte para porcentagem e inverte

    // Log formatado das médias
    Serial.println("\n========================================");
    Serial.println("[ENVIO] MEDIA DOS SENSORES (" + String(readingsCount) + " leituras)");
    Serial.println("----------------------------------------");
    Serial.println("  Temp Ar:     " + String(avgAirTemp, 1) + " C");
    Serial.println("  Umidade Ar:  " + String(avgAirHumidity, 1) + " %");
    Serial.println("  Temp Solo:   " + String(avgSoilTemp, 1) + " C");
    Serial.println("  Umid Solo:   " + String(avgSoilMoisture, 1) + " %");
    Serial.println("----------------------------------------");

    // Construir JSON com todos os dados dos sensores
    String jsonData = "{";
    jsonData += "\"air_temperature\":" + String(avgAirTemp, 2) + ",";
    jsonData += "\"air_humidity\":" + String(avgAirHumidity, 2) + ",";
    jsonData += "\"soil_temperature\":" + String(avgSoilTemp, 2) + ",";
    jsonData += "\"soil_moisture\":" + String(avgSoilMoisture) + ",";
    jsonData += "\"greenhouseId\":\"" + String(greenhouseId) + "\"";
    jsonData += "}";

    // Envia o JSON para o servidor
    send(jsonData);
    Serial.println("========================================\n");

    // Reseta os contadores após o envio
    airTemperatureSum = 0;
    airHumiditySum = 0;
    soilTemperatureSum = 0;
    soilMoistureSum = 0;
    readingsCount = 0;
}

// Envia o status da bomba para o backend
void SERVER::sendPumpStatus(String status, unsigned long runtime, float volume)
{
    // Construir JSON com dados da bomba
    String jsonData = "{";
    jsonData += "\"type\":\"pump_status\",";
    jsonData += "\"status\":\"" + status + "\",";
    jsonData += "\"runtime_seconds\":" + String(runtime) + ",";
    jsonData += "\"volume_liters\":" + String(volume, 2) + ",";
    jsonData += "\"greenhouseId\":\"" + String(greenhouseId) + "\"";
    jsonData += "}";

    Serial.println("[PUMP] Enviando status: " + status);

    // Envia o JSON para o servidor no endpoint de pump status
    if (WiFi.status() == WL_CONNECTED)
    {
        http.begin(String(server) + "/pump/esp32-status");
        http.addHeader("Content-Type", "application/json");
        int httpResponseCode = http.POST(jsonData);
        if (httpResponseCode > 0)
        {
            String response = http.getString();
            Serial.println("[PUMP] Resposta: " + String(httpResponseCode));
        }
        else
        {
            Serial.println("[PUMP] ERRO: " + String(httpResponseCode));
        }
        http.end();
    }
    else
    {
        Serial.println("[PUMP] ERRO: WiFi desconectado");
    }
}

SERVER server;