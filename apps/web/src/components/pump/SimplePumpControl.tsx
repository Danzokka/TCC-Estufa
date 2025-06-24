"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Droplets,
  Power,
  Clock,
  AlertCircle,
  Settings,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  activateSimplePump,
  stopSimplePump,
  getSimpleDeviceStatus,
  type SimpleDeviceStatus,
} from "@/server/actions/pump-simple";

interface SimplePumpControlProps {
  className?: string;
  onStatusChange?: (status: SimpleDeviceStatus | null) => void;
}

interface DeviceConfig {
  deviceName: string;
  deviceIp: string;
  description?: string;
  lastUpdated: string;
}

export function SimplePumpControl({
  className,
  onStatusChange,
}: SimplePumpControlProps) {
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig | null>(null);
  const [status, setStatus] = useState<SimpleDeviceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customDuration, setCustomDuration] = useState<number>(30);

  // Load device configuration from localStorage
  useEffect(() => {
    const loadDeviceConfig = () => {
      try {
        const savedConfig = localStorage.getItem("esp32-device-config");
        if (savedConfig) {
          const config = JSON.parse(savedConfig) as DeviceConfig;
          setDeviceConfig(config);
        }
      } catch (err) {
        console.error("Failed to load device configuration:", err);
      }
    };

    loadDeviceConfig();

    // Listen for storage changes (if config is updated in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "esp32-device-config") {
        loadDeviceConfig();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Poll device status
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const pollStatus = async () => {
      if (!deviceConfig?.deviceIp) return;

      try {
        const result = await getSimpleDeviceStatus(deviceConfig.deviceIp);
        if (result.success && result.data) {
          setStatus(result.data);
          onStatusChange?.(result.data);
          setError(null);
        } else {
          setStatus(null);
          onStatusChange?.(null);
        }
      } catch (err) {
        console.error("Failed to poll device status:", err);
        setStatus(null);
        onStatusChange?.(null);
      }
    };

    if (deviceConfig?.deviceIp) {
      // Initial load
      pollStatus();

      // Set up polling - more frequent when pump is active
      const pollInterval = status?.isActive ? 3000 : 10000; // 3s when active, 10s when idle
      interval = setInterval(pollStatus, pollInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [deviceConfig?.deviceIp, status?.isActive, onStatusChange]);

  const handleQuickActivate = async (duration: number) => {
    if (!deviceConfig?.deviceIp) {
      setError(
        "Device not configured. Please configure your ESP32 device first."
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await activateSimplePump({
        deviceIp: deviceConfig.deviceIp,
        duration,
        reason: `Quick activation - ${duration}s`,
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success(`💧 Pump activated for ${duration} seconds`, {
        description: `Device: ${deviceConfig.deviceName}`,
      });

      // Update status immediately
      if (result.data) {
        setStatus(result.data);
        onStatusChange?.(result.data);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to activate pump";
      setError(errorMessage);
      toast.error("Pump activation failed", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomActivate = async () => {
    if (customDuration < 1 || customDuration > 3600) {
      toast.error("Duration must be between 1 and 3600 seconds");
      return;
    }

    await handleQuickActivate(customDuration);
  };

  const handleStopPump = async () => {
    if (!deviceConfig?.deviceIp) {
      setError("Device not configured");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await stopSimplePump(deviceConfig.deviceIp);

      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success("Pump stopped successfully");

      // Refresh status
      const statusResult = await getSimpleDeviceStatus(deviceConfig.deviceIp);
      if (statusResult.success && statusResult.data) {
        setStatus(statusResult.data);
        onStatusChange?.(statusResult.data);
      } else {
        setStatus(null);
        onStatusChange?.(null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to stop pump";
      setError(errorMessage);
      toast.error("Failed to stop pump", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!deviceConfig) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Pump Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              No ESP32 device configured. Please configure your device first to
              enable pump control.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Pump Control
          </div>
          <div className="flex items-center gap-2 text-sm font-normal">
            {status ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-muted-foreground">
              {deviceConfig.deviceName}
            </span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Device Info */}
        <div className="text-sm text-muted-foreground">
          <p>
            <strong>Device IP:</strong> {deviceConfig.deviceIp}
          </p>
          {deviceConfig.description && (
            <p>
              <strong>Description:</strong> {deviceConfig.description}
            </p>
          )}
        </div>

        {/* Status Display */}
        {status && (
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={status.isActive ? "default" : "secondary"}>
                {status.isActive ? "Active" : "Idle"}
              </Badge>
            </div>

            {status.isActive && (
              <>
                {status.remainingTime && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Remaining Time
                    </span>
                    <span className="font-mono">
                      {formatTime(status.remainingTime)}
                    </span>
                  </div>
                )}

                {status.targetWaterAmount && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Droplets className="h-4 w-4" />
                      Target Volume
                    </span>
                    <span>{status.targetWaterAmount}L</span>
                  </div>
                )}
              </>
            )}

            <div className="text-xs text-muted-foreground">
              Last update: {new Date(status.lastUpdate).toLocaleTimeString()}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Actions</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickActivate(10)}
              disabled={isLoading || status?.isActive}
            >
              10s
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickActivate(30)}
              disabled={isLoading || status?.isActive}
            >
              30s
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickActivate(60)}
              disabled={isLoading || status?.isActive}
            >
              1min
            </Button>
          </div>
        </div>

        {/* Custom Duration */}
        <div className="space-y-2">
          <Label htmlFor="custom-duration" className="text-sm font-medium">
            Custom Duration
          </Label>
          <div className="flex gap-2">
            <Input
              id="custom-duration"
              type="number"
              min="1"
              max="3600"
              value={customDuration}
              onChange={(e) =>
                setCustomDuration(parseInt(e.target.value) || 30)
              }
              placeholder="Duration in seconds"
              disabled={isLoading || status?.isActive}
            />
            <Button
              onClick={handleCustomActivate}
              disabled={isLoading || status?.isActive}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start
            </Button>
          </div>
        </div>

        {/* Stop Button */}
        {status?.isActive && (
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleStopPump}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Power className="mr-2 h-4 w-4" />
            Stop Pump
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
