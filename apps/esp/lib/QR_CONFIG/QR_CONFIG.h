#pragma once

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <qrcode.h>

// QR Code configuration constants
#define QR_VERSION 6          // QR Code version (1-40)
#define QR_ERROR_CORRECTION 2 // Error correction level (0-3)
#define QR_BUFFER_SIZE 2953   // Buffer size for QR version 6

/**
 * @brief QR Code Configuration Manager for ESP32 Greenhouse Devices
 *
 * This class manages the generation and display of QR codes containing
 * WiFi credentials and greenhouse configuration data. It also handles
 * the device configuration process through the QR code system.
 */
class QRConfigManager
{
private:
  static const unsigned long CONFIG_MODE_TIMEOUT = 300000; // 5 minutes

  Preferences preferences;
  WebServer server;

  // Device configuration
  String deviceId;
  String deviceName;
  String greenhouseId;
  bool isConfigured;

  // WiFi configuration
  String wifiSSID;
  String wifiPassword;
  String serverURL;
  // QR Code data
  uint8_t *qrCodeData;
  QRCode qrCode;
  // Configuration state
  bool configMode;
  unsigned long configModeStartTime;

public:
  QRConfigManager();
  ~QRConfigManager();

  /**
   * @brief Initialize the QR configuration manager
   * @return true if initialization successful
   */
  bool begin();

  /**
   * @brief Check if device needs configuration
   * @return true if device needs configuration
   */
  bool needsConfiguration();

  /**
   * @brief Enter configuration mode and generate QR code
   * @return true if QR code generated successfully
   */
  bool enterConfigMode();

  /**
   * @brief Exit configuration mode
   */
  void exitConfigMode();

  /**
   * @brief Check if device is in configuration mode
   * @return true if in configuration mode
   */
  bool isInConfigMode();

  /**
   * @brief Generate QR code with device configuration data
   * @return true if QR code generated successfully
   */
  bool generateQRCode();

  /**
   * @brief Get QR code module state at specific coordinates
   * @param x X coordinate
   * @param y Y coordinate
   * @return true if module is dark
   */
  bool getQRModule(int x, int y);

  /**
   * @brief Get QR code size
   * @return QR code size in modules
   */
  int getQRSize();

  /**
   * @brief Save configuration to preferences
   * @param config JSON configuration object
   * @return true if configuration saved successfully
   */
  bool saveConfiguration(const JsonObject &config);

  /**
   * @brief Load configuration from preferences
   * @return true if configuration loaded successfully
   */
  bool loadConfiguration();

  /**
   * @brief Generate unique device ID based on MAC address
   * @return Device ID string
   */
  String generateDeviceId();

  /**
   * @brief Get device configuration as JSON string
   * @return JSON string with device configuration
   */
  String getConfigurationJSON();

  /**
   * @brief Connect to WiFi using stored credentials
   * @return true if connection successful
   */
  bool connectToWiFi();
  /**
   * @brief Check configuration mode timeout
   * @return true if timeout reached
   */
  bool checkConfigTimeout();

  /**
   * @brief Start HTTP server for configuration
   * @return true if server started successfully
   */
  bool startConfigServer();

  /**
   * @brief Stop HTTP server
   */
  void stopConfigServer();
  /**
   * @brief Handle HTTP server requests
   */
  void handleServerRequests();

  /**
   * @brief Reset device configuration
   */
  void resetConfiguration();

  // Getters
  String getDeviceId() const { return deviceId; }
  String getDeviceName() const { return deviceName; }
  String getGreenhouseId() const { return greenhouseId; }
  String getWiFiSSID() const { return wifiSSID; }
  String getServerURL() const { return serverURL; }
  bool getIsConfigured() const { return isConfigured; }

private:
  /**
   * @brief Handle configuration POST request
   */
  void handleConfigRequest();

  /**
   * @brief Handle status GET request
   */
  void handleStatusRequest();
  /**
   * @brief Handle CORS preflight request
   */
  void handleCorsRequest();
};

extern QRConfigManager qrConfig;
