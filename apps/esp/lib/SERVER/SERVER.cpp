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
    Serial.println("Connecting to WiFi..");

    int attempts = 0;
    const int maxAttempts = 20;
    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED && attempts < maxAttempts)
    {
        delay(1000);
        Serial.print("Connecting to WiFi.. Attempt ");
        Serial.print(attempts + 1);
        Serial.print("/");
        Serial.println(maxAttempts);
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.println("Connected to the WiFi network");
        Serial.print("IP address: ");
        Serial.println(WiFi.localIP());
        return true;
    }
    else
    {
        Serial.println("Failed to connect to WiFi after 20 attempts");
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
            Serial.println(httpResponseCode);
            Serial.println(response);
        }
        else
        {
            Serial.print("Error on sending POST: ");
            Serial.println(httpResponseCode);
        }
        http.end();
    }
    else
    {
        Serial.println("WiFi Disconnected. Cannot send data.");
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

    Serial.println("Leitura de sensor adicionada para média. Total de leituras: " + String(readingsCount));
}

// Envia a média dos dados coletados
void SERVER::sendAverageSensorData()
{
    // Se não há leituras, não envia nada
    if (readingsCount == 0)
    {
        Serial.println("Nenhuma leitura para enviar");
        return;
    } // Calcula as médias
    float avgAirTemp = airTemperatureSum / readingsCount;
    float avgAirHumidity = airHumiditySum / readingsCount;
    float avgSoilTemp = soilTemperatureSum / readingsCount;
    float avgSoilMoisture = soilMoistureSum / readingsCount;
    float avgFlowRate = flowRateSum / readingsCount;

    // Gera valores aleatórios somente para sensores que não temos
    float lightIntensity = getRandomNumber(600, 1000); // Valor típico em lux
    float waterLevel = getRandomNumber(70, 95);        // Percentual

    // Construir JSON com todos os dados dos sensores
    String jsonData = "{";
    jsonData += "\"air_temperature\":" + String(avgAirTemp, 2) + ",";
    jsonData += "\"air_humidity\":" + String(avgAirHumidity, 2) + ",";
    jsonData += "\"soil_temperature\":" + String(avgSoilTemp, 2) + ",";
    jsonData += "\"soil_moisture\":" + String(avgSoilMoisture) + ",";
    jsonData += "\"light_intensity\":" + String(lightIntensity, 2) + ",";
    jsonData += "\"water_level\":" + String(waterLevel, 2) + ",";
    jsonData += "\"greenhouseId\":\"" + String(greenhouseId) + "\"";
    jsonData += "}";

    Serial.print("Sending average data to server: ");
    Serial.println(jsonData);

    // Envia o JSON para o servidor
    send(jsonData); // Reseta os contadores após o envio
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

    Serial.print("Sending pump status to server: ");
    Serial.println(jsonData);

    // Envia o JSON para o servidor no endpoint de pump status
    if (WiFi.status() == WL_CONNECTED)
    {
        http.begin(String(server) + "/pump/esp32-status");
        http.addHeader("Content-Type", "application/json");
        int httpResponseCode = http.POST(jsonData);
        if (httpResponseCode > 0)
        {
            String response = http.getString();
            Serial.println("Pump status response: " + String(httpResponseCode));
            Serial.println(response);
        }
        else
        {
            Serial.print("Error sending pump status: ");
            Serial.println(httpResponseCode);
        }
        http.end();
    }
    else
    {
        Serial.println("WiFi Disconnected. Cannot send pump status.");
    }
}

SERVER server;