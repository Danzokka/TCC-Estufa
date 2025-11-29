#include "PUMP.h"

PumpController::PumpController() : httpServer(HTTP_SERVER_PORT)
{
    pumpStatus = PUMP_OFF;
    currentMode = MODE_MANUAL;
    pumpStartTime = 0;
    pumpDuration = 0;
    targetVolume = 0;
    currentVolume = 0;
    emergencyStop = false;
    pumpEnabled = true;

    pumpControlTaskHandle = NULL;
    httpServerTaskHandle = NULL;
    pumpMutex = NULL;
}

PumpController::~PumpController()
{
    stop();
}

bool PumpController::begin()
{
    Serial.println("Initializing Pump Controller...");

    // Initialize GPIO for relay control
    pinMode(PUMP_RELAY_PIN, OUTPUT);
    digitalWrite(PUMP_RELAY_PIN, LOW); // Ensure pump is off initially

    // Create mutex for thread safety
    pumpMutex = xSemaphoreCreateMutex();
    if (pumpMutex == NULL)
    {
        Serial.println("ERROR: Failed to create pump mutex");
        return false;
    }

    // Setup HTTP server routes
    httpServer.on("/pump/activate", HTTP_POST, [this]()
                  { handleActivatePump(); });
    httpServer.on("/pump/deactivate", HTTP_POST, [this]()
                  { handleDeactivatePump(); });
    httpServer.on("/pump/status", HTTP_GET, [this]()
                  { handlePumpStatus(); });
    httpServer.on("/pump/emergency-stop", HTTP_POST, [this]()
                  { handleEmergencyStop(); });
    httpServer.on("/pump/reset", HTTP_POST, [this]()
                  { handleReset(); });
    httpServer.onNotFound([this]()
                          { handleNotFound(); });

    // Create pump control task (high priority for safety)
    xTaskCreatePinnedToCore(
        pumpControlTask,
        "PumpControlTask",
        4096,
        this,
        3, // High priority for safety
        &pumpControlTaskHandle,
        1 // Core 1
    );

    // Create HTTP server task
    xTaskCreatePinnedToCore(
        httpServerTask,
        "HttpServerTask",
        8192,
        this,
        2, // Medium priority
        &httpServerTaskHandle,
        0 // Core 0
    );

    Serial.println("Pump Controller initialized successfully");
    Serial.print("HTTP Server running on: http://");
    Serial.print(WiFi.localIP());
    Serial.print(":");
    Serial.println(HTTP_SERVER_PORT);

    return true;
}

void PumpController::stop()
{
    // Emergency stop pump
    emergencyStopPump();

    // Stop HTTP server
    httpServer.stop();

    // Delete tasks
    if (pumpControlTaskHandle != NULL)
    {
        vTaskDelete(pumpControlTaskHandle);
        pumpControlTaskHandle = NULL;
    }

    if (httpServerTaskHandle != NULL)
    {
        vTaskDelete(httpServerTaskHandle);
        httpServerTaskHandle = NULL;
    }

    // Delete mutex
    if (pumpMutex != NULL)
    {
        vSemaphoreDelete(pumpMutex);
        pumpMutex = NULL;
    }
}

