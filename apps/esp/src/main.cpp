#include <Arduino.h>
#include <Oled.h>
#include <TH_SENSOR.h>
#include <SERVER.h>
#include <SOIL_SENSOR.h>

#define SWITCHPIN 22

void setup()
{
    Serial.begin(9600);

    if (!server.begin())
    {
        Serial.println(F("Error initializing server!"));
        for (;;)
            ;
    }

    if (!th_sensor.begin())
    {
        Serial.println(F("Error initializing sensor!"));
        for (;;)
            ;
    }

    if (!oled.begin())
    {
        Serial.println(F("SSD1306 allocation failed"));
        for (;;)
            ;
    }

    if (!soil_sensor.begin())
    {
        Serial.println(F("Error initializing soil sensor!"));
        for (;;)
            ;
    }

    pinMode(SWITCHPIN, INPUT);

    oled.clear();
    delay(200);
}

void loop()
{
    delay(1000);
    th_sensor.read();
    soil_sensor.read();
    if (digitalRead(SWITCHPIN) == HIGH)
    {
        oled.showBitmap(myBitmap);
        oled.update();
    }
    else
    {
        oled.output(th_sensor.temperature, th_sensor.humidity, soil_sensor.soilHumidity);
        oled.update();
    }
}
