"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getAvailablePlants,
  getUserGreenhouses,
  linkPlantToUser,
  AvailablePlant,
  UserGreenhouse,
} from "@/server/actions/plant";

const formSchema = z.object({
  plantId: z.string().min(1, "Selecione uma planta"),
  greenhouseId: z.string().min(1, "Selecione uma estufa"),
  nickname: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddPlantDialogProps {
  onSuccess?: () => void;
}

export function AddPlantDialog({ onSuccess }: AddPlantDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availablePlants, setAvailablePlants] = useState<AvailablePlant[]>([]);
  const [userGreenhouses, setUserGreenhouses] = useState<UserGreenhouse[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plantId: "",
      greenhouseId: "",
      nickname: "",
    },
  });

  // Carregar dados quando o dialog abrir
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [plants, greenhouses] = await Promise.all([
        getAvailablePlants(),
        getUserGreenhouses(),
      ]);

      setAvailablePlants(plants);
      setUserGreenhouses(greenhouses);

      // Auto-selecionar a estufa se o usuário tiver apenas uma
      if (greenhouses.length === 1) {
        form.setValue("greenhouseId", greenhouses[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await linkPlantToUser({
        plantId: data.plantId,
        greenhouseId: data.greenhouseId,
        nickname: data.nickname || undefined,
      });

      toast.success("Planta adicionada com sucesso!");
      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao adicionar planta:", error);
      toast.error("Erro ao adicionar planta");
    } finally {
      setLoading(false);
    }
  };

  const selectedPlant = availablePlants.find(
    (plant) => plant.id === form.watch("plantId")
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Planta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Planta</DialogTitle>
          <DialogDescription>
            Vincule uma planta existente à sua estufa para começar o
            monitoramento.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="plantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Planta</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={loadingData}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma planta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availablePlants.map((plant) => (
                        <SelectItem key={plant.id} value={plant.id}>
                          {plant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {selectedPlant && (
                      <div className="text-sm text-muted-foreground">
                        {selectedPlant.description}
                      </div>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo de estufa - esconder se só tiver uma */}
            {userGreenhouses.length > 1 ? (
              <FormField
                control={form.control}
                name="greenhouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estufa</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={loadingData}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma estufa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userGreenhouses.map((greenhouse) => (
                          <SelectItem key={greenhouse.id} value={greenhouse.id}>
                            <div className="flex items-center gap-2">
                              <span>{greenhouse.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {greenhouse.isOnline ? "🟢" : "🔴"}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : userGreenhouses.length === 1 ? (
              <div className="p-3 bg-muted/50 rounded-lg border">
                <p className="text-sm text-muted-foreground">
                  Estufa:{" "}
                  <span className="font-medium text-foreground">
                    {userGreenhouses[0].name}
                  </span>
                  <span className="ml-2 text-xs">
                    {userGreenhouses[0].isOnline ? "🟢 Online" : "🔴 Offline"}
                  </span>
                </p>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Você precisa ter pelo menos uma estufa cadastrada para
                  adicionar plantas.
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apelido (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Minha Tomateira"
                      {...field}
                      disabled={loadingData}
                    />
                  </FormControl>
                  <FormDescription>
                    Um nome personalizado para identificar esta planta.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedPlant && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Parâmetros Ideais</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Temperatura:</span>{" "}
                    {selectedPlant.air_temperature_initial}°C -{" "}
                    {selectedPlant.air_temperature_final}°C
                  </div>
                  <div>
                    <span className="font-medium">Umidade:</span>{" "}
                    {selectedPlant.air_humidity_initial}% -{" "}
                    {selectedPlant.air_humidity_final}%
                  </div>
                  <div>
                    <span className="font-medium">Umidade do Solo:</span>{" "}
                    {selectedPlant.soil_moisture_initial}% -{" "}
                    {selectedPlant.soil_moisture_final}%
                  </div>
                  <div>
                    <span className="font-medium">Temp. do Solo:</span>{" "}
                    {selectedPlant.soil_temperature_initial}°C -{" "}
                    {selectedPlant.soil_temperature_final}°C
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || loadingData}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  "Adicionar Planta"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
