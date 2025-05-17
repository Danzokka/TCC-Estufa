#include "SERVER.h"
#include <HttpClient.h>

HTTPClient http;

SERVER::SERVER() {}

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

void SERVER::sendSensorData(float airTemperature, float airHumidity, String soilHumidity, float soilTemperature)
{
    // Construir JSON com todos os dados dos sensores
    String jsonData = "{";
    jsonData += "\"airTemperature\":" + String(airTemperature) + ",";
    jsonData += "\"airHumidity\":" + String(airHumidity) + ",";
    jsonData += "\"soilHumidity\":\"" + soilHumidity + "\",";
    jsonData += "\"soilTemperature\":" + String(soilTemperature) + ",";
    jsonData += "\"timestamp\":\"" + String(millis()) + "\""; // Adicionando timestamp para rastreamento
    jsonData += "}";

    Serial.print("Sending data to server: ");
    Serial.println(jsonData);

    // Enviar o JSON para o servidor
    send(jsonData);
}

SERVER server;