"use client";

import * as React from "react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmIrrigationModal } from "./confirm-irrigation-modal";
import { Droplet } from "lucide-react";
import { DataTable } from "./data-table";
import { columns, Irrigation } from "./columns";
import { useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();

  const handleConfirm = (irrigationId: string) => {
    setSelectedIrrigation(irrigationId);
    setIsModalOpen(true);
  };

  const handleConfirmed = () => {
    setIsModalOpen(false);
    setSelectedIrrigation(null);
    
    // Invalidar queries para forçar atualização
    queryClient.invalidateQueries({ queryKey: ["irrigations"] });
    queryClient.invalidateQueries({ queryKey: ["irrigation-stats"] });
    
    // Chamar refresh se disponível
    onRefresh?.();
  };

  // Escutar evento customizado para confirmação
  React.useEffect(() => {
    const handleConfirmEvent = (event: CustomEvent) => {
      handleConfirm(event.detail.irrigationId);
    };

    window.addEventListener('confirmIrrigation', handleConfirmEvent as EventListener);
    
    return () => {
      window.removeEventListener('confirmIrrigation', handleConfirmEvent as EventListener);
    };
  }, []);

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
          <DataTable columns={columns} data={irrigations} />
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
