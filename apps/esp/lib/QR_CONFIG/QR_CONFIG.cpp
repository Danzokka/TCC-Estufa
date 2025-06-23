#include "QR_CONFIG.h"

// MODO DESENVOLVIMENTO: QRConfigManager desabilitado
// QRConfigManager qrConfig;

QRConfigManager::QRConfigManager()
    : server(80), isConfigured(false), configMode(false), configModeStartTime(0), qrCodeData(nullptr)
{
}

QRConfigManager::~QRConfigManager()
{
    if (qrCodeData)
        free(qrCodeData);
}

bool QRConfigManager::begin()
{
    Serial.println("Initializing QR Configuration Manager...");

    // Initialize preferences
    if (!preferences.begin("greenhouse", false))
    {
        Serial.println("ERROR: Failed to initialize preferences");
        return false;
    }

    // Generate or load device ID
    deviceId = generateDeviceId();
    deviceName = "ESP32-Greenhouse-" + deviceId.substring(0, 8);

    Serial.printf("Device ID: %s\n", deviceId.c_str());
    Serial.printf("Device Name: %s\n", deviceName.c_str());

    // Load existing configuration
    loadConfiguration();

    Serial.printf("Configuration loaded: %s\n", isConfigured ? "YES" : "NO");

    return true;
}

bool QRConfigManager::needsConfiguration()
{
    // TEMPORÁRIO: Desabilitado para desenvolvimento
    // Remove esta linha e descomente a linha abaixo para reativar QR config
    return false;

    // return !isConfigured || wifiSSID.isEmpty() || wifiPassword.isEmpty() ||
    //        userPlant.isEmpty() || greenhouseId.isEmpty();
}

bool QRConfigManager::enterConfigMode()
{
    Serial.println("Entering QR configuration mode...");

    configMode = true;
    configModeStartTime = millis();

    // Generate QR code with configuration data
    if (!generateQRCode())
    {
        Serial.println("ERROR: Failed to generate QR code");
        configMode = false;
        return false;
    }

    Serial.println("QR code generated successfully - ready for scanning");
    Serial.printf("Configuration timeout: %lu ms\n", CONFIG_MODE_TIMEOUT);

    return true;
}

void QRConfigManager::exitConfigMode()
{
    Serial.println("Exiting QR configuration mode");
    configMode = false;
    configModeStartTime = 0;
}

bool QRConfigManager::isInConfigMode()
{
    return configMode;
}

bool QRConfigManager::generateQRCode()
{
    // Allocate QR code buffer if not already allocated
    if (qrCodeData == nullptr)
    {
        qrCodeData = (uint8_t *)malloc(QR_BUFFER_SIZE);
        if (qrCodeData == nullptr)
        {
            Serial.println("ERROR: Failed to allocate QR code buffer");
            return false;
        }
    }

    // Create MINIMAL JSON payload - APENAS CAMPOS ESSENCIAIS
    JsonDocument doc;

    // APENAS OS 4 CAMPOS OBRIGATÓRIOS PARA CONFIGURAÇÃO
    doc["ssid"] = "Dantas_2.4G"; // SSID padrão
    doc["pwd"] = "";             // Password vazio para ser configurado
    doc["plant"] = "";           // userPlant vazio para ser configurado
    doc["green"] = "";           // greenhouseId vazio para ser configurado

    // Convert to string
    String jsonString;
    serializeJson(doc, jsonString);

    Serial.println("=== QR CODE MINIMAL ===");
    Serial.println("JSON: " + jsonString);
    Serial.println("Size: " + String(jsonString.length()) + " bytes");
    Serial.println("======================");

    // Generate QR code with LOWER error correction for smaller size
    if (qrcode_initText(&qrCode, qrCodeData, QR_VERSION, 0, jsonString.c_str()) != 0)
    {
        Serial.println("ERROR: Failed to generate QR code - data too large");
        return false;
    }

    Serial.printf("QR Code generated successfully: %dx%d modules\n", qrCode.size, qrCode.size);
    return true;
}

bool QRConfigManager::getQRModule(int x, int y)
{
    if (!configMode || x < 0 || y < 0 || x >= qrCode.size || y >= qrCode.size)
    {
        return false;
    }

    return qrcode_getModule(&qrCode, x, y);
}

int QRConfigManager::getQRSize()
{
    return configMode ? qrCode.size : 0;
}