// Task function for pump control (safety monitoring and automatic shutoff)
void PumpController::pumpControlTask(void *parameter)
{
    PumpController *controller = static_cast<PumpController *>(parameter);

    for (;;)
    {
        if (xSemaphoreTake(controller->pumpMutex, portMAX_DELAY) == pdTRUE)
        {
            // Only check safety and timeouts if pump is ON
            if (controller->pumpStatus == PUMP_ON)
            {
                // Check safety conditions
                if (!controller->checkSafetyConditions())
                {
                    Serial.println("SAFETY: Unsafe conditions - stopping pump");
                    controller->deactivateRelay();
                }

                unsigned long currentTime = millis();

                // Handle pump operations based on current mode
                switch (controller->currentMode)
                {
                case MODE_DURATION:
                    // Check if duration has elapsed
                    if (currentTime - controller->pumpStartTime >= controller->pumpDuration)
                    {
                        Serial.println("Pump duration completed - auto stopping");
                        controller->deactivateRelay();
                    }
                    break;

                case MODE_VOLUME:
                    // Check if target volume has been reached
                    if (controller->currentVolume >= controller->targetVolume)
                    {
                        Serial.println("Target volume reached - auto stopping");
                        controller->deactivateRelay();
                    }
                    break;

                case MODE_MANUAL:
                    // Manual mode - no automatic shutoff except safety
                    break;
                }

                // Check maximum runtime safety limit (only when pump is ON)
                if (currentTime - controller->pumpStartTime >= PUMP_MAX_DURATION)
                {
                    Serial.println("SAFETY: Maximum pump runtime exceeded - stopping");
                    controller->deactivateRelay();
                }
            }

            xSemaphoreGive(controller->pumpMutex);
        }

        // Check every 100ms for responsive safety monitoring
        vTaskDelay(100 / portTICK_PERIOD_MS);
    }
}

// Task function for HTTP server
void PumpController::httpServerTask(void *parameter)
{
    PumpController *controller = static_cast<PumpController *>(parameter);

    // Start HTTP server
    controller->httpServer.begin();
    Serial.println("HTTP Server started for pump control");

    for (;;)
    {
        controller->httpServer.handleClient();
        vTaskDelay(10 / portTICK_PERIOD_MS); // Small delay to prevent watchdog reset
    }
}

// HTTP handler for pump activation
void PumpController::handleActivatePump()
{
    unsigned long startTime = millis();
    String clientIP = httpServer.client().remoteIP().toString();

    Serial.println("[HTTP] POST /pump/activate from " + clientIP);

    if (!pumpEnabled)
    {
        Serial.println("[HTTP] Response: 400 - Pump disabled (" + String(millis() - startTime) + "ms)");
        httpServer.send(400, "application/json", createErrorResponse("Pump is disabled"));
        return;
    }

    // Parse request body
    String body = httpServer.arg("plain");
    JsonDocument doc;
    deserializeJson(doc, body);

    bool success = false;
    String errorMsg = "";

    if (xSemaphoreTake(pumpMutex, 1000 / portTICK_PERIOD_MS) == pdTRUE)
    {
        if (doc["water_ml"].is<float>())
        {
            // Calculate duration from desired water volume (mL)
            float waterMl = doc["water_ml"].as<float>();
            float durationSeconds = waterMl / PUMP_ML_PER_SECOND;
            unsigned long duration = (unsigned long)(durationSeconds * 1000); // Convert to ms

            Serial.println("[PUMP] Requested " + String(waterMl) + " mL -> calculated " + String(durationSeconds, 2) + "s");

            if (validateDuration(duration))
            {
                success = activatePump(duration);
                if (!success)
                    errorMsg = "Failed to activate pump for water volume";
            }
            else
            {
                errorMsg = "Calculated duration exceeds limits";
            }
        }
        else if (doc["duration"].is<unsigned long>())
        {
            unsigned long duration = doc["duration"].as<unsigned long>() * 1000; // Convert seconds to ms
            if (validateDuration(duration))
            {
                success = activatePump(duration);
                if (!success)
                    errorMsg = "Failed to activate pump for duration";
            }
            else
            {
                errorMsg = "Invalid duration specified";
            }
        }
        else if (doc["volume"].is<float>())
        {
            float volume = doc["volume"].as<float>();
            if (validateVolume(volume))
            {
                success = activatePumpForVolume(volume);
                if (!success)
                    errorMsg = "Failed to activate pump for volume";
            }
            else
            {
                errorMsg = "Invalid volume specified";
            }
        }
        else
        {
            success = activatePump(); // Manual mode
            if (!success)
                errorMsg = "Failed to activate pump manually";
        }

        xSemaphoreGive(pumpMutex);
    }
    else
    {
        errorMsg = "System busy - try again";
    }

    if (success)
    {
        Serial.println("[HTTP] Response: 200 - Pump activated (" + String(millis() - startTime) + "ms)");
        httpServer.send(200, "application/json", createStatusResponse());
    }
    else
    {
        Serial.println("[HTTP] Response: 400 - " + errorMsg + " (" + String(millis() - startTime) + "ms)");
        httpServer.send(400, "application/json", createErrorResponse(errorMsg));
    }
}

