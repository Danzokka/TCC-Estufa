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
} from "lucide-react";
import { toast } from "sonner";
import {
  activatePump,
  stopPump,
  getPumpStatus,
  type PumpStatus,
} from "@/server/actions/pump";
import Link from "next/link";

interface PumpQuickControlProps {
  greenhouseId: string;
  onStatusChange?: (status: PumpStatus | null) => void;
}

export function PumpQuickControl({
  greenhouseId,
  onStatusChange,
}: PumpQuickControlProps) {
  const [status, setStatus] = useState<PumpStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Polling interval for active pump status
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const result = await getPumpStatus(greenhouseId);
        if (result.success && result.data) {
          setStatus(result.data);
          onStatusChange?.(result.data);
        } else {
          setStatus(null);
          onStatusChange?.(null);
        }
      } catch (err) {
        console.error("Failed to poll pump status:", err);
      }
    };

    // Initial load
    pollStatus();

    // Set up polling if pump is active
    if (status?.isActive) {
      interval = setInterval(pollStatus, 3000); // Poll every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [greenhouseId, status?.isActive, onStatusChange]);

  const handleQuickActivate = async (duration: number) => {
    if (!greenhouseId) {
      setError("Greenhouse ID is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await activatePump({
        greenhouseId,
        duration,
        notes: `Quick activation - ${duration}s`,
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success(`💧 Bomba ativada por ${duration} segundos`, {
        description: "O ESP32 está exibindo o status no OLED",
      });

      // Refresh status immediately
      const statusResult = await getPumpStatus(greenhouseId);
      if (statusResult.success && statusResult.data) {
        setStatus(statusResult.data);
        onStatusChange?.(statusResult.data);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      toast.error(`❌ Erro: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopPump = async () => {
    if (!greenhouseId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await stopPump(greenhouseId);

      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success("🛑 Bomba parada com sucesso");

      // Refresh status
      const statusResult = await getPumpStatus(greenhouseId);
      if (statusResult.success && statusResult.data) {
        setStatus(statusResult.data);
        onStatusChange?.(statusResult.data);
      } else {
        setStatus(null);
        onStatusChange?.(null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
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

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            Controle de Irrigação
          </div>
          <Link href="/pump">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {" "}
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant={status?.isActive ? "default" : "secondary"}
              className={`${status?.isActive ? "bg-green-500 animate-pulse" : ""} flex items-center gap-1`}
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

          {status?.targetWaterAmount && (
            <div className="text-sm text-muted-foreground">
              💧 Meta: {status.targetWaterAmount}L
            </div>
          )}
        </div>
        {/* Progress Bar for Active Pump */}
        {status?.isActive &&
          status.remainingTime &&
          status.targetWaterAmount && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>
                  {status.currentWaterAmount || 0}L / {status.targetWaterAmount}
                  L
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      ((status.currentWaterAmount || 0) /
                        status.targetWaterAmount) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {/* Quick Control Buttons */}
        <div className="space-y-3">
          {!status?.isActive ? (
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => handleQuickActivate(30)}
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
              disabled={isLoading}
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
        </div>
        {/* Status Info */}
        {status?.notes && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            <strong>Motivo:</strong> {status.notes}
          </div>
        )}
        {status?.startTime && (
          <div className="text-xs text-muted-foreground">
            <strong>Iniciado:</strong>{" "}
            {new Date(status.startTime).toLocaleTimeString()}
          </div>
        )}
        {/* ESP32 Status Indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>ESP32 conectado • Status exibido no OLED</span>
        </div>
      </CardContent>
    </Card>
  );
}
