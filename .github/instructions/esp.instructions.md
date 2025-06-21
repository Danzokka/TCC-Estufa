---
applyTo: "apps/esp/**/*.{cpp,h,hpp,c,ino,json,yml,yaml,ini,md}"
tools:
  [
    "mcp_brave-search_brave_web_search",
    "mcp_context7_get-library-docs",
    "semantic_search",
  ]
---

# ESP32 Development Guidelines - Arduino Framework & PlatformIO

## Links & Documentation

- [ESP32 Documentation](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/)
- [Arduino ESP32 Core](https://github.com/espressif/arduino-esp32)
- [PlatformIO ESP32 Platform](https://docs.platformio.org/en/latest/platforms/espressif32.html)
- [ESP32 Arduino Reference](https://github.com/espressif/arduino-esp32/tree/master/docs)
- [FreeRTOS Documentation](https://www.freertos.org/Documentation/RTOS_book.html)
- [ESP32 Power Management](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/system/power_management.html)
- [ESP32 WiFi Best Practices](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-guides/wifi.html)

## Tech Stack

- **ESP32** - Main microcontroller (ESP32-WROOM-32 or ESP32-DevKit)
- **Arduino Framework** - Development framework for easy programming
- **PlatformIO** - IDE and build system for embedded development
- **C++** - Primary programming language
- **FreeRTOS** - Real-time operating system (built into ESP32)
- **WiFi** - Wireless communication protocol
- **HTTP/HTTPS** - Communication with API backend
- **JSON** - Data serialization format
- **OTA Updates** - Over-the-air firmware updates

## Architecture & Patterns

### Project Structure

```
apps/esp/
├── platformio.ini              # PlatformIO configuration
├── src/
│   └── main.cpp               # Main application code
├── include/
│   ├── config.h               # Configuration constants
│   ├── sensors.h              # Sensor definitions
│   ├── wifi_manager.h         # WiFi management
│   ├── api_client.h           # API communication
│   └── power_manager.h        # Power management
├── lib/
│   ├── OLED/                  # OLED display library
│   ├── SOIL_SENSOR/           # Soil moisture sensor
│   ├── TH_SENSOR/             # Temperature/humidity sensor
│   ├── FLOW_SENSOR/           # Water flow sensor
│   └── SERVER/                # Server communication
├── test/
│   ├── test_sensors.cpp       # Sensor unit tests
│   ├── test_wifi.cpp          # WiFi functionality tests
│   └── test_api.cpp           # API communication tests
├── data/
│   ├── config.json            # Runtime configuration
│   └── certificates/          # SSL certificates
└── docs/
    ├── hardware_setup.md      # Hardware wiring guide
    ├── sensor_calibration.md  # Sensor calibration guide
    └── troubleshooting.md     # Common issues and solutions
```

### Core System Design

```cpp
// include/config.h
#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
#define WIFI_SSID_MAX_LENGTH 32
#define WIFI_PASSWORD_MAX_LENGTH 64
#define WIFI_TIMEOUT_MS 10000
#define WIFI_RETRY_ATTEMPTS 3

// API Configuration
#define API_BASE_URL "https://api.greenhouse.local"
#define API_TIMEOUT_MS 5000
#define API_RETRY_ATTEMPTS 3

// Sensor Configuration
#define SENSOR_READ_INTERVAL_MS 60000  // 1 minute
#define SENSOR_CALIBRATION_SAMPLES 10
#define SENSOR_ERROR_THRESHOLD 3

// Power Management
#define DEEP_SLEEP_DURATION_US 300000000  // 5 minutes
#define BATTERY_LOW_THRESHOLD 3.3         // Volts
#define POWER_SAVE_MODE_THRESHOLD 3.5     // Volts

// Hardware Pins
#define SOIL_MOISTURE_PIN A0
#define TEMPERATURE_HUMIDITY_PIN 2
#define WATER_FLOW_PIN 4
#define PUMP_RELAY_PIN 5
#define LED_STATUS_PIN 2
#define BATTERY_VOLTAGE_PIN A3

// OLED Display
#define OLED_SDA_PIN 21
#define OLED_SCL_PIN 22
#define OLED_WIDTH 128
#define OLED_HEIGHT 64

// System Constants
#define DEVICE_ID_LENGTH 32
#define JSON_BUFFER_SIZE 1024
#define SERIAL_BAUD_RATE 115200

#endif // CONFIG_H
```

### Main Application Structure

```cpp
// src/main.cpp
#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <esp_sleep.h>
#include <esp_wifi.h>
#include "config.h"
#include "sensors.h"
#include "wifi_manager.h"
#include "api_client.h"
#include "power_manager.h"

// Global objects
SensorManager sensors;
WiFiManager wifiManager;
APIClient apiClient;
PowerManager powerManager;

// Task handles for FreeRTOS
TaskHandle_t sensorTaskHandle = NULL;
TaskHandle_t communicationTaskHandle = NULL;
TaskHandle_t displayTaskHandle = NULL;

// System state
struct SystemState {
    bool isConnected = false;
    bool sensorsInitialized = false;
    uint32_t lastSensorReading = 0;
    uint32_t lastAPICall = 0;
    float batteryVoltage = 0.0;
    uint8_t errorCount = 0;
} systemState;

void setup() {
    // Initialize serial communication
    Serial.begin(SERIAL_BAUD_RATE);
    Serial.println("ESP32 Greenhouse Controller Starting...");

    // Initialize hardware
    initializeHardware();

    // Initialize sensors
    if (!sensors.initialize()) {
        Serial.println("ERROR: Sensor initialization failed!");
        handleCriticalError();
    }

    // Initialize WiFi
    if (!wifiManager.initialize()) {
        Serial.println("ERROR: WiFi initialization failed!");
        handleCriticalError();
    }

    // Initialize power management
    powerManager.initialize();

    // Create FreeRTOS tasks
    createTasks();

    Serial.println("System initialization complete");
}

void loop() {
    // Main loop is handled by FreeRTOS tasks
    // This runs at lower priority

    // Monitor system health
    monitorSystemHealth();

    // Handle OTA updates if available
    handleOTAUpdates();

    // Small delay to prevent watchdog reset
    delay(100);
}

void initializeHardware() {
    // Configure GPIO pins
    pinMode(LED_STATUS_PIN, OUTPUT);
    pinMode(PUMP_RELAY_PIN, OUTPUT);
    pinMode(BATTERY_VOLTAGE_PIN, INPUT);

    // Initialize status LED
    digitalWrite(LED_STATUS_PIN, HIGH);  // Indicate system starting

    // Set up watchdog timer
    esp_task_wdt_init(30, true);  // 30 second timeout
    esp_task_wdt_add(NULL);
}

void createTasks() {
    // Sensor reading task (high priority)
    xTaskCreatePinnedToCore(
        sensorTask,           // Task function
        "SensorTask",         // Task name
        4096,                 // Stack size
        NULL,                 // Parameters
        3,                    // Priority (high)
        &sensorTaskHandle,    // Task handle
        1                     // Core 1
    );

    // Communication task (medium priority)
    xTaskCreatePinnedToCore(
        communicationTask,
        "CommTask",
        8192,                 // Larger stack for HTTP
        NULL,
        2,                    // Priority (medium)
        &communicationTaskHandle,
        0                     // Core 0
    );

    // Display task (low priority)
    xTaskCreatePinnedToCore(
        displayTask,
        "DisplayTask",
        2048,
        NULL,
        1,                    // Priority (low)
        &displayTaskHandle,
        1                     // Core 1
    );
}
```

### Sensor Management

```cpp
// include/sensors.h
#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>
#include <DHT.h>
#include <ArduinoJson.h>

struct SensorData {
    float temperature = 0.0;
    float humidity = 0.0;
    float soilMoisture = 0.0;
    float lightIntensity = 0.0;
    float waterFlow = 0.0;
    float batteryVoltage = 0.0;
    uint32_t timestamp = 0;
    bool valid = false;
};

class SensorManager {
private:
    DHT* dhtSensor;
    uint32_t lastReadTime = 0;
    SensorData currentData;
    SensorData calibrationData;

    // Calibration values
    float soilMoistureMin = 0.0;
    float soilMoistureMax = 4095.0;
    float temperatureOffset = 0.0;
    float humidityOffset = 0.0;

public:
    SensorManager();
    ~SensorManager();

    bool initialize();
    bool readAllSensors();
    SensorData getCurrentData() const;
    bool isDataValid() const;

    // Calibration methods
    bool calibrateSoilMoisture();
    bool calibrateTemperatureHumidity();
    void saveCalibration();
    void loadCalibration();

    // Sensor-specific methods
    float readSoilMoisture();
    float readTemperature();
    float readHumidity();
    float readLightIntensity();
    float readWaterFlow();
    float readBatteryVoltage();

    // Data validation
    bool validateSensorData(const SensorData& data);
    void resetSensors();

    // JSON serialization
    String toJSON() const;
    bool fromJSON(const String& json);
};

// Implementation
SensorManager::SensorManager() {
    dhtSensor = new DHT(TEMPERATURE_HUMIDITY_PIN, DHT22);
}

bool SensorManager::initialize() {
    Serial.println("Initializing sensors...");

    // Initialize DHT sensor
    dhtSensor->begin();

    // Wait for sensors to stabilize
    delay(2000);

    // Load calibration data
    loadCalibration();

    // Test all sensors
    if (!readAllSensors()) {
        Serial.println("ERROR: Initial sensor reading failed");
        return false;
    }

    Serial.println("Sensors initialized successfully");
    return true;
}

bool SensorManager::readAllSensors() {
    // Check if enough time has passed since last reading
    uint32_t currentTime = millis();
    if (currentTime - lastReadTime < 2000) {  // Minimum 2 seconds between readings
        return currentData.valid;
    }

    SensorData newData;
    newData.timestamp = currentTime;

    // Read temperature and humidity
    newData.temperature = readTemperature();
    newData.humidity = readHumidity();

    // Read soil moisture
    newData.soilMoisture = readSoilMoisture();

    // Read light intensity
    newData.lightIntensity = readLightIntensity();

    // Read water flow
    newData.waterFlow = readWaterFlow();

    // Read battery voltage
    newData.batteryVoltage = readBatteryVoltage();

    // Validate data
    newData.valid = validateSensorData(newData);

    if (newData.valid) {
        currentData = newData;
        lastReadTime = currentTime;

        Serial.printf("Sensor reading: T=%.1f°C, H=%.1f%%, SM=%.1f%%, Light=%.1f\n",
                     newData.temperature, newData.humidity,
                     newData.soilMoisture, newData.lightIntensity);
    } else {
        Serial.println("WARNING: Invalid sensor data detected");
    }

    return newData.valid;
}

float SensorManager::readSoilMoisture() {
    // Read multiple samples for stability
    uint32_t total = 0;
    const int samples = 5;

    for (int i = 0; i < samples; i++) {
        total += analogRead(SOIL_MOISTURE_PIN);
        delay(10);
    }

    float rawValue = total / samples;

    // Convert to percentage (0-100%)
    float percentage = map(rawValue, soilMoistureMin, soilMoistureMax, 0, 100);
    return constrain(percentage, 0, 100);
}

float SensorManager::readTemperature() {
    float temp = dhtSensor->readTemperature();

    if (isnan(temp)) {
        Serial.println("ERROR: Failed to read temperature");
        return -999.0;  // Error value
    }

    return temp + temperatureOffset;
}

bool SensorManager::validateSensorData(const SensorData& data) {
    // Temperature range check (-10°C to 50°C)
    if (data.temperature < -10.0 || data.temperature > 50.0) {
        Serial.printf("ERROR: Temperature out of range: %.1f°C\n", data.temperature);
        return false;
    }

    // Humidity range check (0-100%)
    if (data.humidity < 0.0 || data.humidity > 100.0) {
        Serial.printf("ERROR: Humidity out of range: %.1f%%\n", data.humidity);
        return false;
    }

    // Soil moisture range check (0-100%)
    if (data.soilMoisture < 0.0 || data.soilMoisture > 100.0) {
        Serial.printf("ERROR: Soil moisture out of range: %.1f%%\n", data.soilMoisture);
        return false;
    }

    // Battery voltage check (minimum 2.5V)
    if (data.batteryVoltage < 2.5) {
        Serial.printf("WARNING: Low battery voltage: %.2fV\n", data.batteryVoltage);
    }

    return true;
}

String SensorManager::toJSON() const {
    StaticJsonDocument<JSON_BUFFER_SIZE> doc;

    doc["timestamp"] = currentData.timestamp;
    doc["temperature"] = currentData.temperature;
    doc["humidity"] = currentData.humidity;
    doc["soilMoisture"] = currentData.soilMoisture;
    doc["lightIntensity"] = currentData.lightIntensity;
    doc["waterFlow"] = currentData.waterFlow;
    doc["batteryVoltage"] = currentData.batteryVoltage;
    doc["valid"] = currentData.valid;

    String jsonString;
    serializeJson(doc, jsonString);
    return jsonString;
}
#endif // SENSORS_H
```

### WiFi Management

```cpp
// include/wifi_manager.h
#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <WiFi.h>
#include <WiFiManager.h>
#include <esp_wifi.h>

class WiFiManager {
private:
    String ssid;
    String password;
    bool isConnected = false;
    uint32_t lastConnectionAttempt = 0;
    uint8_t reconnectAttempts = 0;

public:
    WiFiManager();
    bool initialize();
    bool connect();
    bool isWiFiConnected();
    void disconnect();
    void handleReconnection();

    // Configuration
    bool configureWiFi(const String& ssid, const String& password);
    void startConfigPortal();

    // Power management
    void enablePowerSave();
    void disablePowerSave();

    // Status
    String getConnectionInfo();
    int getRSSI();
    String getLocalIP();
};

bool WiFiManager::initialize() {
    Serial.println("Initializing WiFi...");

    // Set WiFi mode
    WiFi.mode(WIFI_STA);

    // Load credentials from preferences
    loadCredentials();

    // Attempt connection
    if (!connect()) {
        Serial.println("Failed to connect to WiFi, starting config portal");
        startConfigPortal();
    }

    return isWiFiConnected();
}

bool WiFiManager::connect() {
    if (ssid.length() == 0) {
        Serial.println("No WiFi credentials available");
        return false;
    }

    Serial.printf("Connecting to WiFi: %s\n", ssid.c_str());

    WiFi.begin(ssid.c_str(), password.c_str());

    uint32_t startTime = millis();
    while (WiFi.status() != WL_CONNECTED &&
           (millis() - startTime) < WIFI_TIMEOUT_MS) {
        delay(500);
        Serial.print(".");
    }

    if (WiFi.status() == WL_CONNECTED) {
        isConnected = true;
        reconnectAttempts = 0;

        Serial.printf("\nWiFi connected! IP: %s\n", WiFi.localIP().toString().c_str());
        Serial.printf("RSSI: %d dBm\n", WiFi.RSSI());

        return true;
    } else {
        isConnected = false;
        reconnectAttempts++;

        Serial.printf("\nWiFi connection failed! Status: %d\n", WiFi.status());
        return false;
    }
}

void WiFiManager::handleReconnection() {
    if (!isWiFiConnected() &&
        (millis() - lastConnectionAttempt) > 30000) {  // Try every 30 seconds

        lastConnectionAttempt = millis();

        if (reconnectAttempts < WIFI_RETRY_ATTEMPTS) {
            Serial.println("Attempting WiFi reconnection...");
            connect();
        } else {
            Serial.println("Max reconnection attempts reached, entering deep sleep");
            esp_deep_sleep_start();
        }
    }
}
#endif // WIFI_MANAGER_H
```

### API Communication

```cpp
// include/api_client.h
#ifndef API_CLIENT_H
#define API_CLIENT_H

#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>

class APIClient {
private:
    HTTPClient http;
    WiFiClientSecure* client;
    String baseURL;
    String deviceID;
    String authToken;

public:
    APIClient();
    ~APIClient();

    bool initialize();
    bool authenticate();

    // Data transmission
    bool sendSensorData(const String& jsonData);
    bool getConfiguration();
    bool sendHeartbeat();

    // OTA updates
    bool checkForUpdates();
    bool downloadUpdate(const String& updateURL);

    // Error handling
    void handleHTTPError(int httpCode);
    bool retryRequest(std::function<bool()> request, int maxRetries = 3);
};

bool APIClient::sendSensorData(const String& jsonData) {
    if (!WiFi.isConnected()) {
        Serial.println("ERROR: Not connected to WiFi");
        return false;
    }

    http.begin(*client, baseURL + "/api/sensors/data");
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", "Bearer " + authToken);
    http.addHeader("Device-ID", deviceID);
    http.setTimeout(API_TIMEOUT_MS);

    Serial.println("Sending sensor data to API...");

    int httpCode = http.POST(jsonData);

    if (httpCode == HTTP_CODE_OK) {
        String response = http.getString();
        Serial.printf("API response: %s\n", response.c_str());

        // Parse response for any commands
        parseAPIResponse(response);

        http.end();
        return true;
    } else {
        Serial.printf("HTTP Error: %d\n", httpCode);
        handleHTTPError(httpCode);
        http.end();
        return false;
    }
}

bool APIClient::retryRequest(std::function<bool()> request, int maxRetries) {
    for (int attempt = 0; attempt < maxRetries; attempt++) {
        if (request()) {
            return true;
        }

        if (attempt < maxRetries - 1) {
            Serial.printf("Request failed, retrying in %d seconds... (attempt %d/%d)\n",
                         (attempt + 1) * 5, attempt + 1, maxRetries);
            delay((attempt + 1) * 5000);  // Exponential backoff
        }
    }

    return false;
}
#endif // API_CLIENT_H
```

### FreeRTOS Tasks

```cpp
// Task implementations
void sensorTask(void* parameter) {
    TickType_t xLastWakeTime = xTaskGetTickCount();
    const TickType_t xFrequency = pdMS_TO_TICKS(SENSOR_READ_INTERVAL_MS);

    while (true) {
        // Read sensors
        if (sensors.readAllSensors()) {
            systemState.lastSensorReading = millis();
            systemState.errorCount = 0;

            // Update status LED
            digitalWrite(LED_STATUS_PIN, HIGH);
            delay(100);
            digitalWrite(LED_STATUS_PIN, LOW);
        } else {
            systemState.errorCount++;

            if (systemState.errorCount > SENSOR_ERROR_THRESHOLD) {
                Serial.println("CRITICAL: Multiple sensor failures detected");
                // Could trigger safe mode or restart
            }
        }

        // Reset watchdog
        esp_task_wdt_reset();

        // Wait for next cycle
        vTaskDelayUntil(&xLastWakeTime, xFrequency);
    }
}

void communicationTask(void* parameter) {
    TickType_t xLastWakeTime = xTaskGetTickCount();
    const TickType_t xFrequency = pdMS_TO_TICKS(60000);  // Every minute

    while (true) {
        // Check WiFi connection
        if (!wifiManager.isWiFiConnected()) {
            wifiManager.handleReconnection();
        } else {
            // Send sensor data
            if (sensors.isDataValid()) {
                String jsonData = sensors.toJSON();

                auto sendDataRequest = [&]() {
                    return apiClient.sendSensorData(jsonData);
                };

                if (apiClient.retryRequest(sendDataRequest)) {
                    systemState.lastAPICall = millis();
                    Serial.println("Sensor data sent successfully");
                } else {
                    Serial.println("Failed to send sensor data after retries");
                }
            }

            // Send heartbeat
            if ((millis() - systemState.lastAPICall) > 300000) {  // 5 minutes
                apiClient.sendHeartbeat();
            }
        }

        // Reset watchdog
        esp_task_wdt_reset();

        // Wait for next cycle
        vTaskDelayUntil(&xLastWakeTime, xFrequency);
    }
}

void displayTask(void* parameter) {
    TickType_t xLastWakeTime = xTaskGetTickCount();
    const TickType_t xFrequency = pdMS_TO_TICKS(5000);  // Every 5 seconds

    while (true) {
        // Update OLED display with current status
        updateDisplay();

        // Reset watchdog
        esp_task_wdt_reset();

        // Wait for next cycle
        vTaskDelayUntil(&xLastWakeTime, xFrequency);
    }
}
```

## Best Practices

### Code Quality

1. **Memory Management**: Use RAII principles, avoid memory leaks
2. **Error Handling**: Implement comprehensive error checking
3. **Documentation**: Comment complex logic and hardware interactions
4. **Naming**: Use descriptive variable and function names
5. **Constants**: Use `#define` or `const` for magic numbers

### Hardware Considerations

1. **Pin Management**: Document pin assignments clearly
2. **Power Consumption**: Optimize for battery operation
3. **Signal Integrity**: Use proper pull-up/pull-down resistors
4. **EMI/EMC**: Follow PCB layout best practices
5. **Environmental**: Consider temperature and humidity effects

### Communication

1. **Protocol Selection**: Choose appropriate communication protocols
2. **Error Recovery**: Implement robust error recovery mechanisms
3. **Security**: Use TLS/SSL for API communication
4. **Timeouts**: Set appropriate timeouts for all operations
5. **Retry Logic**: Implement exponential backoff for retries

### Power Management

1. **Deep Sleep**: Use deep sleep modes when possible
2. **Clock Management**: Reduce clock speeds when appropriate
3. **Peripheral Control**: Disable unused peripherals
4. **Battery Monitoring**: Monitor battery levels continuously
5. **Low Power Modes**: Implement multiple power saving strategies

### Development Workflow

1. **Version Control**: Use semantic versioning for firmware
2. **Testing**: Test on actual hardware regularly
3. **Debugging**: Use serial output for debugging
4. **OTA Updates**: Implement secure over-the-air updates
5. **Configuration**: Use external configuration files

## PlatformIO Configuration

### platformio.ini

```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino

# Build options
build_flags =
    -DCORE_DEBUG_LEVEL=3
    -DSERIAL_BAUD_RATE=115200
    -DWIFI_TIMEOUT_MS=10000
    -DAPI_TIMEOUT_MS=5000

# Library dependencies
lib_deps =
    adafruit/DHT sensor library@^1.4.4
    adafruit/Adafruit Unified Sensor@^1.1.9
    bblanchon/ArduinoJson@^6.21.3
    tzapu/WiFiManager@^2.0.16-rc.2
    adafruit/Adafruit SSD1306@^2.5.7
    adafruit/Adafruit GFX Library@^1.11.5

# Upload options
upload_speed = 921600
monitor_speed = 115200

# OTA configuration
upload_protocol = espota
upload_port = greenhouse-esp32.local

# Partition scheme for OTA
board_build.partitions = min_spiffs.csv

# Build type
build_type = release

[env:esp32dev-debug]
extends = env:esp32dev
build_type = debug
build_flags =
    ${env:esp32dev.build_flags}
    -DDEBUG=1
    -DCORE_DEBUG_LEVEL=5

[env:esp32dev-test]
extends = env:esp32dev
test_framework = unity
test_port = /dev/ttyUSB0
test_speed = 115200
```

## Testing Strategy

### Unit Testing

```cpp
// test/test_sensors.cpp
#include <unity.h>
#include <Arduino.h>
#include "sensors.h"

SensorManager testSensorManager;

void setUp(void) {
    // Initialize test environment
    testSensorManager.initialize();
}

void tearDown(void) {
    // Clean up after test
}

void test_sensor_initialization() {
    TEST_ASSERT_TRUE(testSensorManager.initialize());
}

void test_sensor_data_validation() {
    SensorData validData;
    validData.temperature = 25.0;
    validData.humidity = 60.0;
    validData.soilMoisture = 45.0;
    validData.batteryVoltage = 3.7;

    TEST_ASSERT_TRUE(testSensorManager.validateSensorData(validData));

    // Test invalid temperature
    SensorData invalidData = validData;
    invalidData.temperature = 100.0;  // Too high
    TEST_ASSERT_FALSE(testSensorManager.validateSensorData(invalidData));
}

void test_json_serialization() {
    testSensorManager.readAllSensors();
    String json = testSensorManager.toJSON();

    TEST_ASSERT_TRUE(json.length() > 0);
    TEST_ASSERT_TRUE(json.indexOf("temperature") > 0);
    TEST_ASSERT_TRUE(json.indexOf("humidity") > 0);
}

void setup() {
    delay(2000);  // Wait for serial

    UNITY_BEGIN();

    RUN_TEST(test_sensor_initialization);
    RUN_TEST(test_sensor_data_validation);
    RUN_TEST(test_json_serialization);

    UNITY_END();
}

void loop() {
    // Empty loop for testing
}
```

## Hardware Setup

### Sensor Connections

```cpp
// Pin assignments and wiring guide
/*
ESP32 Pin Layout:
GPIO 2  - DHT22 Temperature/Humidity Sensor
GPIO 4  - Water Flow Sensor (Interrupt)
GPIO 5  - Water Pump Relay Control
GPIO 21 - OLED SDA (I2C)
GPIO 22 - OLED SCL (I2C)
A0      - Soil Moisture Sensor (Analog)
A3      - Battery Voltage Divider (Analog)

Power Requirements:
- ESP32: 3.3V, ~240mA active, ~10µA deep sleep
- DHT22: 3.3-5V, ~2.5mA active
- OLED: 3.3V, ~20mA active
- Soil Sensor: 3.3V, ~35mA active
- Water Pump: 12V, 1-2A (controlled via relay)

Total estimated power consumption:
- Active mode: ~300mA @ 3.3V + pump load
- Sleep mode: ~15µA @ 3.3V
*/
```

### Power Management

```cpp
// include/power_manager.h
#ifndef POWER_MANAGER_H
#define POWER_MANAGER_H

#include <esp_sleep.h>
#include <esp_wifi.h>
#include <esp_bt.h>

class PowerManager {
private:
    float batteryVoltage = 0.0;
    bool lowPowerMode = false;
    uint32_t sleepDuration = DEEP_SLEEP_DURATION_US;

public:
    PowerManager();

    void initialize();
    void checkBatteryLevel();
    void enterDeepSleep();
    void enterLightSleep(uint32_t duration_ms);

    // Power saving modes
    void enablePowerSaveMode();
    void disablePowerSaveMode();
    void enableUltraLowPower();

    // Battery monitoring
    float getBatteryVoltage();
    uint8_t getBatteryPercentage();
    bool isBatteryLow();
    bool isBatteryCritical();

    // Sleep management
    void configureSleepWakeup();
    void handleWakeupReason();
};

void PowerManager::enterDeepSleep() {
    Serial.println("Entering deep sleep mode...");

    // Save current state
    saveSystemState();

    // Configure wakeup sources
    esp_sleep_enable_timer_wakeup(sleepDuration);

    // Optionally wake on external interrupt (emergency button)
    esp_sleep_enable_ext0_wakeup(GPIO_NUM_0, 0);  // Wake on button press

    // Disable WiFi and Bluetooth
    esp_wifi_stop();
    esp_bt_controller_disable();

    // Enter deep sleep
    esp_deep_sleep_start();
}

void PowerManager::enableUltraLowPower() {
    Serial.println("Enabling ultra-low power mode");

    // Reduce CPU frequency
    setCpuFrequencyMhz(80);  // Reduce from 240MHz to 80MHz

    // Disable unnecessary peripherals
    esp_wifi_set_ps(WIFI_PS_MAX_MODEM);  // Maximum power save

    // Increase sleep intervals
    sleepDuration = DEEP_SLEEP_DURATION_US * 2;  // Double sleep time

    lowPowerMode = true;
}
#endif // POWER_MANAGER_H
```

## Debugging & Monitoring

### Serial Debugging

```cpp
// Debugging utilities
#ifdef DEBUG
    #define DEBUG_PRINT(x) Serial.print(x)
    #define DEBUG_PRINTLN(x) Serial.println(x)
    #define DEBUG_PRINTF(format, ...) Serial.printf(format, __VA_ARGS__)
#else
    #define DEBUG_PRINT(x)
    #define DEBUG_PRINTLN(x)
    #define DEBUG_PRINTF(format, ...)
#endif

// System monitoring
void monitorSystemHealth() {
    static uint32_t lastHealthCheck = 0;

    if ((millis() - lastHealthCheck) > 60000) {  // Check every minute
        lastHealthCheck = millis();

        // Check memory usage
        uint32_t freeHeap = ESP.getFreeHeap();
        DEBUG_PRINTF("Free heap: %u bytes\n", freeHeap);

        if (freeHeap < 10000) {  // Less than 10KB free
            Serial.println("WARNING: Low memory detected");
        }

        // Check WiFi signal strength
        if (WiFi.isConnected()) {
            int rssi = WiFi.RSSI();
            DEBUG_PRINTF("WiFi RSSI: %d dBm\n", rssi);

            if (rssi < -80) {
                Serial.println("WARNING: Weak WiFi signal");
            }
        }

        // Check task stack usage
        UBaseType_t sensorStackHighWater = uxTaskGetStackHighWaterMark(sensorTaskHandle);
        UBaseType_t commStackHighWater = uxTaskGetStackHighWaterMark(communicationTaskHandle);

        DEBUG_PRINTF("Task stack usage - Sensor: %u, Comm: %u\n",
                    sensorStackHighWater, commStackHighWater);

        // Reset watchdog
        esp_task_wdt_reset();
    }
}
```

## Security Considerations

### Secure Communication

```cpp
// Secure API communication
bool APIClient::initializeSecure() {
    // Configure SSL/TLS
    client = new WiFiClientSecure();

    // Load CA certificate
    const char* rootCA = R"EOF(
-----BEGIN CERTIFICATE-----
// Your root CA certificate here
-----END CERTIFICATE-----
)EOF";

    client->setCACert(rootCA);

    // Set hostname for certificate verification
    client->setInsecure(false);  // Enable certificate verification

    return true;
}

// Device authentication
bool APIClient::authenticate() {
    // Generate device fingerprint
    String deviceFingerprint = generateDeviceFingerprint();

    StaticJsonDocument<512> authDoc;
    authDoc["deviceId"] = deviceID;
    authDoc["fingerprint"] = deviceFingerprint;
    authDoc["firmware_version"] = FIRMWARE_VERSION;

    String authPayload;
    serializeJson(authDoc, authPayload);

    http.begin(*client, baseURL + "/api/auth/device");
    http.addHeader("Content-Type", "application/json");

    int httpCode = http.POST(authPayload);

    if (httpCode == HTTP_CODE_OK) {
        String response = http.getString();

        StaticJsonDocument<512> responseDoc;
        deserializeJson(responseDoc, response);

        authToken = responseDoc["token"].as<String>();

        http.end();
        return !authToken.isEmpty();
    }

    http.end();
    return false;
}

String APIClient::generateDeviceFingerprint() {
    // Create unique device fingerprint based on MAC address and chip ID
    String mac = WiFi.macAddress();
    uint64_t chipid = ESP.getEfuseMac();

    return String(mac + "-" + String(chipid, HEX));
}
```

## Deployment & OTA Updates

### OTA Implementation

```cpp
// OTA update system
#include <ArduinoOTA.h>
#include <Update.h>

bool setupOTA() {
    ArduinoOTA.setHostname("greenhouse-esp32");
    ArduinoOTA.setPassword("your-ota-password");

    ArduinoOTA.onStart([]() {
        String type = (ArduinoOTA.getCommand() == U_FLASH) ? "sketch" : "filesystem";
        Serial.println("Start updating " + type);

        // Stop all tasks during update
        vTaskSuspend(sensorTaskHandle);
        vTaskSuspend(communicationTaskHandle);
        vTaskSuspend(displayTaskHandle);
    });

    ArduinoOTA.onEnd([]() {
        Serial.println("\nEnd");
    });

    ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
        Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
    });

    ArduinoOTA.onError([](ota_error_t error) {
        Serial.printf("Error[%u]: ", error);
        if (error == OTA_AUTH_ERROR) Serial.println("Auth Failed");
        else if (error == OTA_BEGIN_ERROR) Serial.println("Begin Failed");
        else if (error == OTA_CONNECT_ERROR) Serial.println("Connect Failed");
        else if (error == OTA_RECEIVE_ERROR) Serial.println("Receive Failed");
        else if (error == OTA_END_ERROR) Serial.println("End Failed");

        // Resume tasks on error
        vTaskResume(sensorTaskHandle);
        vTaskResume(communicationTaskHandle);
        vTaskResume(displayTaskHandle);
    });

    ArduinoOTA.begin();
    return true;
}

void handleOTAUpdates() {
    static uint32_t lastOTACheck = 0;

    if ((millis() - lastOTACheck) > 1000) {  // Check every second
        lastOTACheck = millis();
        ArduinoOTA.handle();
    }
}
```

This comprehensive ESP32 development guide provides the foundation for building robust, scalable, and maintainable IoT firmware for the greenhouse system.
