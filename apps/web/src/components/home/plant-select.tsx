"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePlant } from "@/context/plant-provider";

export default function PlantSelect() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userPlants, isLoading } = usePlant();

  // Get selected plant with priority: URL > localStorage > first plant
  const selectedPlantId = searchParams.get("plantId");
  const savedPlantId =
    typeof window !== "undefined"
      ? localStorage.getItem("selectedPlantId")
      : null;

  const selectedPlant =
    userPlants?.find((plant) => plant.id === selectedPlantId) ||
    userPlants?.find((plant) => plant.id === savedPlantId) ||
    userPlants?.[0] ||
    null;

  // Initialize URL with saved plant if no plantId in URL
  React.useEffect(() => {
    if (
      !selectedPlantId &&
      savedPlantId &&
      userPlants &&
      userPlants.length > 0
    ) {
      const plantExists = userPlants.some((plant) => plant.id === savedPlantId);
      if (plantExists) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("plantId", savedPlantId);
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    }
  }, [selectedPlantId, savedPlantId, userPlants, searchParams, router]);

  const handlePlantSelect = (plant: any) => {
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedPlantId", plant.id);
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("plantId", plant.id);
    router.push(`?${params.toString()}`, { scroll: false });
    setOpen(false);
  };

  if (!isLoading && !userPlants) {
    return <div>Erro ao carregar</div>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="">
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            {selectedPlant
              ? selectedPlant.nickname || selectedPlant.plant.name
              : "Selecione a planta"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Buscar planta..." />
          <CommandList>
            <CommandEmpty>Nenhuma planta encontrada.</CommandEmpty>
            <CommandGroup>
              {userPlants?.map((userPlant) => (
                <CommandItem
                  key={userPlant.id}
                  value={userPlant.nickname || userPlant.plant.name}
                  onSelect={() => handlePlantSelect(userPlant)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedPlant?.id === userPlant.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {userPlant.nickname || userPlant.plant.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
