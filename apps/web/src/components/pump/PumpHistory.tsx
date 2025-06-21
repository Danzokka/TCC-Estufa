"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Clock,
  Droplets,
  AlertCircle,
  CheckCircle,
  XCircle,
  PlayCircle,
} from "lucide-react";

interface PumpHistoryItem {
  id: string;
  greenhouseId: string;
  duration: number;
  waterAmount?: number;
  reason?: string;
  startedAt: Date;
  endedAt?: Date;
  status: "active" | "completed" | "cancelled" | "error";
  errorMessage?: string;
}

interface PumpHistoryProps {
  greenhouseId: string;
  maxItems?: number;
  autoRefresh?: boolean;
}

export function PumpHistory({
  greenhouseId,
  maxItems = 20,
  autoRefresh = false,
}: PumpHistoryProps) {
  const [history, setHistory] = useState<PumpHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchHistory = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/pump/history/${greenhouseId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch pump history");
      }

      const data: PumpHistoryItem[] = await response.json();
      setHistory(data.slice(0, maxItems));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to fetch pump history:", err);
    } finally {
      setIsLoading(false);
    }
  }, [greenhouseId, maxItems]);

  useEffect(() => {
    fetchHistory();

    if (autoRefresh) {
      const interval = setInterval(fetchHistory, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchHistory, autoRefresh]);

  const getStatusIcon = (status: PumpHistoryItem["status"]) => {
    switch (status) {
      case "active":
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: PumpHistoryItem["status"]) => {
    switch (status) {
      case "active":
        return "default";
      case "completed":
        return "secondary";
      case "cancelled":
        return "outline";
      case "error":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  };

  const calculateActualDuration = (startedAt: Date, endedAt?: Date): number => {
    const start = new Date(startedAt);
    const end = endedAt ? new Date(endedAt) : new Date();
    return Math.floor((end.getTime() - start.getTime()) / 1000);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pump History
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading history...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pump History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <Button
            onClick={fetchHistory}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pump History
            </CardTitle>
            <CardDescription>
              Recent pump operations for greenhouse {greenhouseId}
            </CardDescription>
          </div>
          <Button
            onClick={fetchHistory}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Refresh"
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Droplets className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pump operations recorded yet</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={item.id}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(item.status)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(item.startedAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Duration: {formatDuration(item.duration)}
                          </span>

                          {item.waterAmount && (
                            <span className="flex items-center gap-1">
                              <Droplets className="h-3 w-3" />
                              Target: {item.waterAmount}L
                            </span>
                          )}
                        </div>

                        {item.endedAt && item.status !== "active" && (
                          <div className="text-sm text-muted-foreground">
                            Actual runtime:{" "}
                            {formatDuration(
                              calculateActualDuration(
                                item.startedAt,
                                item.endedAt
                              )
                            )}
                          </div>
                        )}

                        {item.reason && (
                          <div className="text-sm text-muted-foreground">
                            Reason: {item.reason}
                          </div>
                        )}

                        {item.errorMessage && (
                          <div className="text-sm text-red-600">
                            Error: {item.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {index < history.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
