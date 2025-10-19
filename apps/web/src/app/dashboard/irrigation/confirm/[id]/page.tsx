"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";

interface IrrigationData {
  id: string;
  type: string;
  notes: string;
  moistureIncrease?: number;
  previousMoisture?: number;
  currentMoisture?: number;
  timestamp: string;
}

export default function ConfirmIrrigationPage() {
  const params = useParams();
  const router = useRouter();
  const [irrigationData, setIrrigationData] = useState<IrrigationData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [irrigationType, setIrrigationType] = useState<"manual" | "rain">(
    "manual"
  );
  const [waterAmount, setWaterAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (params.id) {
      fetchIrrigationData(params.id as string);
    }
  }, [params.id]);

  const fetchIrrigationData = async (id: string) => {
    try {
      const response = await fetch(`/api/irrigation/${id}`);
      if (!response.ok) {
        throw new Error("Falha ao carregar dados da irrigação");
      }
      const data = await response.json();
      setIrrigationData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/irrigation/confirm", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          irrigationId: params.id,
          waterAmount:
            irrigationType === "manual" ? parseFloat(waterAmount) : null,
          notes:
            notes ||
            (irrigationType === "rain"
              ? "Irrigação por chuva"
              : "Irrigação manual confirmada"),
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao confirmar irrigação");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/irrigation");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error && !irrigationData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h1 className="text-2xl font-bold text-green-700">
            Irrigação Confirmada!
          </h1>
          <p className="text-gray-600">
            Redirecionando para a página de irrigação...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirmação de Irrigação Detectada
          </CardTitle>
          <CardDescription>
            Detectamos um aumento significativo na umidade do solo. Confirme se
            foi uma irrigação manual ou chuva.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {irrigationData && (
            <div className="space-y-6">
              {/* Detalhes da detecção */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-800 mb-2">
                  Detalhes da Detecção
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Aumento de Umidade:</span>
                    <span className="ml-2 text-amber-700">
                      {irrigationData.moistureIncrease?.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Umidade Anterior:</span>
                    <span className="ml-2 text-amber-700">
                      {irrigationData.previousMoisture?.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Umidade Atual:</span>
                    <span className="ml-2 text-amber-700">
                      {irrigationData.currentMoisture?.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Detectado em:</span>
                    <span className="ml-2 text-amber-700">
                      {new Date(irrigationData.timestamp).toLocaleString(
                        "pt-BR"
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Formulário de confirmação */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    Tipo de Irrigação
                  </Label>
                  <RadioGroup
                    value={irrigationType}
                    onValueChange={(value) =>
                      setIrrigationType(value as "manual" | "rain")
                    }
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manual" id="manual" />
                      <Label htmlFor="manual" className="cursor-pointer">
                        Irrigação Manual (eu reguei)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="rain" id="rain" />
                      <Label htmlFor="rain" className="cursor-pointer">
                        Chuva Natural
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {irrigationType === "manual" && (
                  <div className="space-y-2">
                    <Label htmlFor="waterAmount">
                      Quantidade de Água (litros)
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
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Adicione observações sobre a irrigação..."
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      submitting ||
                      (irrigationType === "manual" && !waterAmount)
                    }
                    className="flex-1"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Confirmando...
                      </>
                    ) : (
                      "Confirmar Irrigação"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
