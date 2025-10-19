"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePlantNickname } from "@/server/actions/plant";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EditPlantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plantId: string;
  currentNickname: string | null;
  plantName: string;
  onSuccess: () => void;
}

export function EditPlantDialog({
  open,
  onOpenChange,
  plantId,
  currentNickname,
  plantName,
  onSuccess,
}: EditPlantDialogProps) {
  const [nickname, setNickname] = useState(currentNickname || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      toast.error("O apelido não pode estar vazio");
      return;
    }

    setIsLoading(true);

    try {
      await updatePlantNickname(plantId, nickname.trim());
      toast.success("Nome da planta atualizado com sucesso!");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Erro ao atualizar planta:", error);
      toast.error("Falha ao atualizar nome da planta");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Nome da Planta</DialogTitle>
            <DialogDescription>
              Altere o apelido da sua planta <strong>{plantName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nickname" className="text-right">
                Apelido
              </Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="col-span-3"
                placeholder="Digite um apelido..."
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
