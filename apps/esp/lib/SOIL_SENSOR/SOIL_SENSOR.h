#pragma once

#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>

class SOIL_SENSOR
{
private:
    const uint8_t sensorPower = 15; // Define the digital sensor power pin
    const uint8_t sensorPin = 34;   // Define the analog sensor pin
    const uint8_t oneWirePin = 18;  // Define the digital DS18B20 sensor pin
    OneWire *oneWire;
    DallasTemperature *tempSensor;

public:
    SOIL_SENSOR();  // Constructor
    ~SOIL_SENSOR(); // Destructor
    String soilHumidity;
    float soilTemperature; // Variable to store soil temperature
    int moistureRaw;       // Armazenar o valor bruto da leitura de umidade do solo
    bool begin();
    void read();
    String format(int val);
    // Métodos para obter dados formatados
    String getJsonData();
};

extern SOIL_SENSOR soil_sensor;
