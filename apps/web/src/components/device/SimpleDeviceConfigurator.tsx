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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wifi, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  saveSimpleDeviceConfig,
  testDeviceConnection,
  type SimpleDeviceConfig,
} from "@/server/actions/pump-simple";

// Validation schema for simplified device configuration
const deviceConfigSchema = z.object({
  deviceName: z.string().min(3, "Device name must be at least 3 characters"),
  deviceIp: z.string().ip("Please enter a valid IP address"),
  description: z.string().optional(),
});

type DeviceConfigForm = z.infer<typeof deviceConfigSchema>;

interface SimpleDeviceConfiguratorProps {
  onConfigurationComplete?: (config: SimpleDeviceConfig) => void;
  onCancel?: () => void;
  className?: string;
  initialConfig?: Partial<SimpleDeviceConfig>;
}

export function SimpleDeviceConfigurator({
  onConfigurationComplete,
  onCancel,
  className,
  initialConfig,
}: SimpleDeviceConfiguratorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "unknown" | "testing" | "online" | "offline"
  >("unknown");
  const [error, setError] = useState<string | null>(null);

  const form = useForm<DeviceConfigForm>({
    resolver: zodResolver(deviceConfigSchema),
    defaultValues: {
      deviceName: initialConfig?.deviceName || "",
      deviceIp: initialConfig?.deviceIp || "",
      description: initialConfig?.description || "",
    },
  });

  const onSubmit = async (data: DeviceConfigForm) => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Save configuration to backend
      const result = await saveSimpleDeviceConfig(data);

      if (!result.success) {
        throw new Error(result.message);
      }

      // Save to localStorage for frontend use
      const deviceConfig = {
        deviceName: data.deviceName,
        deviceIp: data.deviceIp,
        description: data.description,
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem("esp32-device-config", JSON.stringify(deviceConfig));

      toast.success("Device configured successfully!", {
        description: `ESP32 device "${data.deviceName}" is ready to use`,
      });

      onConfigurationComplete?.(data);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Configuration failed";
      setError(errorMsg);
      toast.error("Configuration failed", {
        description: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestConnection = async () => {
    const deviceIp = form.getValues("deviceIp");

    if (!deviceIp) {
      toast.error("Please enter an IP address first");
      return;
    }

    // Validate IP format
    try {
      z.string().ip().parse(deviceIp);
    } catch {
      toast.error("Please enter a valid IP address");
      return;
    }

    setIsTesting(true);
    setConnectionStatus("testing");

    try {
      const result = await testDeviceConnection(deviceIp);

      if (result.online) {
        setConnectionStatus("online");
        toast.success("Device is online!", {
          description: "ESP32 device responded successfully",
        });
      } else {
        setConnectionStatus("offline");
        toast.error("Device is offline", {
          description: "Could not connect to ESP32 device",
        });
      }
    } catch (err) {
      setConnectionStatus("offline");
      toast.error("Connection test failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case "testing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "offline":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-400" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "testing":
        return "Testing connection...";
      case "online":
        return "Device is online";
      case "offline":
        return "Device is offline";
      default:
        return "Connection not tested";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          ESP32 Device Configuration
        </CardTitle>
        <CardDescription>
          Configure your ESP32 greenhouse device for direct IP-based control. No
          greenhouse association required.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="deviceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Greenhouse ESP32" {...field} />
                  </FormControl>
                  <FormDescription>
                    A friendly name to identify your ESP32 device
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deviceIp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device IP Address</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="192.168.1.100" {...field} />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={isTesting || !field.value}
                      size="icon"
                    >
                      {getConnectionStatusIcon()}
                    </Button>
                  </div>
                  <FormDescription className="flex items-center gap-2">
                    <span>Enter the IP address of your ESP32 device</span>
                    <span className="text-xs">{getConnectionStatusText()}</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Main greenhouse irrigation system"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Additional details about this device
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Configuration
              </Button>

              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Note:</strong> This configuration will be saved locally and
            in the backend.
          </p>
          <p>
            Make sure your ESP32 device is connected to the same network and
            accessible via the provided IP address.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
