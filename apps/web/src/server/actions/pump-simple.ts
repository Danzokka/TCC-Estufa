"use server";

import api from "@/lib/api";
import { z } from "zod";

// DTOs for simplified pump control
export interface SimpleDeviceConfig {
  deviceName: string;
  deviceIp: string;
  description?: string;
}

export interface SimplePumpActivation {
  deviceIp: string;
  duration: number; // in seconds
  waterAmount?: number; // in liters
  reason?: string;
}

export interface SimpleDeviceStatus {
  deviceIp: string;
  deviceName: string;
  isActive: boolean;
  remainingTime?: number;
  targetWaterAmount?: number;
  currentWaterAmount?: number;
  startedAt?: Date;
  lastUpdate: Date;
}

// Validation schemas
const DeviceConfigSchema = z.object({
  deviceName: z.string().min(3, "Device name must be at least 3 characters"),
  deviceIp: z.string().ip("Invalid IP address"),
  description: z.string().optional(),
});

const PumpActivationSchema = z.object({
  deviceIp: z.string().ip("Invalid IP address"),
  duration: z
    .number()
    .min(1, "Duration must be at least 1 second")
    .max(3600, "Duration cannot exceed 1 hour"),
  waterAmount: z.number().min(0.1).optional(),
  reason: z.string().optional(),
});

/**
 * Save device configuration using simplified approach
 * Stores device IP and name for direct communication
 */
export async function saveSimpleDeviceConfig(
  config: SimpleDeviceConfig
): Promise<{
  success: boolean;
  message: string;
  data?: SimpleDeviceConfig;
}> {
  try {
    // Validate input
    const validatedConfig = DeviceConfigSchema.parse(config);

    const response = await api.post("/pump/device/config", validatedConfig);

    if (response.data.success) {
      return {
        success: true,
        message: "Device configuration saved successfully",
        data: response.data.data,
      };
    } else {
      throw new Error(response.data.message || "Failed to save configuration");
    }
  } catch (error: unknown) {
    console.error("Error saving device configuration:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to save device configuration";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Activate pump using device IP (no greenhouse required)
 */
export async function activateSimplePump(
  params: SimplePumpActivation
): Promise<{
  success: boolean;
  message: string;
  data?: SimpleDeviceStatus;
}> {
  try {
    // Validate input
    const validatedParams = PumpActivationSchema.parse(params);

    const response = await api.post("/pump/device/activate", validatedParams);

    if (response.data.success) {
      return {
        success: true,
        message: "Pump activated successfully",
        data: response.data.data,
      };
    } else {
      throw new Error(response.data.message || "Failed to activate pump");
    }
  } catch (error: unknown) {
    console.error("Error activating pump:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to activate pump";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Get device status by IP
 */
export async function getSimpleDeviceStatus(deviceIp: string): Promise<{
  success: boolean;
  message?: string;
  data?: SimpleDeviceStatus;
}> {
  try {
    // Validate IP
    z.string().ip().parse(deviceIp);

    const response = await api.get(`/pump/device/status/${deviceIp}`);

    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error: unknown) {
    console.error("Error getting device status:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get device status";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Stop pump by device IP
 */
export async function stopSimplePump(deviceIp: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Validate IP
    z.string().ip().parse(deviceIp);

    const response = await api.post("/pump/device/stop", { deviceIp });

    return {
      success: response.data.success,
      message: response.data.message || "Pump stopped successfully",
    };
  } catch (error: unknown) {
    console.error("Error stopping pump:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to stop pump";
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Test device connection
 */
export async function testDeviceConnection(deviceIp: string): Promise<{
  success: boolean;
  message: string;
  online: boolean;
}> {
  try {
    // Validate IP
    z.string().ip().parse(deviceIp);

    const response = await getSimpleDeviceStatus(deviceIp);

    return {
      success: true,
      message: response.success ? "Device is online" : "Device is offline",
      online: response.success,
    };
  } catch {
    return {
      success: false,
      message: "Failed to test connection",
      online: false,
    };
  }
}
