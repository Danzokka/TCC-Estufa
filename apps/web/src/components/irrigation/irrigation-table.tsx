"use client";

import * as React from "react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmIrrigationModal } from "./confirm-irrigation-modal";
import { CheckCircle, Droplet, Cloud, Zap, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Irrigation {
  id: string;
  type: "manual" | "automatic" | "detected" | "rain";
  waterAmount?: number;
  notes?: string;
  createdAt: string;
  greenhouse?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
  };
  plant?: {
    id: string;
    name: string;
  };
}

interface IrrigationTableProps {
  irrigations: Irrigation[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function IrrigationTable({
  irrigations,
  isLoading,
  onRefresh,
}: IrrigationTableProps) {
  const [selectedIrrigation, setSelectedIrrigation] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConfirm = (irrigationId: string) => {
    setSelectedIrrigation(irrigationId);
    setIsModalOpen(true);
  };

  const handleConfirmed = () => {
    setIsModalOpen(false);
    setSelectedIrrigation(null);
    onRefresh?.();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "automatic":
        return <Zap className="h-4 w-4" />;
      case "manual":
        return <Droplet className="h-4 w-4" />;
      case "rain":
        return <Cloud className="h-4 w-4" />;
      case "detected":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Droplet className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      automatic: {
        variant: "default" as const,
        label: "Automático",
        color: "bg-blue-500",
      },
      manual: {
        variant: "secondary" as const,
        label: "Manual",
        color: "bg-green-500",
      },
      rain: {
        variant: "outline" as const,
        label: "Chuva",
        color: "bg-gray-500",
      },
      detected: {
        variant: "destructive" as const,
        label: "Detectado",
        color: "bg-yellow-500",
      },
    };

    const config = variants[type as keyof typeof variants] || variants.manual;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        {getTypeIcon(type)}
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (irrigation: Irrigation) => {
    if (irrigation.type === "detected") {
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          Pendente
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 w-fit"
      >
        <CheckCircle className="h-3 w-3" />
        Confirmado
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (irrigations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Droplet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhuma irrigação registrada</p>
            <p className="text-sm mt-1">
              As irrigações aparecerão aqui quando forem detectadas ou
              registradas
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Irrigações</CardTitle>
          <CardDescription>
            {irrigations.length} irrigação
            {irrigations.length !== 1 ? "ões" : ""} registrada
            {irrigations.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Quantidade (ml)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {irrigations.map((irrigation) => (
                <TableRow key={irrigation.id}>
                  <TableCell className="font-medium">
                    {format(
                      new Date(irrigation.createdAt),
                      "dd/MM/yyyy 'às' HH:mm",
                      {
                        locale: ptBR,
                      }
                    )}
                  </TableCell>
                  <TableCell>{getTypeBadge(irrigation.type)}</TableCell>
                  <TableCell>
                    {irrigation.waterAmount ? (
                      <span className="font-medium">
                        {irrigation.waterAmount} ml
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(irrigation)}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {irrigation.notes || (
                      <span className="text-muted-foreground italic">
                        Sem observações
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {irrigation.type === "detected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConfirm(irrigation.id)}
                      >
                        Confirmar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de confirmação */}
      {selectedIrrigation && (
        <ConfirmIrrigationModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          irrigationId={selectedIrrigation}
          onConfirmed={handleConfirmed}
        />
      )}
    </>
  );
}
