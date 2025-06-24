"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wifi, Server, Leaf } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getUserGreenhouses } from "@/server/actions/device-config";

// Validation schema for device configuration
const deviceConfigSchema = z.object({
  deviceName: z.string().min(3, "Device name must be at least 3 characters"),
  wifiSSID: z.string().min(1, "WiFi network name is required"),
  wifiPassword: z
    .string()
    .min(8, "WiFi password must be at least 8 characters"),
  serverURL: z.string().url("Please enter a valid server URL"),
  greenhouseId: z.string().min(1, "Please select a greenhouse"),
});

type DeviceConfigForm = z.infer<typeof deviceConfigSchema>;

interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  sensors: string[];
  actuators: string[];
  network: {
    mac: string;
    ip?: string;
  };
}

interface DeviceConfiguratorProps {
  deviceData: string; // JSON string from QR code
  onConfigurationComplete: (config: DeviceConfigForm) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  className?: string;
}

export interface Greenhouse {
  id: string;
  name: string;
  location: string;
}

export function DeviceConfigurator({
  deviceData,
  onConfigurationComplete,
  onCancel,
  isSubmitting = false,
  className,
}: DeviceConfiguratorProps) {
  const [error, setError] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  const form = useForm<DeviceConfigForm>({
    resolver: zodResolver(deviceConfigSchema),
    defaultValues: {
      deviceName: "",
      wifiSSID: "",
      wifiPassword: "",
      serverURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
      greenhouseId: "",
    },
  });

  // Parse device data on component mount
  useState(() => {
    try {
      const parsedDevice = JSON.parse(deviceData);
      setDeviceInfo(parsedDevice);
      // Set default device name
      form.setValue(
        "deviceName",
        parsedDevice.deviceName || `ESP32-${parsedDevice.deviceId?.slice(-8)}`
      );
    } catch {
      setError("Invalid device data received");
    }
  });

  const onSubmit = async (data: DeviceConfigForm) => {
    setError(null);

    try {
      // Validate that device info is available
      if (!deviceInfo) {
        throw new Error("Device information not available");
      }

      // Create complete configuration object
      const configuration = {
        ...data,
        deviceId: deviceInfo.deviceId,
        deviceType: deviceInfo.deviceType,
        sensors: deviceInfo.sensors,
        actuators: deviceInfo.actuators,
        macAddress: deviceInfo.network?.mac,
      };

      onConfigurationComplete(configuration);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Configuration failed";
      setError(errorMsg);
    }
  };

  // Fetch greenhouses from API
  const {
    data: greenhouseQuery,
    isLoading: isGreenhousesLoading,
  } = useQuery({
    queryKey: ["user-greenhouses"],
    queryFn: getUserGreenhouses,
  });

  if (!deviceInfo) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              {error || "Loading device information..."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="h-5 w-5" />
          Configure Greenhouse Device
        </CardTitle>{" "}
        <CardDescription>
          Set up WiFi and greenhouse settings for {deviceInfo.deviceName}
          <br />
          <small className="text-xs text-muted-foreground">
            Configuration will be sent to the device via HTTP (192.168.4.1)
          </small>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Device Information */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <h4 className="font-medium">Device Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Device ID:</span>
              <p className="font-mono">{deviceInfo.deviceId}</p>
            </div>
            <div>
              <span className="text-muted-foreground">MAC Address:</span>
              <p className="font-mono">{deviceInfo.network?.mac}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Sensors:</span>
              <p>{deviceInfo.sensors?.join(", ")}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Actuators:</span>
              <p>{deviceInfo.actuators?.join(", ")}</p>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Device Name */}
            <FormField
              control={form.control}
              name="deviceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Leaf className="h-4 w-4" />
                    Device Name
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="ESP32-Greenhouse-01" {...field} />
                  </FormControl>
                  <FormDescription>
                    A friendly name to identify this device
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* WiFi Configuration */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                WiFi Configuration
              </h4>

              <FormField
                control={form.control}
                name="wifiSSID"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Network Name (SSID)</FormLabel>
                    <FormControl>
                      <Input placeholder="MyGreenhouseWiFi" {...field} />
                    </FormControl>
                    <FormDescription>
                      The WiFi network the device should connect to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="wifiPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WiFi Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter WiFi password"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The password for the WiFi network
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Server Configuration */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Server className="h-4 w-4" />
                Server Configuration
              </h4>

              <FormField
                control={form.control}
                name="serverURL"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Server URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="http://192.168.1.100:5000"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The URL of your greenhouse management server
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="greenhouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Greenhouse Assignment</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a greenhouse" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isGreenhousesLoading ? (
                          <SelectItem disabled value="">
                            Loading...
                          </SelectItem>
                        ) : greenhouseQuery?.greenhouses?.length ? (
                          greenhouseQuery.greenhouses.map((greenhouse) => (
                            <SelectItem
                              key={greenhouse.id}
                              value={greenhouse.id}
                            >
                              {greenhouse.name} - {greenhouse.location}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem disabled value="">
                            No greenhouses found
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose which greenhouse this device will monitor
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Configuring...
                  </>
                ) : (
                  "Configure Device"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
