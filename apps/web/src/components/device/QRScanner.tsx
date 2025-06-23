"use client";

import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Camera, Loader2 } from "lucide-react";

interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  onScanError?: (error: string) => void;
  className?: string;
}

interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  sensors: string[];
  actuators: string[];
  network?: {
    ip?: string;
    mac: string;
    rssi?: number;
    status?: string;
  };
  version?: string;
  timestamp: number;
}

export function QRScanner({
  onScanSuccess,
  onScanError,
  className,
}: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerElementRef = useRef<HTMLDivElement>(null);

  const startScanner = () => {
    setIsScanning(true);
    setError(null);
    setScanResult(null);
    setDeviceInfo(null);

    if (scannerElementRef.current && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "qr-scanner-container",
        {
          fps: 10,
          qrbox: { width: 300, height: 300 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 2,
        },
        false
      );

      scanner.render(
        (decodedText: string) => {
          handleScanSuccess(decodedText);
        },
        (errorMessage: string) => {
          // Only log errors, don't show them to user (too frequent)
          console.log("QR Scan error:", errorMessage);
        }
      );

      scannerRef.current = scanner;
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current
        .clear()
        .then(() => {
          scannerRef.current = null;
          setIsScanning(false);
        })
        .catch((error) => {
          console.error("Error stopping scanner:", error);
          setIsScanning(false);
        });
    } else {
      setIsScanning(false);
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    setIsProcessing(true);
    setScanResult(decodedText);

    try {
      // Parse the QR code data
      const data = JSON.parse(decodedText);

      // Validate it's a device QR code
      if (data.deviceId && data.deviceType === "ESP32_GREENHOUSE") {
        setDeviceInfo(data);
        onScanSuccess(decodedText);
        stopScanner();
      } else {
        throw new Error("Invalid device QR code format");
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Invalid QR code format";
      setError(errorMsg);
      onScanError?.(errorMsg);

      // Don't stop scanner on error, allow retry
      setTimeout(() => {
        setError(null);
        setScanResult(null);
      }, 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setDeviceInfo(null);
    setError(null);
    setIsProcessing(false);
    if (!isScanning) {
      startScanner();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          ESP32 Device Scanner
        </CardTitle>
        <CardDescription>
          Scan the QR code displayed on your ESP32 device to configure it for
          your greenhouse
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isScanning && !scanResult && (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Make sure your ESP32 device is powered on and displaying the QR
              code
            </p>
            <Button onClick={startScanner} className="w-full">
              <Camera className="h-4 w-4 mr-2" />
              Start QR Scanner
            </Button>
          </div>
        )}

        {isScanning && (
          <div className="space-y-4">
            <div
              id="qr-scanner-container"
              ref={scannerElementRef}
              className="border rounded-lg overflow-hidden"
            />
            <div className="flex gap-2">
              <Button
                onClick={stopScanner}
                variant="outline"
                className="flex-1"
              >
                Stop Scanning
              </Button>
              <Button
                onClick={resetScanner}
                variant="outline"
                className="flex-1"
              >
                Reset
              </Button>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Processing QR code...</span>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {deviceInfo && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Device detected successfully!</p>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Device ID:</strong> {deviceInfo.deviceId}
                  </p>
                  <p>
                    <strong>Name:</strong> {deviceInfo.deviceName}
                  </p>
                  <p>
                    <strong>Sensors:</strong> {deviceInfo.sensors.join(", ")}
                  </p>
                  <p>
                    <strong>Actuators:</strong>{" "}
                    {deviceInfo.actuators.join(", ")}
                  </p>
                  {deviceInfo.network?.ip && (
                    <p>
                      <strong>IP Address:</strong> {deviceInfo.network.ip}
                    </p>
                  )}
                  <p>
                    <strong>MAC Address:</strong> {deviceInfo.network?.mac}
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {deviceInfo && (
          <div className="flex gap-2">
            <Button onClick={resetScanner} variant="outline" className="flex-1">
              Scan Another Device
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