bool QRConfigManager::saveConfiguration(const JsonObject &config)
{
    Serial.println("Saving device configuration...");

    try
    {
        // Extract configuration values from minimal JSON format
        if (config["ssid"].is<String>())
        {
            wifiSSID = config["ssid"].as<String>();
            preferences.putString("wifiSSID", wifiSSID);
        }

        if (config["pwd"].is<String>())
        {
            wifiPassword = config["pwd"].as<String>();
            preferences.putString("wifiPassword", wifiPassword);
        }

        if (config["plant"].is<String>())
        {
            userPlant = config["plant"].as<String>();
            preferences.putString("userPlant", userPlant);
        }

        if (config["green"].is<String>())
        {
            greenhouseId = config["green"].as<String>();
            preferences.putString("greenhouseId", greenhouseId);
        }

        // Legacy format support (if someone sends old format)
        if (config["wifiSSID"].is<String>())
        {
            wifiSSID = config["wifiSSID"].as<String>();
            preferences.putString("wifiSSID", wifiSSID);
        }

        if (config["wifiPassword"].is<String>())
        {
            wifiPassword = config["wifiPassword"].as<String>();
            preferences.putString("wifiPassword", wifiPassword);
        }

        if (config["userPlant"].is<String>())
        {
            userPlant = config["userPlant"].as<String>();
            preferences.putString("userPlant", userPlant);
        }

        if (config["greenhouseId"].is<String>())
        {
            greenhouseId = config["greenhouseId"].as<String>();
            preferences.putString("greenhouseId", greenhouseId);
        }

        if (config["serverURL"].is<String>())
        {
            serverURL = config["serverURL"].as<String>();
            preferences.putString("serverURL", serverURL);
        }

        if (config["deviceName"].is<String>())
        {
            deviceName = config["deviceName"].as<String>();
            preferences.putString("deviceName", deviceName);
        }

        // Mark as configured if all required fields are present
        if (!wifiSSID.isEmpty() && !wifiPassword.isEmpty() &&
            !userPlant.isEmpty() && !greenhouseId.isEmpty())
        {
            isConfigured = true;
            preferences.putBool("configured", true);
        }

        Serial.println("Configuration saved successfully:");
        Serial.printf("  WiFi SSID: %s\n", wifiSSID.c_str());
        Serial.printf("  User Plant: %s\n", userPlant.c_str());
        Serial.printf("  Greenhouse ID: %s\n", greenhouseId.c_str());
        Serial.printf("  Server URL: %s\n", serverURL.c_str());
        Serial.printf("  Device Name: %s\n", deviceName.c_str());
        Serial.printf("  Configured: %s\n", isConfigured ? "YES" : "NO");

        return true;
    }
    catch (const std::exception &e)
    {
        Serial.printf("ERROR: Failed to save configuration: %s\n", e.what());
        return false;
    }
}

bool QRConfigManager::loadConfiguration()
{
    Serial.println("Loading device configuration...");

    isConfigured = preferences.getBool("configured", false);
    if (isConfigured)
    {
        wifiSSID = preferences.getString("wifiSSID", "");
        wifiPassword = preferences.getString("wifiPassword", "");
        serverURL = preferences.getString("serverURL", "");
        greenhouseId = preferences.getString("greenhouseId", "");
        userPlant = preferences.getString("userPlant", "");
        deviceName = preferences.getString("deviceName", "ESP32-Greenhouse-" + deviceId.substring(0, 8));

        Serial.println("Configuration loaded:");
        Serial.printf("  WiFi SSID: %s\n", wifiSSID.c_str());
        Serial.printf("  Server URL: %s\n", serverURL.c_str());
        Serial.printf("  Greenhouse ID: %s\n", greenhouseId.c_str());
        Serial.printf("  User Plant: %s\n", userPlant.c_str());
        Serial.printf("  Device Name: %s\n", deviceName.c_str());

        return true;
    }
    else
    {
        Serial.println("No saved configuration found");
        return false;
    }
}

String QRConfigManager::generateDeviceId()
{
    // Generate unique device ID based on MAC address and chip ID
    String mac = WiFi.macAddress();
    mac.replace(":", "");

    uint64_t chipid = ESP.getEfuseMac();
    String chipIdHex = String(chipid, HEX);

    return "ESP32-" + mac + "-" + chipIdHex;
}

String QRConfigManager::getConfigurationJSON()
{
    JsonDocument doc;
    doc["deviceId"] = deviceId;
    doc["deviceName"] = deviceName;
    doc["greenhouseId"] = greenhouseId;
    doc["wifiSSID"] = wifiSSID;
    doc["serverURL"] = serverURL;
    doc["isConfigured"] = isConfigured;
    doc["timestamp"] = millis();

    String jsonString;
    serializeJson(doc, jsonString);
    return jsonString;
}

