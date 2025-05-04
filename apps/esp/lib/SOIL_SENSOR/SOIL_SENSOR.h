#pragma once

#include <Arduino.h>

class SOIL_SENSOR
{
private:
    const uint8_t sensorPower = 15; // Define the digital sensor power pin
    const uint8_t sensorPin = 34;   // Define the analog sensor pin

public:
    String soilHumidity;
    bool begin();
    void read();
    String format(int val);
};

extern SOIL_SENSOR soil_sensor;
