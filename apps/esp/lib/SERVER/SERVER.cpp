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

SERVER server;