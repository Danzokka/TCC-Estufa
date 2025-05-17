#pragma once

#include <Arduino.h>
#include <WiFi.h>
#include "CONFIG.h"

class SERVER
{
private:
    const char *ssid = "Dantas_2.4G";
    const char *password = "29281917";
    const char *server = "http://192.168.1.100:5000"; // Atualizado para IP local e porta 5000
    const char *endpoint = "/data";

public:
    SERVER();
    bool begin();
    void send(String data);
    void sendSensorData(float airTemperature, float airHumidity, String soilHumidity, float soilTemperature);
};

extern SERVER server;
