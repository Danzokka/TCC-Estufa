"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Droplets, Power, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PumpStatus {
  id: string;
  greenhouseId: string;
  isActive: boolean;
  remainingTime?: number;
  targetWaterAmount?: number;
  currentWaterAmount?: number;
  startedAt?: Date;
  estimatedEndTime?: Date;
  reason?: string;
}

interface PumpControlPanelProps {
  greenhouseId: string;
  initialStatus?: PumpStatus;
  onStatusChange?: (status: PumpStatus) => void;
}

export function PumpControlPanel({
  greenhouseId,
  initialStatus,
  onStatusChange,
}: PumpControlPanelProps) {
  const [status, setStatus] = useState<PumpStatus | null>(
    initialStatus || null
  );
  const [duration, setDuration] = useState<number>(30);
  const [waterAmount, setWaterAmount] = useState<number | undefined>();
  const [reason, setReason] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activatePump = async () => {
    if (!greenhouseId) {
      setError("Greenhouse ID is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/pump/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          greenhouseId,
          duration,
          waterAmount: waterAmount || undefined,
          reason: reason || "Manual activation",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to activate pump");
      }

      const newStatus: PumpStatus = await response.json();
      setStatus(newStatus);
      onStatusChange?.(newStatus);
      toast.success(`Water pump is now running for ${duration} seconds`);

      // Start polling for status updates
      pollPumpStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const stopPump = async () => {
    if (!greenhouseId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pump/stop/${greenhouseId}`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to stop pump");
      }

      const newStatus: PumpStatus = await response.json();
      setStatus(newStatus);
      onStatusChange?.(newStatus);
      toast.success("Water pump has been stopped");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const pollPumpStatus = async () => {
    try {
      const response = await fetch(`/api/pump/status/${greenhouseId}`);
      if (response.ok) {
        const currentStatus: PumpStatus = await response.json();
        setStatus(currentStatus);
        onStatusChange?.(currentStatus);

        // Continue polling if pump is still active
        if (currentStatus.isActive) {
          setTimeout(pollPumpStatus, 2000); // Poll every 2 seconds
        }
      }
    } catch (err) {
      console.error("Failed to poll pump status:", err);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5" />
          Water Pump Control
        </CardTitle>
        <CardDescription>
          Control and monitor the water pump for greenhouse {greenhouseId}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Current Status</Label>
          <div className="flex items-center gap-2">
            <Badge variant={status?.isActive ? "default" : "secondary"}>
              {status?.isActive ? "Active" : "Inactive"}
            </Badge>
            {status?.isActive && status.remainingTime && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(status.remainingTime)}
              </Badge>
            )}
          </div>

          {status?.reason && (
            <p className="text-sm text-muted-foreground">
              Reason: {status.reason}
            </p>
          )}

          {status?.targetWaterAmount && (
            <p className="text-sm text-muted-foreground">
              Target: {status.targetWaterAmount}L
              {status.currentWaterAmount &&
                ` | Current: ${status.currentWaterAmount}L`}
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Control Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={1}
                max={3600}
                disabled={status?.isActive || isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="waterAmount">Water Amount (L) - Optional</Label>
              <Input
                id="waterAmount"
                type="number"
                step="0.1"
                value={waterAmount || ""}
                onChange={(e) =>
                  setWaterAmount(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                min={0.1}
                max={100}
                disabled={status?.isActive || isLoading}
                placeholder="e.g., 2.5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setReason(e.target.value)
              }
              disabled={status?.isActive || isLoading}
              placeholder="e.g., Manual watering, Daily schedule"
              rows={2}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={activatePump}
            disabled={status?.isActive || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Power className="h-4 w-4 mr-2" />
            )}
            Activate Pump
          </Button>

          <Button
            onClick={stopPump}
            variant="outline"
            disabled={!status?.isActive || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Power className="h-4 w-4 mr-2" />
            )}
            Stop Pump
          </Button>
        </div>

        {/* Additional Info */}
        {status?.startedAt && (
          <div className="text-sm text-muted-foreground">
            Started at: {new Date(status.startedAt).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
