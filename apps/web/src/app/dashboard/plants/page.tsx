"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { DataTable } from "@/components/plants/data-table";
import { columns } from "@/components/plants/columns";
import {
  getUserPlantsWithStats,
  UserPlantWithStats,
} from "@/server/actions/plant";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export default function PlantsPage() {
  const {
    data: plants = [],
    isLoading,
    error,
  } = useQuery<UserPlantWithStats[]>({
    queryKey: ["plants"],
    queryFn: getUserPlantsWithStats,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh a cada 5 minutos
    refetchOnWindowFocus: true, // Refresh quando a janela ganha foco
  });

  // Tratamento de erro usando useEffect
  useEffect(() => {
    if (error) {
      console.error("Erro ao carregar plantas:", error);
      toast.error("Falha ao carregar plantas");
    }
  }, [error]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Minhas Plantas</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie e monitore todas as suas plantas cadastradas
        </p>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable columns={columns} data={plants} />
        )}
      </Card>
    </div>
  );
}
