"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { UserPlant } from "@/@types/plant";
import { getUserPlants } from "@/server/actions/plant";
import { useQuery } from "@tanstack/react-query";

interface PlantContextType {
  selectedPlant: UserPlant | null;
  setSelectedPlant: (plant: UserPlant) => void;
  userPlants: UserPlant[] | null;
  isLoading: boolean;
  error: Error | null;
}

const PlantContext = createContext<PlantContextType | undefined>(undefined);

export function PlantProvider({ children }: { children: ReactNode }) {
  const [selectedPlant, setSelectedPlant] = useState<UserPlant | null>(null);

  const {
    data: userPlants,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userPlants"],
    queryFn: async () => await getUserPlants(),
  });

  useEffect(() => {
    // When userPlants data is loaded, set the first plant as selected if not already set
    if (userPlants && userPlants.length > 0 && !selectedPlant) {
      setSelectedPlant(userPlants[0]);
    }
  }, [userPlants, selectedPlant]);

  return (
    <PlantContext.Provider
      value={{
        selectedPlant,
        setSelectedPlant,
        userPlants: userPlants ?? null,
        isLoading,
        error: error as Error | null,
      }}
    >
      {children}
    </PlantContext.Provider>
  );
}

export function usePlant() {
  const context = useContext(PlantContext);
  if (context === undefined) {
    throw new Error("usePlant must be used within a PlantProvider");
  }
  return context;
}
