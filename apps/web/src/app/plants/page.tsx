"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { DataTable } from "@/components/plants/data-table";
import { columns } from "@/components/plants/columns";
import {
  getUserPlantsWithStats,
  UserPlantWithStats,
} from "@/server/actions/plant";
import { toast } from "sonner";

export default function PlantsPage() {
  const [plants, setPlants] = useState<UserPlantWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPlants = async (showRefreshMessage = false) => {
    try {
      if (showRefreshMessage) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const data = await getUserPlantsWithStats();
      setPlants(data);

      if (showRefreshMessage) {
        toast.success("Dados atualizados!");
      }
    } catch (error) {
      console.error("Erro ao carregar plantas:", error);
      toast.error("Falha ao carregar plantas");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPlants();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Minhas Plantas</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie e monitore todas as suas plantas cadastradas
          </p>
        </div>
        <Button
          onClick={() => loadPlants(true)}
          disabled={isRefreshing}
          variant="outline"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Atualizando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </>
          )}
        </Button>
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
