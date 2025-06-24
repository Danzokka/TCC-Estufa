"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useDeviceConfig } from "@/hooks/useDeviceConfig";
import Link from "next/link";

interface SimplePumpQuickControlProps {
  onStatusChange?: (status: SimpleDeviceStatus | null) => void;
}

export function SimplePumpQuickControl({
  onStatusChange,
}: SimplePumpQuickControlProps) {
  const { deviceConfig } = useDeviceConfig();
  const [status, setStatus] = useState<SimpleDeviceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  // Check if device IP is configured
  const deviceIp = deviceConfig?.deviceIp;
  const hasDeviceConfig = !!deviceIp;

  // Polling interval for active pump status
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const pollStatus = async () => {
      if (!deviceIp) return;

      try {
        const result = await getSimpleDeviceStatus(deviceIp);
        if (result.success && result.data) {
          setStatus(result.data);
          setIsOnline(true);
          onStatusChange?.(result.data);
        } else {
          setStatus(null);
          setIsOnline(false);
          onStatusChange?.(null);
        }
      } catch (err) {
        console.error("Failed to poll device status:", err);
        setIsOnline(false);
        setStatus(null);
      }
    };

    // Initial load
    if (deviceIp) {
      pollStatus();
    }

    // Set up polling if pump is active or we want to keep checking device status
    if (deviceIp && (status?.isActive || isOnline === null)) {
      interval = setInterval(pollStatus, 5000); // Poll every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [deviceIp, status?.isActive, onStatusChange, isOnline]);

  const handleQuickActivate = async (duration: number) => {
    if (!deviceIp) {
      setError("Device IP is not configured");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await activateSimplePump({
        deviceIp,
        duration,
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success(`💧 Bomba ativada por ${duration} segundos`, {
        description: "O ESP32 está exibindo o status no OLED",
      }); // Refresh status immediately
      const statusResult = await getSimpleDeviceStatus(deviceIp);
      if (statusResult.success && statusResult.data) {
        setStatus(statusResult.data);
        setIsOnline(true);
        onStatusChange?.(statusResult.data);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      setIsOnline(false);
      toast.error(`❌ Erro: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopPump = async () => {
    if (!deviceIp) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await stopSimplePump(deviceIp);

      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success("🛑 Bomba parada com sucesso"); // Refresh status
      const statusResult = await getSimpleDeviceStatus(deviceIp);
      if (statusResult.success && statusResult.data) {
        setStatus(statusResult.data);
        setIsOnline(true);
        onStatusChange?.(statusResult.data);
      } else {
        setStatus(null);
        setIsOnline(false);
        onStatusChange?.(null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      setIsOnline(false);
      toast.error(`❌ Erro: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // If no device is configured, show setup prompt
  if (!hasDeviceConfig) {
    return (
      <Card className="w-full border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-orange-800">
            <Droplets className="h-5 w-5" />
            Controle de Irrigação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              Configure o IP do seu dispositivo ESP32 para controlar a bomba de
              irrigação.
            </AlertDescription>
          </Alert>
          <Link href="/device">
            <Button className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Configurar Dispositivo
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            Controle de Irrigação
          </div>
          <div className="flex items-center gap-2">
            {/* Device connection indicator */}
            <div className="flex items-center gap-1 text-xs">
              {isOnline === true ? (
                <>
                  <Wifi className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">Online</span>
                </>
              ) : isOnline === false ? (
                <>
                  <WifiOff className="h-3 w-3 text-red-500" />
                  <span className="text-red-600">Offline</span>
                </>
              ) : (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                  <span className="text-gray-600">Verificando...</span>
                </>
              )}
            </div>
            <Link href="/device">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Device IP Info */}
        <div className="text-xs text-muted-foreground border rounded-md p-2 bg-gray-50">
          <strong>Dispositivo:</strong> {deviceIp}
        </div>
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant={status?.isActive ? "default" : "secondary"}
              className={`${
                status?.isActive ? "bg-green-500 animate-pulse" : ""
              } flex items-center gap-1`}
            >
              {status?.isActive ? (
                <>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  Ativa
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Inativa
                </>
              )}
            </Badge>
            {status?.isActive && status.remainingTime && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(status.remainingTime)}
              </Badge>
            )}
          </div>
        </div>
        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {/* Offline Warning */}
        {isOnline === false && (
          <Alert variant="destructive">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Dispositivo offline. Verifique a conexão WiFi do ESP32.
            </AlertDescription>
          </Alert>
        )}
        {/* Quick Control Buttons */}
        <div className="space-y-3">
          {!status?.isActive ? (
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => handleQuickActivate(30)}
                disabled={isLoading || isOnline === false}
                size="sm"
                className="text-xs"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "30s"
                )}
              </Button>
              <Button
                onClick={() => handleQuickActivate(60)}
                disabled={isLoading || isOnline === false}
                size="sm"
                className="text-xs"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "1 min"
                )}
              </Button>
              <Button
                onClick={() => handleQuickActivate(180)}
                disabled={isLoading || isOnline === false}
                size="sm"
                className="text-xs"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "3 min"
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleStopPump}
              variant="destructive"
              disabled={isLoading || isOnline === false}
              className="w-full"
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Parando...
                </>
              ) : (
                <>
                  <Power className="h-4 w-4 mr-2" />
                  Parar Irrigação
                </>
              )}
            </Button>
          )}
        </div>{" "}
        {/* Status Info */}
        {status?.startedAt && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            <strong>Iniciado:</strong>{" "}
            {new Date(status.startedAt).toLocaleTimeString()}
          </div>
        )}
        {/* ESP32 Status Indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isOnline === true
                ? "bg-green-500"
                : isOnline === false
                  ? "bg-red-500"
                  : "bg-gray-400"
            }`}
          ></div>
          <span>
            {isOnline === true
              ? "ESP32 conectado • Status exibido no OLED"
              : isOnline === false
                ? "ESP32 desconectado"
                : "Verificando conexão..."}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