// HTTP handler for pump deactivation
void PumpController::handleDeactivatePump()
{
    unsigned long startTime = millis();
    String clientIP = httpServer.client().remoteIP().toString();

    Serial.println("[HTTP] POST /pump/deactivate from " + clientIP);

    bool success = false;

    if (xSemaphoreTake(pumpMutex, 1000 / portTICK_PERIOD_MS) == pdTRUE)
    {
        success = deactivatePump();
        xSemaphoreGive(pumpMutex);
    }

    if (success)
    {
        Serial.println("[HTTP] Response: 200 - Pump deactivated (" + String(millis() - startTime) + "ms)");
        httpServer.send(200, "application/json", createStatusResponse());
    }
    else
    {
        Serial.println("[HTTP] Response: 400 - Failed to deactivate (" + String(millis() - startTime) + "ms)");
        httpServer.send(400, "application/json", createErrorResponse("Failed to deactivate pump"));
    }
}

// HTTP handler for pump status
void PumpController::handlePumpStatus()
{
    unsigned long startTime = millis();
    String clientIP = httpServer.client().remoteIP().toString();

    Serial.println("[HTTP] GET /pump/status from " + clientIP);
    httpServer.send(200, "application/json", createStatusResponse());
    Serial.println("[HTTP] Response: 200 (" + String(millis() - startTime) + "ms)");
}

// HTTP handler for emergency stop
void PumpController::handleEmergencyStop()
{
    unsigned long startTime = millis();
    String clientIP = httpServer.client().remoteIP().toString();

    Serial.println("[HTTP] POST /pump/emergency-stop from " + clientIP);

    bool success = emergencyStopPump();

    if (success)
    {
        Serial.println("[HTTP] Response: 200 - Emergency stop executed (" + String(millis() - startTime) + "ms)");
        httpServer.send(200, "application/json", createStatusResponse());
    }
    else
    {
        Serial.println("[HTTP] Response: 500 - Emergency stop failed (" + String(millis() - startTime) + "ms)");
        httpServer.send(500, "application/json", createErrorResponse("Emergency stop failed"));
    }
}

// HTTP handler for not found
void PumpController::handleNotFound()
{
    String clientIP = httpServer.client().remoteIP().toString();
    Serial.println("[HTTP] 404 - Unknown endpoint from " + clientIP + ": " + httpServer.uri());
    httpServer.send(404, "application/json", createErrorResponse("Endpoint not found"));
}

// HTTP handler for reset error state
void PumpController::handleReset()
{
    unsigned long startTime = millis();
    String clientIP = httpServer.client().remoteIP().toString();

    Serial.println("[HTTP] POST /pump/reset from " + clientIP);

    if (xSemaphoreTake(pumpMutex, 1000 / portTICK_PERIOD_MS) == pdTRUE)
    {
        if (pumpStatus == PUMP_ERROR)
        {
            pumpStatus = PUMP_OFF;
            currentMode = MODE_MANUAL;
            emergencyStop = false;
            Serial.println("[PUMP] Estado de erro resetado");
        }
        xSemaphoreGive(pumpMutex);
    }
    Serial.println("[HTTP] Response: 200 (" + String(millis() - startTime) + "ms)");
    httpServer.send(200, "application/json", createStatusResponse());
}

