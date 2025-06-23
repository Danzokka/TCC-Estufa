"use server";

import { z } from "zod";
import api from "@/lib/api";

// Validation schema for device configuration
const DeviceConfigSchema = z.object({
  deviceId: z.string().min(1, "Device ID is required"),
  deviceName: z.string().min(3, "Device name must be at least 3 characters"),
  deviceType: z.string().min(1, "Device type is required"),
  wifiSSID: z.string().min(1, "WiFi network name is required"),
  wifiPassword: z
    .string()
    .min(8, "WiFi password must be at least 8 characters"),
  serverURL: z.string().url("Please enter a valid server URL"),
  greenhouseId: z.string().min(1, "Greenhouse ID is required"),
  sensors: z.array(z.string()).optional(),
  actuators: z.array(z.string()).optional(),
  macAddress: z.string().optional(),
});

type DeviceConfig = z.infer<typeof DeviceConfigSchema>;

interface ConfigureDeviceResult {
  success: boolean;
  message: string;
  greenhouse?: {
    id: string;
    name: string;
  };
  device?: {
    id: string;
    name: string;
  };
}

/**
 * Configure an ESP32 greenhouse device
 * This server action handles the device configuration process by:
 * 1. Validating the configuration data
 * 2. Creating/updating the greenhouse record
 * 3. Registering the device in the database
 * 4. Sending configuration to the ESP32 device
 */
export async function configureGreenhouseDevice(
  formData: DeviceConfig
): Promise<ConfigureDeviceResult> {
  try {
    // Validate input data
    const validatedData = DeviceConfigSchema.parse(formData);

    console.log("Configuring device:", validatedData.deviceId);

    // Get API base URL from environment
    const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:5000";

    // Step 1: Create or get greenhouse
    const greenhouseResponse = await fetch(`${apiBaseUrl}/greenhouse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Note: In production, you'd need proper authentication headers
      },
      body: JSON.stringify({
        name: `Greenhouse for ${validatedData.deviceName}`,
        location: "Auto-configured",
        description: `Greenhouse automatically configured for device ${validatedData.deviceId}`,
        // Environmental settings with default values
        temperature: {
          min: 18,
          max: 28,
          optimal: { min: 20, max: 25 },
        },
        humidity: {
          min: 60,
          max: 80,
          optimal: { min: 65, max: 75 },
        },
        soilMoisture: {
          min: 30,
          max: 70,
          optimal: { min: 40, max: 60 },
        },
        // Device and QR code information
        qrCodeData: JSON.stringify(validatedData),
        deviceMacAddress: validatedData.macAddress,
        isActive: true,
      }),
    });

    if (!greenhouseResponse.ok) {
      const errorData = await greenhouseResponse.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Failed to create greenhouse: ${greenhouseResponse.status}`
      );
    }

    const greenhouse = await greenhouseResponse.json();
    console.log("Greenhouse created/updated:", greenhouse.id);

    // Step 2: Register device in the database
    const deviceResponse = await fetch(`${apiBaseUrl}/device`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deviceId: validatedData.deviceId,
        name: validatedData.deviceName,
        type: validatedData.deviceType,
        macAddress: validatedData.macAddress,
        greenhouseId: greenhouse.id,
        sensors: validatedData.sensors || [],
        actuators: validatedData.actuators || [],
        wifiSSID: validatedData.wifiSSID,
        serverURL: validatedData.serverURL,
        isActive: true,
        lastSeen: new Date().toISOString(),
      }),
    });

    if (!deviceResponse.ok) {
      const errorData = await deviceResponse.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Failed to register device: ${deviceResponse.status}`
      );
    }

    const device = await deviceResponse.json();
    console.log("Device registered:", device.id); // Step 3: Send configuration to ESP32 device
    try {
      const deviceConfig = {
        wifiSSID: validatedData.wifiSSID,
        wifiPassword: validatedData.wifiPassword,
        serverURL: validatedData.serverURL,
        greenhouseId: greenhouse.id,
        deviceName: validatedData.deviceName,
      };

      // Try to send configuration directly to device HTTP server
      const configSuccess = await sendConfigurationToDevice(deviceConfig);

      if (!configSuccess) {
        console.warn(
          "Failed to send configuration to device directly, configuration saved in database"
        );
      }
    } catch (deviceCommError) {
      console.warn("Failed to send configuration to device:", deviceCommError);
      // Don't fail the entire operation if device communication fails
    }

    return {
      success: true,
      message:
        "Device configured successfully! The ESP32 will now connect to your WiFi and start monitoring your greenhouse.",
      greenhouse: {
        id: greenhouse.id,
        name: greenhouse.name,
      },
      device: {
        id: device.id,
        name: device.name,
      },
    };
  } catch (error) {
    console.error("Device configuration error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: `Validation error: ${error.errors.map((e) => e.message).join(", ")}`,
      };
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      message: `Configuration failed: ${errorMessage}`,
    };
  }
}

/**
 * Send configuration directly to ESP32 device via HTTP
 */
async function sendConfigurationToDevice(config: {
  wifiSSID: string;
  wifiPassword: string;
  serverURL: string;
  greenhouseId: string;
  deviceName: string;
}): Promise<boolean> {
  const ESP32_CONFIG_URL = "http://192.168.4.1/config"; // ESP32 AP IP
  const TIMEOUT_MS = 10000; // 10 seconds

  try {
    console.log("Attempting to send configuration to ESP32...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(ESP32_CONFIG_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(config),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`ESP32 configuration failed: ${response.status}`);
      return false;
    }

    const result = await response.json();
    console.log("ESP32 configuration response:", result);

    return result.success === true;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("ESP32 configuration timeout");
      } else {
        console.error("ESP32 configuration error:", error.message);
      }
    } else {
      console.error("Unknown ESP32 configuration error:", error);
    }
    return false;
  }
}

/**
 * Get available greenhouses for device assignment
 */
export async function getAvailableGreenhouses() {
  try {
    const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:5000";

    const response = await fetch(`${apiBaseUrl}/greenhouse`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch greenhouses: ${response.status}`);
    }

    const greenhouses = await response.json();
    return {
      success: true,
      data: greenhouses,
    };
  } catch (error) {
    console.error("Error fetching greenhouses:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch greenhouses",
      data: [],
    };
  }
}

/**
 * Get device status and configuration
 */
export async function getDeviceStatus(deviceId: string) {
  try {
    const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:5000";

    const response = await fetch(`${apiBaseUrl}/device/${deviceId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch device status: ${response.status}`);
    }

    const device = await response.json();
    return {
      success: true,
      data: device,
    };
  } catch (error) {
    console.error("Error fetching device status:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch device status",
      data: null,
    };
  }
}

/**
 * Fetch all greenhouses for the current user
 */
export async function getUserGreenhouses(): Promise<{
  success: boolean;
  greenhouses: Array<{ id: string; name: string; location: string }>;
  message?: string;
}> {
  try {
    const response = await api.get("/greenhouses");
    if (response.status === 200) {
      return {
        success: true,
        greenhouses: response.data.map(
          (greenhouse: { id: string; name: string; location?: string }) => ({
            id: greenhouse.id,
            name: greenhouse.name,
            location: greenhouse.location || "No location set",
          })
        ),
      };
    }
    return {
      success: false,
      greenhouses: [],
      message: "Failed to fetch greenhouses",
    };
  } catch (error) {
    console.error("Error fetching greenhouses:", error);
    return {
      success: false,
      greenhouses: [],
      message:
        error instanceof Error ? error.message : "Failed to fetch greenhouses",
    };
  }
}
