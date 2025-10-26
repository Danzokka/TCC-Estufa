"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw, FileText, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  getUserPlantsWithStats,
  UserPlantWithStats,
} from "@/server/actions/plant";
import {
  generateReport,
  getLatestReport,
  Report,
} from "@/server/actions/analytics";
import { WeatherImpact } from "@/components/analytics/weather-impact";

export default function AnalyticsPage() {
  const [selectedPlant, setSelectedPlant] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<"weekly" | "monthly" | "general">("weekly");
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [generating, setGenerating] = useState(false);

  // Buscar plantas do usuário
  const {
    data: plants = [],
    isLoading: plantsLoading,
    error: plantsError,
  } = useQuery<UserPlantWithStats[]>({
    queryKey: ["plants"],
    queryFn: getUserPlantsWithStats,
    refetchInterval: 5 * 60 * 1000,
  });

  const loadLatestReport = useCallback(async () => {
    if (!selectedPlant) return;
    
    try {
      const report = await getLatestReport(selectedPlant, selectedPeriod);
      setCurrentReport(report);
    } catch (error) {
      console.error("Erro ao carregar relatório:", error);
    }
  }, [selectedPlant, selectedPeriod]);

  // Buscar relatório quando planta ou período mudar
  useEffect(() => {
    if (selectedPlant && selectedPeriod) {
      loadLatestReport();
    }
  }, [selectedPlant, selectedPeriod, loadLatestReport]);

  const handleGenerateReport = async () => {
    if (!selectedPlant) {
      toast.error("Selecione uma planta primeiro");
      return;
    }

    setGenerating(true);
    try {
      const report = await generateReport({
        userPlantId: selectedPlant,
        type: selectedPeriod,
      });
      setCurrentReport(report);
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setGenerating(false);
    }
  };

  const handleRefreshReport = async () => {
    await loadLatestReport();
    toast.success("Relatório atualizado!");
  };

  if (plantsLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (plantsError) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Erro ao carregar plantas</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Análises</h2>
          <p className="text-muted-foreground mt-1">
            Relatórios detalhados sobre o crescimento das suas plantas
          </p>
        </div>
      </div>

      {/* Seleção de Planta e Período */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração do Relatório</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Planta</label>
              <Select value={selectedPlant} onValueChange={setSelectedPlant}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma planta" />
                </SelectTrigger>
                <SelectContent>
                  {plants.map((plant) => (
                    <SelectItem key={plant.id} value={plant.id}>
                      {plant.nickname || plant.plant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as "weekly" | "monthly" | "general")}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="weekly">Semanal</TabsTrigger>
                  <TabsTrigger value="monthly">Mensal</TabsTrigger>
                  <TabsTrigger value="general">Geral</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleGenerateReport}
              disabled={!selectedPlant || generating}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </>
              )}
            </Button>

            {currentReport && (
              <Button
                variant="outline"
                onClick={handleRefreshReport}
                disabled={generating}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo do Relatório */}
      {currentReport ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Relatório {selectedPeriod === 'weekly' ? 'Semanal' : selectedPeriod === 'monthly' ? 'Mensal' : 'Geral'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Gerado em {new Date(currentReport.generatedAt).toLocaleString('pt-BR')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Weather Impact - NOVO */}
              <WeatherImpact 
                weatherSummary={currentReport.weatherSummary} 
                reportType={selectedPeriod}
              />
              
              {/* Resumo Geral */}
              {currentReport.summary && (
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Resumo Geral</h3>
                  <p className="text-sm">{currentReport.summary}</p>
                </div>
              )}

              {/* Métricas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{currentReport.totalReadings}</div>
                  <div className="text-sm text-muted-foreground">Medições</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{currentReport.totalIrrigations}</div>
                  <div className="text-sm text-muted-foreground">Irrigações</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {new Date(currentReport.startDate).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="text-sm text-muted-foreground">Início</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {new Date(currentReport.endDate).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="text-sm text-muted-foreground">Fim</div>
                </div>
              </div>

              {/* Insights da IA */}
              {currentReport.aiInsights && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Análises Detalhadas</h3>
                  <div className="grid gap-4">
                    {Object.entries(currentReport.aiInsights).map(([key, value]) => (
                      <div key={key} className="p-4 border rounded-lg">
                        <h4 className="font-medium capitalize mb-2">
                          {key.replace('_', ' ')}
                        </h4>
                        <p className="text-sm text-muted-foreground">{value as string}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recomendações */}
              {currentReport.recommendations && currentReport.recommendations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Recomendações</h3>
                  <div className="space-y-2">
                    {currentReport.recommendations.map((rec, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 text-xs rounded ${
                            rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                          <span className="text-sm font-medium capitalize">
                            {rec.category.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : selectedPlant ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Nenhum relatório encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Gere um relatório para ver análises detalhadas sobre esta planta.
            </p>
            <Button onClick={handleGenerateReport} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                "Gerar Primeiro Relatório"
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Selecione uma planta</h3>
            <p className="text-sm text-muted-foreground">
              Escolha uma planta para visualizar seus relatórios de análise.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
