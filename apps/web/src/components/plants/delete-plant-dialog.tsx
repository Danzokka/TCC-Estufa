"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deletePlant } from "@/server/actions/plant";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface DeletePlantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plantId: string;
  plantName: string;
  readingsCount: number;
  onSuccess: () => void;
}

export function DeletePlantDialog({
  open,
  onOpenChange,
  plantId,
  plantName,
  readingsCount,
  onSuccess,
}: DeletePlantDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      await deletePlant(plantId);
      toast.success("Planta excluída com sucesso!");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Erro ao deletar planta:", error);
      toast.error("Falha ao excluir planta");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Excluir a planta{" "}
            <strong>{plantName}</strong> irá remover todas as{" "}
            <strong>{readingsCount}</strong> medições associadas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
