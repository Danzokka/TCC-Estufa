"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { PlayIcon, StopIcon, WifiIcon } from "@heroicons/react/24/outline";

interface DeviceConfig {
  deviceName: string;
  deviceIp: string;
  description?: string;
}

interface PumpStatus {
  isActive: boolean;
  remainingTime?: number;
  targetWaterAmount?: number;
  currentWaterAmount?: number;
  startedAt?: Date;
}

interface SimplePumpControlProps {
  deviceConfig?: DeviceConfig;
  onStatusChange?: (status: PumpStatus) => void;
}

const STORAGE_KEY = "pump_device_config";

export function SimplePumpControl({
  deviceConfig,
  onStatusChange,
}: SimplePumpControlProps) {
  const [config, setConfig] = useState<DeviceConfig | null>(
    deviceConfig || null
  );
  const [duration, setDuration] = useState(30); // seconds
  const [waterAmount, setWaterAmount] = useState(1); // liters
  const [isActivating, setIsActivating] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [pumpStatus, setPumpStatus] = useState<PumpStatus>({ isActive: false });
  const [reason, setReason] = useState("Manual");

  // Load saved configuration on mount
  useEffect(() => {
    if (!config) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsedConfig = JSON.parse(saved);
          setConfig(parsedConfig);
        } catch (error) {
          console.error("Error loading saved config:", error);
        }
      }
    }
  }, [config]);
  // Auto-refresh status every 5 seconds when pump is active
  useEffect(() => {
    if (!config || !pumpStatus.isActive) return;

    const checkStatus = async () => {
      if (!config?.deviceIp) return;

      setIsCheckingStatus(true);

      try {
        const response = await fetch(
          `http://${config.deviceIp}:8080/pump/status`,
          {
            method: "GET",
            mode: "cors",
            signal: AbortSignal.timeout(5000),
          }
        );

        if (response.ok) {
          const deviceStatus = await response.json();
          const status: PumpStatus = {
            isActive: deviceStatus.status === "on",
            remainingTime: deviceStatus.remaining_seconds,
            targetWaterAmount: deviceStatus.target_volume,
            currentWaterAmount: deviceStatus.current_volume,
            startedAt: deviceStatus.start_time
              ? new Date(deviceStatus.start_time)
              : undefined,
          };

          setPumpStatus(status);
          onStatusChange?.(status);
        }
      } catch (error) {
        console.error("Error checking pump status:", error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [config, pumpStatus.isActive, onStatusChange]);

  const checkPumpStatus = async () => {
    if (!config?.deviceIp) return;

    setIsCheckingStatus(true);

    try {
      const response = await fetch(
        `http://${config.deviceIp}:8080/pump/status`,
        {
          method: "GET",
          mode: "cors",
          signal: AbortSignal.timeout(5000),
        }
      );

      if (response.ok) {
        const deviceStatus = await response.json();
        const status: PumpStatus = {
          isActive: deviceStatus.status === "on",
          remainingTime: deviceStatus.remaining_seconds,
          targetWaterAmount: deviceStatus.target_volume,
          currentWaterAmount: deviceStatus.current_volume,
          startedAt: deviceStatus.start_time
            ? new Date(deviceStatus.start_time)
            : undefined,
        };

        setPumpStatus(status);
        onStatusChange?.(status);
      }
    } catch (error) {
      console.error("Error checking pump status:", error);
      toast.error("Erro ao verificar status da bomba");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const activatePump = async () => {
    if (!config?.deviceIp) {
      toast.error("Configure o IP do dispositivo primeiro");
      return;
    }

    setIsActivating(true);

    try {
      // Send activation command directly to ESP32
      const response = await fetch(
        `http://${config.deviceIp}:8080/pump/activate`,
        {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            duration,
            volume: waterAmount,
          }),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (response.ok) {
        toast.success(`Bomba ativada por ${duration} segundos`);
        setPumpStatus({
          isActive: true,
          remainingTime: duration,
          targetWaterAmount: waterAmount,
          startedAt: new Date(),
        });
        onStatusChange?.({
          isActive: true,
          remainingTime: duration,
          targetWaterAmount: waterAmount,
          startedAt: new Date(),
        });
      } else {
        toast.error("Erro ao ativar bomba - dispositivo não respondeu");
      }
    } catch (error) {
      console.error("Error activating pump:", error);
      toast.error(
        "Erro ao comunicar com o dispositivo. Verifique se está online."
      );
    } finally {
      setIsActivating(false);
    }
  };

  const stopPump = async () => {
    if (!config?.deviceIp) return;

    setIsStopping(true);

    try {
      const response = await fetch(
        `http://${config.deviceIp}:8080/pump/deactivate`,
        {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (response.ok) {
        toast.success("Bomba parada com sucesso");
        setPumpStatus({ isActive: false });
        onStatusChange?.({ isActive: false });
      } else {
        toast.error("Erro ao parar bomba");
      }
    } catch (error) {
      console.error("Error stopping pump:", error);
      toast.error("Erro ao comunicar com o dispositivo");
    } finally {
      setIsStopping(false);
    }
  };

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Controle da Bomba</CardTitle>
          <CardDescription>
            Configure o IP do dispositivo ESP32 para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum dispositivo configurado. Use o formulário de configuração
            acima.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Controle da Bomba</span>
          <div className="flex items-center gap-2 text-sm">
            <div
              className={`w-2 h-2 rounded-full ${pumpStatus.isActive ? "bg-green-500" : "bg-gray-400"}`}
            />
            {pumpStatus.isActive ? "Ativa" : "Inativa"}
          </div>
        </CardTitle>
        <CardDescription>
          {config.deviceName} - {config.deviceIp}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pumpStatus.isActive && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800">Bomba Ativa</p>
            {pumpStatus.remainingTime && (
              <p className="text-sm text-blue-600">
                Tempo restante: {Math.floor(pumpStatus.remainingTime / 60)}m{" "}
                {pumpStatus.remainingTime % 60}s
              </p>
            )}
            {pumpStatus.targetWaterAmount && (
              <p className="text-sm text-blue-600">
                Volume: {pumpStatus.targetWaterAmount}L
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Duração (segundos)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="300"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
              disabled={pumpStatus.isActive}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="waterAmount">Volume (litros)</Label>
            <Input
              id="waterAmount"
              type="number"
              min="0.1"
              step="0.1"
              value={waterAmount}
              onChange={(e) => setWaterAmount(parseFloat(e.target.value) || 1)}
              disabled={pumpStatus.isActive}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Motivo</Label>
          <Input
            id="reason"
            placeholder="Manual, automático, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={pumpStatus.isActive}
          />
        </div>

        <div className="flex gap-2">
          {!pumpStatus.isActive ? (
            <Button
              onClick={activatePump}
              disabled={isActivating}
              className="flex-1"
            >
              {isActivating ? (
                <WifiIcon className="mr-2 h-4 w-4 animate-pulse" />
              ) : (
                <PlayIcon className="mr-2 h-4 w-4" />
              )}
              {isActivating ? "Ativando..." : "Ativar Bomba"}
            </Button>
          ) : (
            <Button
              onClick={stopPump}
              disabled={isStopping}
              variant="destructive"
              className="flex-1"
            >
              {isStopping ? (
                <WifiIcon className="mr-2 h-4 w-4 animate-pulse" />
              ) : (
                <StopIcon className="mr-2 h-4 w-4" />
              )}
              {isStopping ? "Parando..." : "Parar Bomba"}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={checkPumpStatus}
            disabled={isCheckingStatus}
          >
            {isCheckingStatus ? (
              <WifiIcon className="h-4 w-4 animate-pulse" />
            ) : (
              <WifiIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
