#include "SOIL_SENSOR.h"

bool SOIL_SENSOR::begin()
{
    pinMode(sensorPower, OUTPUT);
    digitalWrite(sensorPower, LOW);
    Serial.println(F("Soil sensor initialized!"));
    return true;
}

void SOIL_SENSOR::read()
{
    digitalWrite(sensorPower, HIGH); // Turn the sensor ON
    delay(10);                       // Allow power to settle
    int val = analogRead(sensorPin); // Read the analog value form sensor
    digitalWrite(sensorPower, LOW);  // Turn the sensor OFF
    soilHumidity = format(val);
    Serial.print("Soil Humidity: ");
    Serial.println(soilHumidity);
    Serial.print("Soil Moisture: ");
    Serial.println(val);
}

String SOIL_SENSOR::format(int val)
{

    int maxValue = 4063;

    // Molhada 1000 a 1500
    // Encharcada de 750 a 1000
    // Extremamente encharcada de 0 a 750
    // Umida de 1500 a 2500
    // Seca de 2500 a 3500
    // Extremamente seca de 3500 a 4095

    if (val >= 0 && val <= 750)
    {
        return "Extremamente encharcada";
    }
    else if (val > 750 && val <= 1000)
    {
        return "Encharcada";
    }
    else if (val > 1000 && val <= 1500)
    {
        return "Muito Molhada";
    }
    else if (val > 1500 && val <= 2000)
    {
        return "Molhada";
    }
    else if (val > 2000 && val <= 2500)
    {
        return "Úmida";
    }
    else if (val > 3000 && val <= 3500)
    {
        return "Seca";
    }
    else if (val > 3500 && val <= 4095)
    {
        return "Extremamente seca";
    }
    else
    {
        return "Erro";
    }
}

SOIL_SENSOR soil_sensor;