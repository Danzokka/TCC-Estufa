"use client";

import { useState } from "react";
import { QRScanner } from "@/components/device/QRScanner";
import { DeviceConfigurator } from "@/components/device/DeviceConfigurator";
import { configureGreenhouseDevice } from "@/server/actions/device-config";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle, Smartphone } from "lucide-react";
import Link from "next/link";

type ConfigurationStep = "scan" | "configure" | "success" | "error";

interface ConfigurationResult {
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

export default function DeviceConfigurationPage() {
  const [currentStep, setCurrentStep] = useState<ConfigurationStep>("scan");
  const [scannedData, setScannedData] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ConfigurationResult | null>(null);

  const handleScanSuccess = (data: string) => {
    console.log("QR Scan successful:", data);
    setScannedData(data);
    setCurrentStep("configure");
  };

  const handleScanError = (error: string) => {
    console.error("QR Scan error:", error);
    // Could show a toast notification here
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleConfiguration = async (config: any) => {
    setIsSubmitting(true);

    try {
      const result = await configureGreenhouseDevice(config);
      setResult(result);

      if (result.success) {
        setCurrentStep("success");
      } else {
        setCurrentStep("error");
      }
    } catch (error) {
      console.error("Configuration error:", error);
      setResult({
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
      setCurrentStep("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setCurrentStep("scan");
    setScannedData("");
    setResult(null);
  };

  const resetConfiguration = () => {
    setCurrentStep("scan");
    setScannedData("");
    setResult(null);
    setIsSubmitting(false);
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">ESP32 Device Configuration</h1>
            <p className="text-muted-foreground">
              Set up your ESP32 greenhouse monitoring device
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mt-6">
          <div
            className={`flex items-center gap-2 ${currentStep === "scan" ? "text-primary" : currentStep === "configure" || currentStep === "success" ? "text-green-600" : "text-muted-foreground"}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === "scan" ? "bg-primary text-primary-foreground" : currentStep === "configure" || currentStep === "success" ? "bg-green-600 text-white" : "bg-muted"}`}
            >
              1
            </div>
            <span className="font-medium">Scan QR Code</span>
          </div>

          <div className="h-px bg-border flex-1" />

          <div
            className={`flex items-center gap-2 ${currentStep === "configure" ? "text-primary" : currentStep === "success" ? "text-green-600" : "text-muted-foreground"}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === "configure" ? "bg-primary text-primary-foreground" : currentStep === "success" ? "bg-green-600 text-white" : "bg-muted"}`}
            >
              2
            </div>
            <span className="font-medium">Configure Device</span>
          </div>

          <div className="h-px bg-border flex-1" />

          <div
            className={`flex items-center gap-2 ${currentStep === "success" ? "text-green-600" : "text-muted-foreground"}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === "success" ? "bg-green-600 text-white" : "bg-muted"}`}
            >
              {currentStep === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                "3"
              )}
            </div>
            <span className="font-medium">Complete</span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="space-y-6">
        {/* Step 1: QR Scanner */}
        {currentStep === "scan" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <QRScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
            />

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Setup Instructions
                </CardTitle>
                <CardDescription>
                  Follow these steps to prepare your ESP32 device
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Power on your ESP32 device</p>
                      <p className="text-sm text-muted-foreground">
                        Connect the device to power and wait for it to boot up
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Wait for QR code display</p>
                      <p className="text-sm text-muted-foreground">
                        The device will show a QR code on its OLED display when
                        ready for configuration
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Scan the QR code</p>
                      <p className="text-sm text-muted-foreground">
                        Use the scanner on the left to capture the QR code from
                        your device
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Troubleshooting</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>
                      • Make sure the device is powered on and the display is
                      clear
                    </li>
                    <li>
                      • Hold your camera steady and at an appropriate distance
                    </li>
                    <li>
                      • If no QR code appears, try pressing the configuration
                      button on the device
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Device Configuration */}
        {currentStep === "configure" && (
          <DeviceConfigurator
            deviceData={scannedData}
            onConfigurationComplete={handleConfiguration}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Step 3: Success */}
        {currentStep === "success" && result && (
          <Card>
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">
                  Configuration Successful!
                </h2>
                <p className="text-muted-foreground">{result.message}</p>
              </div>

              {result.greenhouse && result.device && (
                <div className="bg-green-50 p-4 rounded-lg space-y-2">
                  <h3 className="font-medium">Configuration Details</h3>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Device:</strong> {result.device.name}
                    </p>
                    <p>
                      <strong>Greenhouse:</strong> {result.greenhouse.name}
                    </p>
                    <p>
                      <strong>Status:</strong> Device is now connecting to WiFi
                      and will begin monitoring
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <Link href="/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
                <Button variant="outline" onClick={resetConfiguration}>
                  Configure Another Device
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {currentStep === "error" && result && (
          <Card>
            <CardContent className="p-8 text-center space-y-6">
              <Alert variant="destructive">
                <AlertDescription className="text-center">
                  <strong>Configuration Failed</strong>
                  <br />
                  {result.message}
                </AlertDescription>
              </Alert>

              <div className="flex gap-4 justify-center">
                <Button onClick={resetConfiguration}>Try Again</Button>
                <Button variant="outline" onClick={handleCancel}>
                  Back to Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
