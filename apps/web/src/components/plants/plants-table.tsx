"use client";

import { useState } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, Trash2, Leaf } from "lucide-react";
import { UserPlantWithStats } from "@/server/actions/plant";
import { EditPlantDialog } from "./edit-plant-dialog";
import { DeletePlantDialog } from "./delete-plant-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PlantsTableProps {
  plants: UserPlantWithStats[];
  onRefresh: () => void;
}

const statusMap = {
  healthy: {
    label: "Saudável",
    variant: "default" as const,
    className: "bg-green-500",
  },
  warning: {
    label: "Atenção",
    variant: "secondary" as const,
    className: "bg-yellow-500",
  },
  critical: {
    label: "Crítico",
    variant: "destructive" as const,
    className: "bg-red-500",
  },
  "no-data": {
    label: "Sem Dados",
    variant: "outline" as const,
    className: "bg-gray-500",
  },
};

export function PlantsTable({ plants, onRefresh }: PlantsTableProps) {
  const [editingPlant, setEditingPlant] = useState<UserPlantWithStats | null>(
    null
  );
  const [deletingPlant, setDeletingPlant] = useState<UserPlantWithStats | null>(
    null
  );

  if (plants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Leaf className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Nenhuma planta cadastrada</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Comece adicionando sua primeira planta para monitorá-la.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Planta</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Medições</TableHead>
              <TableHead>Dias Cadastrado</TableHead>
              <TableHead>Última Medição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plants.map((plant) => {
              const statusInfo = statusMap[plant.stats.lastReading.status];
              const displayName = plant.nickname || plant.plant.name;
              const lastReadingDate = plant.stats.lastReading.date
                ? format(
                    new Date(plant.stats.lastReading.date),
                    "dd/MM/yyyy 'às' HH:mm",
                    {
                      locale: ptBR,
                    }
                  )
                : "Sem medições";

              return (
                <TableRow key={plant.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={`/icons/plants/${plant.plant.name.toLowerCase()}.png`}
                        />
                        <AvatarFallback>
                          <Leaf className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{displayName}</span>
                        {plant.nickname && (
                          <span className="text-xs text-muted-foreground">
                            {plant.plant.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{plant.plant.name}</TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {plant.stats.totalReadings}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {plant.stats.daysWithPlant}
                    </span>{" "}
                    dias
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{lastReadingDate}</span>
                      {plant.stats.lastReading.date && (
                        <div className="text-xs text-muted-foreground mt-1">
                          <div>
                            Temp:{" "}
                            {plant.stats.lastReading.air_temperature?.toFixed(
                              1
                            )}
                            °C
                          </div>
                          <div>
                            Umidade:{" "}
                            {plant.stats.lastReading.air_humidity?.toFixed(0)}%
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusInfo.variant}
                      className={statusInfo.className}
                    >
                      {statusInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingPlant(plant)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingPlant(plant)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {editingPlant && (
        <EditPlantDialog
          open={!!editingPlant}
          onOpenChange={(open) => !open && setEditingPlant(null)}
          plantId={editingPlant.id}
          currentNickname={editingPlant.nickname}
          plantName={editingPlant.plant.name}
          onSuccess={() => {
            onRefresh();
            setEditingPlant(null);
          }}
        />
      )}

      {deletingPlant && (
        <DeletePlantDialog
          open={!!deletingPlant}
          onOpenChange={(open) => !open && setDeletingPlant(null)}
          plantId={deletingPlant.id}
          plantName={deletingPlant.nickname || deletingPlant.plant.name}
          readingsCount={deletingPlant.stats.totalReadings}
          onSuccess={() => {
            onRefresh();
            setDeletingPlant(null);
          }}
        />
      )}
    </>
  );
}