// Activate pump
bool PumpController::activatePump(unsigned long duration)
{
    if (!checkSafetyConditions())
    {
        Serial.println("Cannot activate pump - safety conditions not met");
        return false;
    }

    if (pumpStatus == PUMP_ON)
    {
        Serial.println("Pump already running");
        return true;
    }

    activateRelay();
    pumpStartTime = millis();

    if (duration > 0)
    {
        currentMode = MODE_DURATION;
        pumpDuration = duration;
        Serial.print("Pump activated for duration: ");
        Serial.print(duration / 1000);
        Serial.println(" seconds");
    }
    else
    {
        currentMode = MODE_MANUAL;
        Serial.println("Pump activated in manual mode");
    }

    return true;
}

// Activate pump for specific volume
bool PumpController::activatePumpForVolume(float volume)
{
    if (!checkSafetyConditions())
    {
        Serial.println("Cannot activate pump - safety conditions not met");
        return false;
    }

    if (pumpStatus == PUMP_ON)
    {
        Serial.println("Pump already running");
        return true;
    }

    activateRelay();
    pumpStartTime = millis();
    currentMode = MODE_VOLUME;
    targetVolume = volume;
    currentVolume = 0; // Reset volume counter

    Serial.print("Pump activated for volume: ");
    Serial.print(volume);
    Serial.println(" liters");

    return true;
}

// Deactivate pump
bool PumpController::deactivatePump()
{
    if (pumpStatus == PUMP_OFF)
    {
        Serial.println("Pump already off");
        return true;
    }

    deactivateRelay();
    Serial.println("Pump deactivated");

    return true;
}

// Emergency stop
bool PumpController::emergencyStopPump()
{
    deactivateRelay();
    Serial.println("Emergency stop activated - pump OFF");
    return true;
}

// Activate relay
void PumpController::activateRelay()
{
    digitalWrite(PUMP_RELAY_PIN, HIGH);
    pumpStatus = PUMP_ON;
    Serial.println("Relay activated - pump ON");
}

// Deactivate relay
void PumpController::deactivateRelay()
{
    digitalWrite(PUMP_RELAY_PIN, LOW);
    pumpStatus = PUMP_OFF;
    currentMode = MODE_MANUAL;
    pumpDuration = 0;
    targetVolume = 0;
    currentVolume = 0;
    Serial.println("Relay deactivated - pump OFF");
}

// Validate duration
bool PumpController::validateDuration(unsigned long duration)
{
    return duration > 0 && duration <= PUMP_MAX_DURATION;
}

// Validate volume
bool PumpController::validateVolume(float volume)
{
    return volume > 0 && volume <= 100.0; // Maximum 100 liters for safety
}

// Check safety conditions
bool PumpController::checkSafetyConditions()
{
    if (!pumpEnabled)
    {
        return false;
    }

    // Check WiFi connection (required for monitoring)
    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("SAFETY: WiFi disconnected - cannot monitor pump safely");
        return false;
    }

    // Add more safety checks as needed (water level, pressure, etc.)

    return true;
}

// Update volume from flow sensor
void PumpController::updateVolume(float volume)
{
    if (xSemaphoreTake(pumpMutex, 10 / portTICK_PERIOD_MS) == pdTRUE)
    {
        currentVolume = volume;
        xSemaphoreGive(pumpMutex);
    }
}

// Get current status
PumpStatus PumpController::getCurrentStatus() const
{
    return pumpStatus;
}

// Get current mode
PumpMode PumpController::getCurrentMode() const
{
    return currentMode;
}

// Get remaining time
unsigned long PumpController::getRemainingTime() const
{
    if (pumpStatus != PUMP_ON || currentMode != MODE_DURATION)
    {
        return 0;
    }

    unsigned long elapsed = millis() - pumpStartTime;
    if (elapsed >= pumpDuration)
    {
        return 0;
    }

    return (pumpDuration - elapsed) / 1000; // Return in seconds
}

