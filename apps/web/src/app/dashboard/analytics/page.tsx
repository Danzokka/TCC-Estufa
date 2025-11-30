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
import {
  Loader2,
  RefreshCw,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Info,
  Thermometer,
  Droplets,
  Sprout,
  CloudSun,
  Clock,
  Link2,
  Leaf,
  Sun,
  CircleAlert,
  Circle,
  Lightbulb,
  Search,
  Pin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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

// Interfaces para os componentes
interface Anomaly {
  type: string;
  severity: string;
  description: string;
}

interface Recommendation {
  category: string;
  priority: string;
  description: string;
}

// Componente de Anomalias com limite e expansão
function AnomaliesSection({ anomalies }: { anomalies: Anomaly[] }) {
  const [expanded, setExpanded] = useState(false);
  const MAX_VISIBLE = 5;

  const visibleAnomalies = expanded
    ? anomalies
    : anomalies.slice(0, MAX_VISIBLE);
  const hasMore = anomalies.length > MAX_VISIBLE;

  const severityConfig = {
    high: {
      bg: "bg-red-50 dark:bg-red-950/20",
      border: "border-red-200 dark:border-red-800",
      badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      icon: <CircleAlert className="h-3 w-3" />,
      label: "Alta",
    },
    medium: {
      bg: "bg-orange-50 dark:bg-orange-950/20",
      border: "border-orange-200 dark:border-orange-800",
      badge:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      icon: <AlertTriangle className="h-3 w-3" />,
      label: "Média",
    },
    low: {
      bg: "bg-yellow-50 dark:bg-yellow-950/20",
      border: "border-yellow-200 dark:border-yellow-800",
      badge:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      icon: <Circle className="h-3 w-3" />,
      label: "Baixa",
    },
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-yellow-500" />
        <span>Anomalias Detectadas</span>
        <span className="text-sm font-normal text-muted-foreground">
          ({anomalies.length})
        </span>
      </h3>
      <div className="space-y-3">
        {visibleAnomalies.map((anomaly, index) => {
          const config =
            severityConfig[anomaly.severity as keyof typeof severityConfig] ||
            severityConfig.low;

          return (
            <div
              key={index}
              className={`p-4 rounded-lg border ${config.bg} ${config.border}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 ${config.badge}`}
                >
                  {config.icon}
                  {config.label}
                </span>
                <span className="text-sm font-semibold capitalize">
                  {anomaly.type.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm text-foreground/90">
                {anomaly.description}
              </p>
            </div>
          );
        })}
      </div>
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Mostrar menos
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Ver mais {anomalies.length - MAX_VISIBLE} anomalias
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// Componente de Recomendações
function RecommendationsSection({
  aiRecommendations,
  recommendations,
}: {
  aiRecommendations: Recommendation[];
  recommendations: Recommendation[];
}) {
  const allRecommendations = [...aiRecommendations, ...recommendations];

  if (allRecommendations.length === 0) return null;

  const categoryIcons: Record<string, JSX.Element> = {
    temperature: <Thermometer className="h-4 w-4 text-red-500" />,
    humidity: <Droplets className="h-4 w-4 text-blue-500" />,
    soil_moisture: <Sprout className="h-4 w-4 text-green-500" />,
    irrigation: <Droplets className="h-4 w-4 text-cyan-500" />,
    light: <Sun className="h-4 w-4 text-yellow-500" />,
    weather: <CloudSun className="h-4 w-4 text-orange-500" />,
    general: <Pin className="h-4 w-4 text-gray-500" />,
  };

  const priorityConfig = {
    high: {
      bg: "bg-red-50 dark:bg-red-950/20",
      border: "border-red-200 dark:border-red-800",
      badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      icon: <CircleAlert className="h-3 w-3" />,
      label: "Alta",
    },
    medium: {
      bg: "bg-yellow-50 dark:bg-yellow-950/20",
      border: "border-yellow-200 dark:border-yellow-800",
      badge:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      icon: <AlertTriangle className="h-3 w-3" />,
      label: "Média",
    },
    low: {
      bg: "bg-green-50 dark:bg-green-950/20",
      border: "border-green-200 dark:border-green-800",
      badge:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: "Baixa",
    },
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <span>Recomendações</span>
      </h3>
      <div className="space-y-3">
        {allRecommendations.map((rec, index) => {
          const config =
            priorityConfig[rec.priority as keyof typeof priorityConfig] ||
            priorityConfig.low;
          const categoryIcon =
            categoryIcons[rec.category as keyof typeof categoryIcons] ||
            categoryIcons.general;

          return (
            <div
              key={index}
              className={`p-4 rounded-lg border ${config.bg} ${config.border}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 ${config.badge}`}
                >
                  {config.icon}
                  {config.label}
                </span>
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  {categoryIcon}
                  <span className="capitalize">
                    {rec.category.replace("_", " ")}
                  </span>
                </span>
              </div>
              <p className="text-sm text-foreground/90">{rec.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface InsightSectionProps {
  title: string;
  content: string;
}

function InsightSection({ title, content }: InsightSectionProps) {
  // Mapeamento de ícones para títulos
  const titleIcons: Record<string, JSX.Element> = {
    temperature: <Thermometer className="h-5 w-5 text-red-500" />,
    humidity: <Droplets className="h-5 w-5 text-blue-500" />,
    soil_moisture: <Sprout className="h-5 w-5 text-green-500" />,
    irrigation: <Droplets className="h-5 w-5 text-cyan-500" />,
    weather_impact: <CloudSun className="h-5 w-5 text-yellow-500" />,
    temporal_patterns: <Clock className="h-5 w-5 text-purple-500" />,
    correlations: <Link2 className="h-5 w-5 text-indigo-500" />,
    plant_health: <Leaf className="h-5 w-5 text-emerald-500" />,
  };

  // Formatar título
  const formatTitle = (title: string) => {
    const titleMap: Record<string, string> = {
      temperature: "Análise de Temperatura",
      humidity: "Análise de Umidade do Ar",
      soil_moisture: "Análise de Umidade do Solo",
      irrigation: "Padrões de Irrigação",
      weather_impact: "Impacto Climático",
      temporal_patterns: "Padrões Temporais",
      correlations: "Correlações Entre Variáveis",
      plant_health: "Saúde da Planta",
    };
    return {
      icon: titleIcons[title] || <Info className="h-5 w-5 text-gray-500" />,
      text:
        titleMap[title] ||
        title.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    };
  };

  // Processar conteúdo markdown-like
  const processContent = (text: string) => {
    const lines = text.split("\n");
    const elements: JSX.Element[] = [];
    let currentList: string[] = [];
    let lineKey = 0;

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${lineKey++}`} className="space-y-1.5 ml-4 my-3">
            {currentList.map((item, idx) => (
              <li
                key={idx}
                className="text-sm text-muted-foreground flex items-start gap-2"
              >
                <span className="text-primary mt-0.5">•</span>
                <span className="flex-1">{item}</span>
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, index) => {
      line = line.trim();
      if (!line) {
        flushList();
        return;
      }

      // Headers **text** ou ### text ou ## text
      if (line.startsWith("###")) {
        flushList();
        const headerText = line.replace(/^###\s*/, "");
        elements.push(
          <h5
            key={`h3-${index}`}
            className="font-medium text-sm mt-3 mb-2 text-foreground"
          >
            {headerText}
          </h5>
        );
        return;
      }
      if (line.startsWith("##")) {
        flushList();
        const headerText = line.replace(/^##\s*/, "");
        elements.push(
          <h4
            key={`h2-${index}`}
            className="font-semibold text-base mt-4 mb-2 text-foreground"
          >
            {headerText}
          </h4>
        );
        return;
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        flushList();
        const headerText = line.replace(/\*\*/g, "");
        elements.push(
          <h4
            key={`header-${index}`}
            className="font-semibold text-sm mt-4 mb-2 text-foreground"
          >
            {headerText}
          </h4>
        );
        return;
      }
      // Bold inline: **text** dentro de uma linha
      if (line.includes("**") && !line.startsWith("**")) {
        flushList();
        const parts = line.split(/\*\*(.+?)\*\*/g);
        elements.push(
          <p
            key={`bold-${index}`}
            className="text-sm text-muted-foreground my-2"
          >
            {parts.map((part, i) =>
              i % 2 === 1 ? (
                <strong key={i} className="font-semibold text-foreground">
                  {part}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        );
        return;
      }

      // Lista com bullet • ou -
      if (line.startsWith("•") || line.startsWith("-")) {
        currentList.push(line.substring(1).trim());
        return;
      }

      // Emojis de status
      const statusIcons: Record<string, JSX.Element> = {
        "✅": <CheckCircle2 className="h-4 w-4 text-green-600" />,
        "❌": <AlertTriangle className="h-4 w-4 text-red-600" />,
        "⚠️": <AlertTriangle className="h-4 w-4 text-yellow-600" />,
        "🦠": <AlertTriangle className="h-4 w-4 text-orange-600" />,
        "🥀": <TrendingDown className="h-4 w-4 text-orange-600" />,
        "📈": <TrendingUp className="h-4 w-4 text-blue-600" />,
        "📉": <TrendingDown className="h-4 w-4 text-red-600" />,
        "💡": <Info className="h-4 w-4 text-blue-600" />,
      };

      // Detectar linhas com status
      const statusEmoji = Object.keys(statusIcons).find((emoji) =>
        line.startsWith(emoji)
      );
      if (statusEmoji) {
        flushList();
        const statusText = line.substring(statusEmoji.length).trim();
        const isWarning = ["❌", "⚠️", "🦠", "🥀"].includes(statusEmoji);
        const isSuccess = ["✅"].includes(statusEmoji);

        elements.push(
          <div
            key={`status-${index}`}
            className={`flex items-start gap-2 p-3 rounded-lg my-2 ${
              isWarning
                ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900"
                : isSuccess
                  ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900"
                  : "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900"
            }`}
          >
            {statusIcons[statusEmoji]}
            <span className="text-sm flex-1">{statusText}</span>
          </div>
        );
        return;
      }

      // Texto normal
      flushList();
      elements.push(
        <p key={`text-${index}`} className="text-sm text-muted-foreground my-2">
          {line}
        </p>
      );
    });

    flushList();
    return elements;
  };

  const { icon, text } = formatTitle(title);

  return (
    <div className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
      <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
        {icon}
        <span>{text}</span>
      </h4>
      <div className="space-y-1">{processContent(content)}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [selectedPlant, setSelectedPlant] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<
    "weekly" | "monthly" | "general"
  >("weekly");
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
              <Tabs
                value={selectedPeriod}
                onValueChange={(value) =>
                  setSelectedPeriod(value as "weekly" | "monthly" | "general")
                }
              >
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
              Relatório{" "}
              {selectedPeriod === "weekly"
                ? "Semanal"
                : selectedPeriod === "monthly"
                  ? "Mensal"
                  : "Geral"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Gerado em{" "}
              {new Date(currentReport.generatedAt).toLocaleString("pt-BR")}
            </p>
          </CardHeader>
          <CardContent>
            {/* Debug: Mostrar estrutura dos dados */}
            {process.env.NODE_ENV === "development" && (
              <div className="mb-4 p-3 bg-muted rounded-lg text-xs">
                <details>
                  <summary className="cursor-pointer font-semibold">
                    🐛 Debug: Estrutura dos Dados
                  </summary>
                  <pre className="mt-2 overflow-auto">
                    {JSON.stringify(
                      {
                        hasAiInsights: !!currentReport.aiInsights,
                        hasInsights: !!currentReport.aiInsights?.insights,
                        insightsKeys: currentReport.aiInsights?.insights
                          ? Object.keys(currentReport.aiInsights.insights)
                          : [],
                        hasAnomalies: !!currentReport.aiInsights?.anomalies,
                        anomaliesCount:
                          currentReport.aiInsights?.anomalies?.length || 0,
                        hasRecommendations: !!currentReport.recommendations,
                        recommendationsCount:
                          currentReport.recommendations?.length || 0,
                        hasAiRecommendations:
                          !!currentReport.aiInsights?.recommendations,
                        aiRecommendationsCount:
                          currentReport.aiInsights?.recommendations?.length ||
                          0,
                      },
                      null,
                      2
                    )}
                  </pre>
                </details>
              </div>
            )}

            <div className="space-y-6">
              {/* Weather Impact - NOVO */}
              <WeatherImpact
                weatherSummary={currentReport.weatherSummary}
                reportType={selectedPeriod}
              />

              {/* Resumo Geral */}
              {currentReport.summary && (
                <div className="rounded-lg overflow-hidden border">
                  <div className="bg-primary/10 px-4 py-3">
                    <h3 className="font-semibold text-base">
                      📋 Resumo Geral do Período
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {currentReport.summary.split("\n").map((line, idx) => {
                        line = line.trim();
                        if (!line) return null;

                        // Header com emoji
                        if (
                          line.startsWith("📊") ||
                          line.startsWith("🌡️") ||
                          line.startsWith("📈") ||
                          line.startsWith("🌱") ||
                          line.startsWith("💧")
                        ) {
                          return (
                            <h4
                              key={idx}
                              className="font-semibold text-sm mt-4 mb-2 text-foreground"
                            >
                              {line}
                            </h4>
                          );
                        }

                        // Lista
                        if (line.startsWith("•") || line.startsWith("-")) {
                          return (
                            <div
                              key={idx}
                              className="flex items-start gap-2 ml-4 my-1"
                            >
                              <span className="text-primary mt-1">•</span>
                              <span className="text-sm text-muted-foreground flex-1">
                                {line.substring(1).trim()}
                              </span>
                            </div>
                          );
                        }

                        // Texto normal
                        return (
                          <p
                            key={idx}
                            className="text-sm text-muted-foreground my-2"
                          >
                            {line}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Métricas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {currentReport.totalReadings}
                  </div>
                  <div className="text-sm text-muted-foreground">Medições</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {currentReport.totalIrrigations}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Irrigações
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {new Date(currentReport.startDate).toLocaleDateString(
                      "pt-BR"
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Início</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {new Date(currentReport.endDate).toLocaleDateString(
                      "pt-BR"
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Fim</div>
                </div>
              </div>

              {/* Insights da IA */}
              {currentReport.aiInsights?.insights && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    <span>Análises Detalhadas</span>
                  </h3>
                  <div className="grid gap-4">
                    {Object.entries(currentReport.aiInsights.insights).map(
                      ([key, value]) => (
                        <InsightSection
                          key={key}
                          title={key}
                          content={value as string}
                        />
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Anomalias detectadas */}
              {currentReport.aiInsights?.anomalies &&
                currentReport.aiInsights.anomalies.length > 0 && (
                  <AnomaliesSection
                    anomalies={currentReport.aiInsights.anomalies}
                  />
                )}

              {/* Recomendações - Combinar todas as fontes */}
              <RecommendationsSection
                aiRecommendations={
                  currentReport.aiInsights?.recommendations || []
                }
                recommendations={currentReport.recommendations || []}
              />
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
