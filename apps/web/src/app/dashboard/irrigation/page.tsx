"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Droplets, AlertTriangle, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface IrrigationRecord {
  id: string;
  type: "manual" | "automatic" | "detected" | "rain";
  waterAmount: number | null;
  notes: string;
  createdAt: string;
  greenhouseId: string;
  moistureIncrease?: number;
  greenhouse?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
  };
}

interface IrrigationListProps {
  irrigations: IrrigationRecord[];
  loading: boolean;
  error: string | null;
}

function IrrigationList({ irrigations, loading, error }: IrrigationListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (irrigations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Droplets className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma irrigação registrada ainda.</p>
        <p className="text-sm mt-1">
          As irrigações aparecerão aqui quando detectadas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {irrigations.map((irrigation) => (
        <Card key={irrigation.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                Irrigação{" "}
                {irrigation.type === "manual"
                  ? "Manual"
                  : irrigation.type === "automatic"
                    ? "Automática"
                    : irrigation.type === "detected"
                      ? "Detectada"
                      : "Chuva"}
              </CardTitle>
              <Badge
                variant={
                  irrigation.type === "manual"
                    ? "default"
                    : irrigation.type === "automatic"
                      ? "secondary"
                      : irrigation.type === "detected"
                        ? "destructive"
                        : "outline"
                }
              >
                {irrigation.type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Data:</span>
                <span className="ml-2 text-muted-foreground">
                  {new Date(irrigation.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>
              {irrigation.waterAmount && (
                <div>
                  <span className="font-medium">Quantidade:</span>
                  <span className="ml-2 text-muted-foreground">
                    {irrigation.waterAmount}L
                  </span>
                </div>
              )}
              {irrigation.greenhouse && (
                <div>
                  <span className="font-medium">Estufa:</span>
                  <span className="ml-2 text-muted-foreground">
                    {irrigation.greenhouse.name}
                  </span>
                </div>
              )}
              {irrigation.user && (
                <div>
                  <span className="font-medium">Usuário:</span>
                  <span className="ml-2 text-muted-foreground">
                    {irrigation.user.name}
                  </span>
                </div>
              )}
            </div>
            {irrigation.notes && (
              <div className="mt-4">
                <span className="font-medium">Observações:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {irrigation.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function IrrigationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const irrigationId = searchParams.get("id");

  const [irrigations, setIrrigations] = useState<IrrigationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIrrigations();
  }, []);

  const fetchIrrigations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/irrigation?limit=20");
      if (!response.ok) {
        throw new Error("Falha ao carregar irrigações");
      }
      const data = await response.json();
      setIrrigations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Controle de Irrigação
        </h2>
        <Button onClick={fetchIrrigations} variant="outline" size="sm">
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Irrigação</CardTitle>
        </CardHeader>
        <CardContent>
          <IrrigationList
            irrigations={irrigations}
            loading={loading}
            error={error}
          />
        </CardContent>
      </Card>
    </div>
  );
}
