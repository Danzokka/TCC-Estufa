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

export default function IrrigationPage() {
  const [irrigations, setIrrigations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const filters: any = { limit: 50 };

      if (typeFilter !== "all") {
        filters.type = typeFilter;
      }

      const [irrigationsResult, statsResult] = await Promise.all([
        getIrrigations(filters),
        getIrrigationStats(),
      ]);

      setIrrigations(irrigationsResult.data.irrigations || []);
      setStats(statsResult.data);
    } catch (error) {
      console.error("Error loading irrigation data:", error);
      toast.error("Falha ao carregar dados de irrigação");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter]);

  const handleRefresh = () => {
    loadData();
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
        irrigations={irrigations}
        isLoading={isLoading}
        onRefresh={loadData}
      />
    </div>
  );
}
