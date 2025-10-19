"use client"

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Droplets, AlertTriangle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface IrrigationRecord {
  id: string;
  type: "manual" | "automatic" | "detected";
  waterAmount: number | null;
  notes: string;
  createdAt: string;
  greenhouseId: string;
  moistureIncrease?: number;
}

export default function IrrigationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const irrigationId = searchParams.get("id");

  const [waterAmount, setWaterAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  // Mock data - in real app this would come from API
  const irrigationRecord: IrrigationRecord | null = irrigationId
    ? {
        id: irrigationId,
        type: "detected",
        waterAmount: null,
        notes: "Irrigação detectada automaticamente",
        createdAt: new Date().toISOString(),
        greenhouseId: "greenhouse-1",
        moistureIncrease: 18.5,
      }
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (!waterAmount || parseFloat(waterAmount) <= 0) {
        throw new Error("Por favor, informe a quantidade de água utilizada.");
      }

      // In real app, this would call the API
      const response = await fetch("/api/irrigation/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          irrigationId,
          waterAmount: parseFloat(waterAmount),
          notes: notes || "Irrigação manual confirmada pelo usuário",
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao confirmar irrigação");
      }

      // Redirect back to dashboard or show success message
      router.push("/dashboard?notification=irrigation_confirmed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Mark as not manual irrigation (could be rain)
    router.push("/dashboard?notification=irrigation_skipped");
  };

  if (!irrigationRecord) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Controle de Irrigação
          </h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Irrigação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Aqui será exibido o histórico de irrigações da sua estufa.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Confirmação de Irrigação
        </h2>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Detectamos um possível evento de irrigação. Confirme se foi você quem
          regou as plantas ou se foi chuva.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Irrigação Detectada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Tipo de Detecção</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">Automática</Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Aumento de Umidade</Label>
              <p className="text-sm text-muted-foreground mt-1">
                +{irrigationRecord.moistureIncrease?.toFixed(1)}%
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Data/Hora</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(irrigationRecord.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">Aguardando Confirmação</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Confirmação Manual</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="waterAmount">
                Quantidade de Água Utilizada (litros) *
              </Label>
              <Input
                id="waterAmount"
                type="number"
                step="0.1"
                min="0"
                value={waterAmount}
                onChange={(e) => setWaterAmount(e.target.value)}
                placeholder="Ex: 2.5"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Reguei todas as plantas do canteiro A"
                rows={3}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  "Salvando..."
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar Irrigação Manual
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="flex-1"
              >
                Não foi irrigação manual (chuva)
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
