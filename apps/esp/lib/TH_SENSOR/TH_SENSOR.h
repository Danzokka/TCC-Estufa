#pragma once

#include <Wire.h>
#include <Arduino.h>
#include <Adafruit_Sensor.h>
#include <DHT_U.h>
#include <DHT.h>

class TH_SENSOR {
private:
    static const int DHTPIN = 23;
    static const uint8_t DHTTYPE = DHT22;
    DHT_Unified* dht;
public:
    TH_SENSOR();
    float temperature;
    float humidity;
    bool begin();
    void read();
};

// Declaração externa do bitmap
extern TH_SENSOR th_sensor;