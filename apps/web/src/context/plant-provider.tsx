"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { UserPlant } from "@/@types/plant";
import { getUserPlants, getActivePlant } from "@/server/actions/plant";
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
  const [hasInitializedPlant, setHasInitializedPlant] = useState(false);

  const {
    data: userPlants,
    isLoading: isLoadingPlants,
    error: plantsError,
  } = useQuery({
    queryKey: ["userPlants"],
    queryFn: async () => await getUserPlants(),
  });

  const { data: activePlantData, isLoading: isLoadingActive } = useQuery({
    queryKey: ["activePlant"],
    queryFn: async () => await getActivePlant(),
  });

  useEffect(() => {
    // Only initialize once when data is loaded
    if (hasInitializedPlant || !userPlants || userPlants.length === 0) {
      return;
    }

    // Try to use active plant first
    if (activePlantData) {
      // Find the matching UserPlant from userPlants array
      const matchingPlant = userPlants.find(
        (plant) => plant.id === activePlantData.id
      );
      if (matchingPlant) {
        setSelectedPlant(matchingPlant);
        setHasInitializedPlant(true);
        return;
      }
    }

    // Fallback to first plant if no active plant found
    if (!selectedPlant && userPlants.length > 0) {
      setSelectedPlant(userPlants[0]);
      setHasInitializedPlant(true);
    }
  }, [userPlants, activePlantData, selectedPlant, hasInitializedPlant]);

  const isLoading = isLoadingPlants || isLoadingActive;

  return (
    <PlantContext.Provider
      value={{
        selectedPlant,
        setSelectedPlant,
        userPlants: userPlants ?? null,
        isLoading,
        error: plantsError as Error | null,
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
