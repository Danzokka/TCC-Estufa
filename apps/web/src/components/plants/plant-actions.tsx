"use client";

import { useState } from "react";
import { UserPlantWithStats } from "@/server/actions/plant";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { EditPlantDialog } from "./edit-plant-dialog";
import { DeletePlantDialog } from "./delete-plant-dialog";
import { useQueryClient } from "@tanstack/react-query";

interface PlantActionsProps {
  plant: UserPlantWithStats;
}

export function PlantActions({ plant }: PlantActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    // Invalida o cache do React Query para forçar re-fetch
    queryClient.invalidateQueries({ queryKey: ["plants"] });
    queryClient.invalidateQueries({ queryKey: ["userPlants"] });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setIsEditOpen(true)}
      >
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Editar</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={() => setIsDeleteOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Excluir</span>
      </Button>

      <EditPlantDialog
        plantId={plant.id}
        currentNickname={plant.nickname}
        plantName={plant.plant.name}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={handleSuccess}
      />

      <DeletePlantDialog
        plantId={plant.id}
        plantName={plant.nickname || plant.plant.name}
        readingsCount={plant.stats.totalReadings}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
