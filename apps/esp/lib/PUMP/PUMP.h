#pragma once

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <freertos/semphr.h>

// Pump control configuration
#define PUMP_RELAY_PIN 2         // GPIO pin for LED/relay control (Built-in LED for testing)
#define PUMP_MAX_DURATION 300000 // Maximum 5 minutes (300 seconds) for safety
#define HTTP_SERVER_PORT 8080    // HTTP server port for pump control (changed to avoid conflict)
#define PUMP_ML_PER_SECOND 30.0  // Approximate water flow rate: 30 mL per second

// Pump status enumeration
enum PumpStatus
{
    PUMP_OFF = 0,
    PUMP_ON = 1,
    PUMP_ERROR = 2
};

// Pump operation mode enumeration
enum PumpMode
{
    MODE_MANUAL = 0,
    MODE_DURATION = 1,
    MODE_VOLUME = 2
};

class PumpController
{
private:
    WebServer httpServer;

    // Pump state variables
    volatile PumpStatus pumpStatus;
    volatile PumpMode currentMode;
    volatile unsigned long pumpStartTime;
    volatile unsigned long pumpDuration;
    volatile float targetVolume;
    volatile float currentVolume;

    // Safety and control
    volatile bool emergencyStop;
    volatile bool pumpEnabled;

    // Task handles
    TaskHandle_t pumpControlTaskHandle;
    TaskHandle_t httpServerTaskHandle;

    // Mutex for thread safety
    SemaphoreHandle_t pumpMutex;

    // HTTP server handlers
    void handleActivatePump();
    void handleDeactivatePump();
    void handlePumpStatus();
    void handleEmergencyStop();
    void handleReset();
    void handleNotFound();

    // Internal pump control methods
    void activateRelay();
    void deactivateRelay();
    bool validateDuration(unsigned long duration);
    bool validateVolume(float volume);

    // Task functions
    static void pumpControlTask(void *parameter);
    static void httpServerTask(void *parameter);

    // JSON response helpers
    String createStatusResponse();
    String createErrorResponse(const String &error);

public:
    PumpController();
    ~PumpController();

    // Initialization and control
    bool begin();
    void stop();

    // Pump control methods
    bool activatePump(unsigned long duration = 0);
    bool activatePumpForVolume(float volume);
    bool deactivatePump();
    bool emergencyStopPump();

    // Status and monitoring
    PumpStatus getCurrentStatus() const;
    PumpMode getCurrentMode() const;
    unsigned long getRemainingTime() const;
    float getCurrentVolume() const;
    float getTargetVolume() const;
    bool isEnabled() const;

    // Volume monitoring (to be called from flow sensor)
    void updateVolume(float volume);

    // Safety features
    void enablePump();
    void disablePump();
    bool checkSafetyConditions();

    // Display helper for OLED
    String getPumpStatusText() const;
    String getPumpDetailsText() const;
};

// PUMP reativado para testes com LED interno
extern PumpController pumpController;
