#pragma once

#include <WiFi.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Arduino.h>

// Forward declaration
class QRConfigManager;

class OledDisplay
{
private:
    static const int SCREEN_WIDTH = 128;
    static const int SCREEN_HEIGHT = 64;
    static const int OLED_RESET = -1; // Mudado para -1

    Adafruit_SSD1306 display;

public:
    OledDisplay();
    bool begin();
    void clear();
    void showBitmap(const uint8_t *bitmap);
    void animateBitmap(const uint8_t *bitmap, int speed, int animationStep);
    void output(float temperature, float humidity, String soilHumidity);
    void outputWithFlow(float temperature, float humidity, String soilHumidity, float flowRate, float totalVolume);
    void outputWithPump(float temperature, float humidity, String soilHumidity, float flowRate, float totalVolume, String pumpStatus, String pumpDetails);
    void outputPumpActivation(int duration, float waterAmount);
    // MODO DESENVOLVIMENTO: QR Config desabilitado
    void displayQRCode(QRConfigManager *qrConfig); // Mantém assinatura mas função comentada
    void displaySystemInfo();                      // Nova função para mostrar informações do ESP32
    void displayConfigurationStatus(const String &status, const String &details = "");
    void displayWiFiConnection(const String &ssid, const String &ip = "");
    void update();
};

// Declaração externa do bitmap
extern const unsigned char myBitmap[] PROGMEM;
extern OledDisplay oled;