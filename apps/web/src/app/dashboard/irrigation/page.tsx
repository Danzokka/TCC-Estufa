"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { IrrigationTable } from "@/components/irrigation/irrigation-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Droplet, TrendingUp, Calendar } from "lucide-react";
import {
  getIrrigations,
  getIrrigationStats,
} from "@/server/actions/irrigation";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function IrrigationPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  // Query para irrigações
  const {
    data: irrigationsData,
    isLoading: irrigationsLoading,
    error: irrigationsError,
  } = useQuery({
    queryKey: ["irrigations", typeFilter],
    queryFn: async () => {
      const filters: any = { limit: 50 };
      if (typeFilter !== "all") {
        filters.type = typeFilter;
      }
      return await getIrrigations(filters);
    },
    refetchInterval: 30000, // Auto-refresh a cada 30 segundos
    refetchOnWindowFocus: true,
  });

  // Query para estatísticas
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["irrigation-stats"],
    queryFn: getIrrigationStats,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const irrigations = irrigationsData?.data?.irrigations || [];
  const stats = statsData?.data;
  const isLoading = irrigationsLoading || statsLoading;

  // Tratamento de erros
  useEffect(() => {
    if (irrigationsError) {
      console.error("Error loading irrigations:", irrigationsError);
      toast.error("Falha ao carregar dados de irrigação");
    }
    if (statsError) {
      console.error("Error loading stats:", statsError);
      toast.error("Falha ao carregar estatísticas");
    }
  }, [irrigationsError, statsError]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["irrigations"] });
    queryClient.invalidateQueries({ queryKey: ["irrigation-stats"] });
    toast.success("Dados atualizados!");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gerenciamento de Irrigação
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe e gerencie todas as irrigações da sua estufa
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Irrigações
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.totalIrrigations || 0}
                  </p>
                </div>
                <Droplet className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Água Total Utilizada
                  </p>
                  <p className="text-2xl font-bold">
                    {(stats.totalWater || 0).toLocaleString("pt-BR")} ml
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Últimos 7 Dias
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.recentIrrigations?.length || 0}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="type-filter" className="text-sm font-medium">
            Filtrar por tipo:
          </label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger id="type-filter" className="w-[180px]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="automatic">Automático</SelectItem>
              <SelectItem value="detected">Detectado</SelectItem>
              <SelectItem value="rain">Chuva</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <IrrigationTable
        key={`irrigation-table-${irrigations.length}-${Date.now()}`}
        irrigations={[...irrigations]} // Cria uma cópia do array para forçar re-render
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
