"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Droplets, Wifi, Info, CheckCircle } from "lucide-react";
import { SimpleDeviceConfigurator } from "@/components/device/SimpleDeviceConfigurator";
import { SimplePumpControl } from "@/components/pump/SimplePumpControl";
import { type SimpleDeviceConfig } from "@/server/actions/pump-simple";

interface DeviceConfig {
  deviceName: string;
  deviceIp: string;
  description?: string;
  lastUpdated: string;
}

export function DeviceManagement() {
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig | null>(null);
  const [activeTab, setActiveTab] = useState<string>("control");

  // Load device configuration from localStorage
  useEffect(() => {
    const loadDeviceConfig = () => {
      try {
        const savedConfig = localStorage.getItem("esp32-device-config");
        if (savedConfig) {
          const config = JSON.parse(savedConfig) as DeviceConfig;
          setDeviceConfig(config);
        } else {
          setActiveTab("configure"); // Switch to config tab if no device configured
        }
      } catch (err) {
        console.error("Failed to load device configuration:", err);
        setActiveTab("configure");
      }
    };

    loadDeviceConfig();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "esp32-device-config") {
        loadDeviceConfig();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleConfigurationComplete = (config: SimpleDeviceConfig) => {
    // Configuration is already saved in localStorage by SimpleDeviceConfigurator
    // Just update our state and switch tabs
    setDeviceConfig({
      ...config,
      lastUpdated: new Date().toISOString(),
    });
    setActiveTab("control");
  };

  const handleReconfigure = () => {
    setActiveTab("configure");
  };

  const clearConfiguration = () => {
    localStorage.removeItem("esp32-device-config");
    setDeviceConfig(null);
    setActiveTab("configure");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Device Management</h1>
          <p className="text-muted-foreground">
            Configure and control your ESP32 greenhouse device
          </p>
        </div>

        {deviceConfig && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Device configured: {deviceConfig.deviceName}</span>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="control" className="flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            Pump Control
          </TabsTrigger>
          <TabsTrigger value="configure" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Device Config
          </TabsTrigger>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Information
          </TabsTrigger>
        </TabsList>

        <TabsContent value="control" className="space-y-4">
          <SimplePumpControl />

          {deviceConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Device Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleReconfigure}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Reconfigure Device
                </Button>
                <Button
                  variant="destructive"
                  onClick={clearConfiguration}
                  className="flex items-center gap-2"
                >
                  Clear Configuration
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="configure" className="space-y-4">
          <SimpleDeviceConfigurator
            onConfigurationComplete={handleConfigurationComplete}
            initialConfig={deviceConfig || undefined}
          />
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Device Configuration</h4>
                  {deviceConfig ? (
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>Name:</strong> {deviceConfig.deviceName}
                      </p>
                      <p>
                        <strong>IP Address:</strong> {deviceConfig.deviceIp}
                      </p>
                      {deviceConfig.description && (
                        <p>
                          <strong>Description:</strong>{" "}
                          {deviceConfig.description}
                        </p>
                      )}
                      <p>
                        <strong>Last Updated:</strong>{" "}
                        {new Date(deviceConfig.lastUpdated).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No device configured
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Storage Information</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Storage Type:</strong> Browser localStorage
                    </p>
                    <p>
                      <strong>Data Persistence:</strong> Local to this browser
                    </p>
                    <p>
                      <strong>Backup:</strong> Configuration is also saved to
                      backend
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <Wifi className="h-4 w-4" />
                <AlertDescription>
                  <strong>How it works:</strong> This system uses a simplified
                  approach where your ESP32 device IP is stored locally and used
                  for direct communication. No greenhouse association is
                  required - just configure the device IP and start controlling
                  your irrigation system.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="font-semibold">Features</h4>
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  <li>Direct IP-based device communication</li>
                  <li>Real-time pump status monitoring</li>
                  <li>Quick activation presets (10s, 30s, 1min)</li>
                  <li>Custom duration control (1-3600 seconds)</li>
                  <li>Connection testing and status indicators</li>
                  <li>Local configuration storage with backend backup</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
