#include "SOIL_SENSOR.h"

SOIL_SENSOR::SOIL_SENSOR()
{
    oneWire = NULL;
    tempSensor = NULL;
    soilTemperature = 0.0;
    moistureRaw = 0;
}

SOIL_SENSOR::~SOIL_SENSOR()
{
    if (tempSensor != NULL)
    {
        delete tempSensor;
    }
    if (oneWire != NULL)
    {
        delete oneWire;
    }
}

bool SOIL_SENSOR::begin()
{
    pinMode(sensorPower, OUTPUT);
    digitalWrite(sensorPower, LOW);

    // Initialize DS18B20 temperature sensor
    oneWire = new OneWire(oneWirePin);
    tempSensor = new DallasTemperature(oneWire);
    tempSensor->begin();

    Serial.println(F("Soil sensor initialized!"));
    return true;
}

void SOIL_SENSOR::read()
{
    // Read soil moisture
    digitalWrite(sensorPower, HIGH);     // Turn the sensor ON
    delay(10);                           // Allow power to settle
    moistureRaw = analogRead(sensorPin); // Read the analog value from sensor
    digitalWrite(sensorPower, LOW);      // Turn the sensor OFF

    // Mapeando valor para uma escala de 0 a 100% (invertido, pois valores maiores = solo mais seco)
    int mappedValue = map(moistureRaw, 4095, 0, 0, 100); // Inverte a escala
    mappedValue = constrain(mappedValue, 0, 100);        // Garante que o valor esteja entre 0 e 100

    soilHumidity = format(moistureRaw);

    // Read soil temperature
    tempSensor->requestTemperatures();
    float tempReading = tempSensor->getTempCByIndex(0);

    // Verifica se a leitura é válida
    if (tempReading != DEVICE_DISCONNECTED_C && tempReading != -127.00)
    {
        soilTemperature = tempReading;
    }
    else
    {
        Serial.println("Erro na leitura do sensor de temperatura do solo!");
        // Mantém o valor anterior, não atualiza soilTemperature
    }

    // Print readings to serial
    Serial.print("Soil Humidity: ");
    Serial.println(soilHumidity);
    Serial.print("Soil Moisture Raw: ");
    Serial.println(moistureRaw);
    Serial.print("Soil Moisture Percentage: ");
    Serial.print(mappedValue);
    Serial.println("%");
    Serial.print("Soil Temperature: ");
    Serial.print(soilTemperature);
    Serial.println(" °C");
}

String SOIL_SENSOR::format(int val)
{

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
    else if (val > 2000 && val <= 3000)
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

String SOIL_SENSOR::getJsonData()
{
    // Construir JSON com todos os dados do sensor de solo
    String jsonData = "{";
    jsonData += "\"soilHumidity\":\"" + soilHumidity + "\",";
    jsonData += "\"soilMoistureRaw\":" + String(moistureRaw) + ",";
    jsonData += "\"soilTemperature\":" + String(soilTemperature);
    jsonData += "}";

    return jsonData;
}

SOIL_SENSOR soil_sensor;