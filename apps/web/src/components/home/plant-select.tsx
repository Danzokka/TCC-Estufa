"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

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
  const { selectedPlant, setSelectedPlant, userPlants, isLoading } = usePlant();

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
                  onSelect={() => {
                    setSelectedPlant(userPlant);
                    setOpen(false);
                  }}
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
