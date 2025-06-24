"use client";

import { useState, useEffect } from "react";

export interface DeviceConfig {
  deviceName: string;
  deviceIp: string;
  description?: string;
  lastUpdated: string;
}

const STORAGE_KEY = "esp32-device-config";

export function useDeviceConfig() {
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load configuration from localStorage
  const loadConfig = () => {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        const config = JSON.parse(savedConfig) as DeviceConfig;
        setDeviceConfig(config);
        return config;
      }
      return null;
    } catch (error) {
      console.error("Failed to load device configuration:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Save configuration to localStorage
  const saveConfig = (config: Omit<DeviceConfig, "lastUpdated">) => {
    try {
      const configWithTimestamp: DeviceConfig = {
        ...config,
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(configWithTimestamp));
      setDeviceConfig(configWithTimestamp);

      // Trigger storage event for other tabs/components
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEY,
          newValue: JSON.stringify(configWithTimestamp),
        })
      );

      return configWithTimestamp;
    } catch (error) {
      console.error("Failed to save device configuration:", error);
      throw error;
    }
  };

  // Clear configuration
  const clearConfig = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setDeviceConfig(null);

      // Trigger storage event
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEY,
          newValue: null,
        })
      );
    } catch (error) {
      console.error("Failed to clear device configuration:", error);
    }
  };

  // Update configuration
  const updateConfig = (
    updates: Partial<Omit<DeviceConfig, "lastUpdated">>
  ) => {
    if (!deviceConfig) {
      throw new Error("No configuration to update");
    }

    const updatedConfig = {
      ...deviceConfig,
      ...updates,
    };

    return saveConfig(updatedConfig);
  };

  // Check if device is configured
  const isConfigured = Boolean(deviceConfig);

  // Get device IP
  const getDeviceIp = () => deviceConfig?.deviceIp || null;

  // Get device name
  const getDeviceName = () => deviceConfig?.deviceName || null;

  // Listen for storage changes (from other tabs)
  useEffect(() => {
    // Initial load
    loadConfig();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        if (e.newValue) {
          try {
            const config = JSON.parse(e.newValue) as DeviceConfig;
            setDeviceConfig(config);
          } catch (error) {
            console.error(
              "Failed to parse device configuration from storage event:",
              error
            );
          }
        } else {
          setDeviceConfig(null);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return {
    deviceConfig,
    isLoading,
    isConfigured,
    saveConfig,
    updateConfig,
    clearConfig,
    loadConfig,
    getDeviceIp,
    getDeviceName,
  };
}