bool QRConfigManager::connectToWiFi()
{
    if (wifiSSID.isEmpty())
    {
        Serial.println("ERROR: No WiFi credentials available");
        return false;
    }

    Serial.printf("Connecting to WiFi: %s\n", wifiSSID.c_str());

    WiFi.mode(WIFI_STA);
    WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());

    unsigned long startTime = millis();
    const unsigned long timeout = 30000; // 30 seconds timeout

    while (WiFi.status() != WL_CONNECTED && (millis() - startTime) < timeout)
    {
        delay(500);
        Serial.print(".");
    }

    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.println("");
        Serial.printf("WiFi connected! IP: %s\n", WiFi.localIP().toString().c_str());
        Serial.printf("RSSI: %d dBm\n", WiFi.RSSI());
        return true;
    }
    else
    {
        Serial.println("");
        Serial.printf("WiFi connection failed! Status: %d\n", WiFi.status());
        return false;
    }
}

bool QRConfigManager::checkConfigTimeout()
{
    if (!configMode)
        return false;

    return (millis() - configModeStartTime) > CONFIG_MODE_TIMEOUT;
}

void QRConfigManager::resetConfiguration()
{
    Serial.println("Resetting device configuration...");

    preferences.clear();

    isConfigured = false;
    wifiSSID = "";
    wifiPassword = "";
    serverURL = "";
    greenhouseId = "";
    configMode = false;

    Serial.println("Configuration reset complete");
}

bool QRConfigManager::startConfigServer()
{
    if (!WiFi.softAP("ESP32-Config-" + deviceId.substring(0, 8), ""))
    {
        Serial.println("ERROR: Failed to start AP for configuration");
        return false;
    }

    Serial.printf("Configuration AP started: ESP32-Config-%s\n", deviceId.substring(0, 8).c_str());
    Serial.printf("AP IP address: %s\n", WiFi.softAPIP().toString().c_str());

    // Setup HTTP server routes
    server.on("/", HTTP_OPTIONS, [this]()
              { handleCorsRequest(); });
    server.on("/config", HTTP_OPTIONS, [this]()
              { handleCorsRequest(); });
    server.on("/status", HTTP_OPTIONS, [this]()
              { handleCorsRequest(); });

    server.on("/config", HTTP_POST, [this]()
              { handleConfigRequest(); });
    server.on("/status", HTTP_GET, [this]()
              { handleStatusRequest(); });

    // Handle 404
    server.onNotFound([this]()
                      {
        server.sendHeader("Access-Control-Allow-Origin", "*");
        server.send(404, "application/json", "{\"error\":\"Not Found\"}"); });

    server.begin();
    Serial.println("HTTP server started on port 80");

    return true;
}

void QRConfigManager::stopConfigServer()
{
    server.stop();
    WiFi.softAPdisconnect(true);
    Serial.println("Configuration server stopped");
}

void QRConfigManager::handleServerRequests()
{
    server.handleClient();
}

void QRConfigManager::handleConfigRequest()
{
    // Enable CORS
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");

    if (!server.hasArg("plain"))
    {
        server.send(400, "application/json", "{\"error\":\"Missing request body\"}");
        return;
    }

    String body = server.arg("plain");
    Serial.println("Received configuration:");
    Serial.println(body);

    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, body);

    if (error)
    {
        Serial.printf("ERROR: JSON parsing failed: %s\n", error.c_str());
        server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
        return;
    }

    // Save configuration
    if (saveConfiguration(doc.as<JsonObject>()))
    {
        server.send(200, "application/json", "{\"success\":true,\"message\":\"Configuration saved\"}");

        // Exit config mode after successful configuration
        exitConfigMode();

        // Attempt to connect to WiFi with new credentials
        if (connectToWiFi())
        {
            Serial.println("Successfully connected to WiFi with new configuration");
        }
    }
    else
    {
        server.send(500, "application/json", "{\"error\":\"Failed to save configuration\"}");
    }
}

void QRConfigManager::handleStatusRequest()
{
    // Enable CORS
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");

    JsonDocument doc;
    doc["deviceId"] = deviceId;
    doc["deviceName"] = deviceName;
    doc["configured"] = isConfigured;
    doc["configMode"] = configMode;
    doc["uptime"] = millis();

    // WiFi status
    if (WiFi.status() == WL_CONNECTED)
    {
        doc["wifi"]["status"] = "connected";
        doc["wifi"]["ssid"] = WiFi.SSID();
        doc["wifi"]["ip"] = WiFi.localIP().toString();
        doc["wifi"]["rssi"] = WiFi.RSSI();
    }
    else
    {
        doc["wifi"]["status"] = "disconnected";
    }

    // AP mode status
    if (WiFi.getMode() == WIFI_AP || WiFi.getMode() == WIFI_AP_STA)
    {
        doc["ap"]["enabled"] = true;
        doc["ap"]["ip"] = WiFi.softAPIP().toString();
        doc["ap"]["clients"] = WiFi.softAPgetStationNum();
    }
    else
    {
        doc["ap"]["enabled"] = false;
    }

    String response;
    serializeJson(doc, response);

    server.send(200, "application/json", response);
}

void QRConfigManager::handleCorsRequest()
{
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    server.send(200, "text/plain", "");
}
