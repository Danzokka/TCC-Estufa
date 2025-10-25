"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ConfirmIrrigationModal } from "./confirm-irrigation-modal";
import { 
  CheckCircle, 
  Droplet, 
  Cloud, 
  Zap, 
  AlertCircle, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Search
} from "lucide-react";
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

type SortField = 'createdAt' | 'waterAmount' | 'type';
type SortDirection = 'asc' | 'desc';

export function EnhancedIrrigationTable({
  irrigations,
  isLoading,
  onRefresh,
}: IrrigationTableProps) {
  const [selectedIrrigation, setSelectedIrrigation] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para ordenação
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Estados para filtros
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleConfirm = (irrigationId: string) => {
    setSelectedIrrigation(irrigationId);
    setIsModalOpen(true);
  };

  const handleConfirmed = () => {
    setIsModalOpen(false);
    setSelectedIrrigation(null);
    onRefresh?.();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
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

  const getStatus = (irrigation: Irrigation) => {
    return irrigation.type === "detected" ? "pendente" : "confirmado";
  };

  // Filtros e ordenação
  const filteredAndSortedIrrigations = useMemo(() => {
    let filtered = irrigations.filter((irrigation) => {
      // Filtro por tipo
      if (typeFilter !== 'all' && irrigation.type !== typeFilter) {
        return false;
      }
      
      // Filtro por status
      if (statusFilter !== 'all') {
        const status = getStatus(irrigation);
        if (status !== statusFilter) {
          return false;
        }
      }
      
      // Filtro por termo de busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          irrigation.notes?.toLowerCase().includes(searchLower) ||
          irrigation.user?.name?.toLowerCase().includes(searchLower) ||
          irrigation.plant?.name?.toLowerCase().includes(searchLower) ||
          irrigation.greenhouse?.name?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) {
          return false;
        }
      }
      
      return true;
    });

    // Ordenação
    return filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'waterAmount':
          aValue = a.waterAmount || 0;
          bValue = b.waterAmount || 0;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [irrigations, typeFilter, statusFilter, searchTerm, sortField, sortDirection]);

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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Irrigações</CardTitle>
          <CardDescription>
            {filteredAndSortedIrrigations.length} de {irrigations.length} irrigação
            {irrigations.length !== 1 ? "ões" : ""} registrada
            {irrigations.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtros e Busca */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por observações, usuário, planta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatic">Automático</SelectItem>
                  <SelectItem value="rain">Chuva</SelectItem>
                  <SelectItem value="detected">Detectado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTypeFilter('all');
                setStatusFilter('all');
                setSearchTerm('');
              }}
            >
              Limpar Filtros
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('createdAt')}
                    className="h-auto p-0 font-semibold"
                  >
                    Data/Hora
                    {getSortIcon('createdAt')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('type')}
                    className="h-auto p-0 font-semibold"
                  >
                    Tipo
                    {getSortIcon('type')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('waterAmount')}
                    className="h-auto p-0 font-semibold"
                  >
                    Quantidade (ml)
                    {getSortIcon('waterAmount')}
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedIrrigations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Droplet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhuma irrigação encontrada</p>
                    <p className="text-sm mt-1">
                      Tente ajustar os filtros ou adicionar novas irrigações
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedIrrigations.map((irrigation) => (
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
                ))
              )}
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
