import React from "react";
import { Skeleton } from "./ui/skeleton";

export const PlantDaysSkeleton = () => {
  return (
    <>
      {/*Dias*/}
      <div className="flex flex-col items-center justify-center gap-2">
        <span className="text-xl font-semibold">Tempo</span>
        <Skeleton className="h-8 w-16 bg-secondary text-white dark:text-primary px-4 py-1" />
        <span className="text-lg">dias</span>
      </div>
      {/*Imagem*/}
      <div>
        <Skeleton className="rounded-full object-contain w-48 h-48 bg-secondary dark:bg-primary" />
      </div>
      {/*Saude*/}
      <div className="flex flex-col items-center justify-center gap-2">
        <span className="text-xl font-semibold">Saúde</span>
        <Skeleton className="h-8 w-16 bg-secondary text-white dark:text-primary px-4 py-1" />
      </div>
    </>
  );
};

export const WaterChartSkeleton = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <Skeleton className="h-48 w-1/3 bg-secondary text-white dark:text-primary px-4 py-1 rounded-full" />
    </div>
  );
};

export const PlantAlertsSkeleton = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <Skeleton className="h-52 w-full bg-secondary text-white dark:text-primary px-4 py-1" />
    </div>
  );
}
