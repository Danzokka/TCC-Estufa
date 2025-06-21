#pragma once

#include <Arduino.h>
#include <WiFi.h>
#include "CONFIG.h"

class SERVER
{
private:
    const char *ssid = "Dantas_2.4G";
    const char *password = "29281917";
    const char *server = "http://192.168.0.37:5000"; // Atualizado para IP local e porta 5000
    const char *endpoint = "/sensor";
    const char *userPlant = "e4066535-1f68-464e-bc74-5af60c664257"; // Nome da planta configurado manualmente    // Armazena as médias de leituras
    float airTemperatureSum = 0;
    float airHumiditySum = 0;
    float soilTemperatureSum = 0;
    int soilMoistureSum = 0;
    float flowRateSum = 0;
    float totalVolumeSum = 0;
    int readingsCount = 0;

public:
    SERVER();
    bool begin();    void send(String data);
    void addSensorReading(float airTemperature, float airHumidity, float soilTemperature, int soilMoisture, float flowRate = 0, float totalVolume = 0);
    void sendAverageSensorData();
    void sendPumpStatus(String status, unsigned long runtime, float volume);
    float getRandomNumber(float min, float max);
};

extern SERVER server;