// Get current volume
float PumpController::getCurrentVolume() const
{
    return currentVolume;
}

// Get target volume
float PumpController::getTargetVolume() const
{
    return targetVolume;
}

// Check if pump is enabled
bool PumpController::isEnabled() const
{
    return pumpEnabled;
}

// Enable pump
void PumpController::enablePump()
{
    pumpEnabled = true;
    if (pumpStatus == PUMP_ERROR)
    {
        pumpStatus = PUMP_OFF; // Reset error state
    }
    Serial.println("Pump enabled");
}

// Disable pump
void PumpController::disablePump()
{
    pumpEnabled = false;
    if (pumpStatus == PUMP_ON)
    {
        emergencyStopPump();
    }
    Serial.println("Pump disabled");
}

// Get pump status text for display
String PumpController::getPumpStatusText() const
{
    switch (pumpStatus)
    {
    case PUMP_OFF:
        return "PUMP: OFF";
    case PUMP_ON:
        switch (currentMode)
        {
        case MODE_MANUAL:
            return "PUMP: ON (Manual)";
        case MODE_DURATION:
            return "PUMP: ON (" + String(getRemainingTime()) + "s)";
        case MODE_VOLUME:
            return "PUMP: ON (" + String(currentVolume, 1) + "/" + String(targetVolume, 1) + "L)";
        }
        break;
    case PUMP_ERROR:
        return "PUMP: ERROR";
    }
    return "PUMP: UNKNOWN";
}

// Get pump details text for display
String PumpController::getPumpDetailsText() const
{
    if (pumpStatus == PUMP_OFF)
    {
        return "Ready";
    }
    else if (pumpStatus == PUMP_ERROR)
    {
        return "Reset Required";
    }
    else
    {
        unsigned long runTime = (millis() - pumpStartTime) / 1000;
        return "Runtime: " + String(runTime) + "s";
    }
}

// Create status JSON response
String PumpController::createStatusResponse()
{
    JsonDocument doc;

    doc["status"] = (pumpStatus == PUMP_OFF) ? "off" : (pumpStatus == PUMP_ON) ? "on"
                                                                               : "error";
    doc["enabled"] = pumpEnabled;
    doc["mode"] = (currentMode == MODE_MANUAL) ? "manual" : (currentMode == MODE_DURATION) ? "duration"
                                                                                           : "volume";
    doc["water_rate_ml_per_second"] = PUMP_ML_PER_SECOND;

    if (pumpStatus == PUMP_ON)
    {
        unsigned long runtimeMs = millis() - pumpStartTime;
        float runtimeSeconds = runtimeMs / 1000.0;
        float approxWaterMl = runtimeSeconds * PUMP_ML_PER_SECOND;

        doc["runtime_seconds"] = runtimeSeconds;
        doc["approx_water_dispensed_ml"] = approxWaterMl;

        if (currentMode == MODE_DURATION)
        {
            unsigned long remainingMs = getRemainingTime() * 1000;
            float totalDurationSeconds = pumpDuration / 1000.0;
            float approxTotalWaterMl = totalDurationSeconds * PUMP_ML_PER_SECOND;

            doc["remaining_seconds"] = getRemainingTime();
            doc["duration_seconds"] = totalDurationSeconds;
            doc["approx_total_water_ml"] = approxTotalWaterMl;
        }
        else if (currentMode == MODE_VOLUME)
        {
            doc["current_volume"] = currentVolume;
            doc["target_volume"] = targetVolume;
        }
    }

    String response;
    serializeJson(doc, response);
    return response;
}

// Create error JSON response
String PumpController::createErrorResponse(const String &error)
{
    JsonDocument doc;
    doc["error"] = error;
    doc["status"] = "error";

    String response;
    serializeJson(doc, response);
    return response;
}

// PUMP reativado para testes com LED interno
// Global instance
PumpController pumpController;
