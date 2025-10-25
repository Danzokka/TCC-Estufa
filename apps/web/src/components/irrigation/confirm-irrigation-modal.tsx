"use client";

import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { confirmIrrigation } from "@/server/actions/irrigation";
import { toast } from "sonner";
import { Droplet, Cloud } from "lucide-react";

interface ConfirmIrrigationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  irrigationId: string;
  onConfirmed?: () => void;
}

export function ConfirmIrrigationModal({
  open,
  onOpenChange,
  irrigationId,
  onConfirmed,
}: ConfirmIrrigationModalProps) {
  const [irrigationType, setIrrigationType] = useState<"manual" | "rain">(
    "manual"
  );
  const [waterAmount, setWaterAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await confirmIrrigation(irrigationId, {
        type: irrigationType,
        waterAmount:
          irrigationType === "manual" ? Number(waterAmount) : undefined,
        notes: notes || undefined,
      });

      toast.success("Irrigação confirmada com sucesso!");
      onOpenChange(false);
      onConfirmed?.();

      // Resetar formulário
      setIrrigationType("manual");
      setWaterAmount("");
      setNotes("");
    } catch (error) {
      console.error("Error confirming irrigation:", error);
      toast.error("Falha ao confirmar irrigação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Resetar formulário
    setIrrigationType("manual");
    setWaterAmount("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Confirmar Irrigação Detectada</DialogTitle>
          <DialogDescription>
            Uma irrigação foi detectada automaticamente. Por favor, confirme os
            detalhes para registrar corretamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Tipo de Irrigação */}
            <div className="space-y-3">
              <Label htmlFor="type" className="text-base font-medium">
                Como ocorreu a irrigação?
              </Label>
              <RadioGroup
                value={irrigationType}
                onValueChange={(value) =>
                  setIrrigationType(value as "manual" | "rain")
                }
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent transition-colors">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label
                    htmlFor="manual"
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <Droplet className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">Irrigação Manual</div>
                      <div className="text-sm text-muted-foreground">
                        Você regou a planta manualmente
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent transition-colors">
                  <RadioGroupItem value="rain" id="rain" />
                  <Label
                    htmlFor="rain"
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <Cloud className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium">Chuva</div>
                      <div className="text-sm text-muted-foreground">
                        A chuva irrigou naturalmente
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Quantidade de Água (apenas para manual) */}
            {irrigationType === "manual" && (
              <div className="space-y-2">
                <Label htmlFor="waterAmount">
                  Quantidade de Água (ml){" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="waterAmount"
                  type="number"
                  placeholder="Ex: 500"
                  value={waterAmount}
                  onChange={(e) => setWaterAmount(e.target.value)}
                  min="1"
                  max="10000"
                  required
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Informe aproximadamente quantos ml de água foram utilizados
                </p>
              </div>
            )}

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Adicione detalhes sobre esta irrigação..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Confirmando..." : "Confirmar Irrigação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
