/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import Image from "next/image";
import React from "react";
import { Card } from "@/components/ui/card";
import { Droplet, Sprout, Thermometer } from "lucide-react";
import WaterChart from "@/components/Home/WaterChart";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { PlantDaysSkeleton, WaterChartSkeleton } from "../Skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlantData, getPlantStats } from "@/app/plantActions";
import { usePlant } from "@/context/PlantContext";

export const PlantDays = () => {
  const { selectedPlant } = usePlant();

  const { data: plantData, isLoading } = useQuery({
    queryKey: ["plantData", selectedPlant?.id],
    queryFn: () => (selectedPlant ? getPlantData(selectedPlant.id) : null),
    //Refetch every 5 minutes
    refetchInterval: 5 * 60 * 1000,
    enabled: !!selectedPlant,
  });

  return (
    <Card className="flex gap-4 lg:gap-8 flex-row p-4 lg:p-8 w-full lg:w-[calc(100vw/3)] justify-between">
      {isLoading ? (
        <PlantDaysSkeleton />
      ) : (
        <>
          {/*Dias*/}
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-xl font-semibold">Tempo</span>
            <span className="text-2xl font-bold">{plantData?.days || 0}</span>
            <span className="text-lg">dias</span>
          </div>
          {/*Imagem*/}
          <div>
            <Image
              src="/icons/plant-dark.svg"
              alt="Plant"
              width={180}
              height={180}
              className="rounded-full object-contain w-48 h-48 hidden dark:block"
            />
            <Image
              src="/icons/plant-light.svg"
              alt="Plant"
              width={180}
              height={180}
              className="rounded-full object-contain w-48 h-48 block dark:hidden"
            />
          </div>
          {/*Saude*/}
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-xl font-semibold">Saúde</span>
            <span className="text-lg font-bold bg-secondary text-white dark:text-primary px-4 py-1 rounded-3xl">
              {plantData?.health || 0}%
            </span>
          </div>
        </>
      )}
    </Card>
  );
};

export const PlantStats = () => {
  const { selectedPlant } = usePlant();

  const { data: plantStats, isLoading } = useQuery({
    queryKey: ["plantstats", selectedPlant?.id],
    queryFn: () => (selectedPlant ? getPlantStats(selectedPlant.id) : null),
    refetchInterval: 5 * 60 * 1000,
    enabled: !!selectedPlant,
  });

  const iconClassName = "w-16 h-16 text-primary";

  const stats = [
    {
      title: "Umidade",
      value: isLoading ? (
        <Skeleton className="h-8 w-16 bg-secondary text-white dark:text-primary px-4 py-1" />
      ) : (
        "50%"
      ),
      icon: <Droplet className={iconClassName} />,
    },
    {
      title: "Temperatura",
      value: isLoading ? (
        <Skeleton className="h-8 w-16 bg-secondary text-white dark:text-primary px-4 py-1" />
      ) : (
        "25°C"
      ),
      icon: <Thermometer className={iconClassName} />,
    },
    {
      title: "Solo",
      value: isLoading ? (
        <Skeleton className="h-8 w-16 bg-secondary text-white dark:text-primary px-4 py-1" />
      ) : (
        "80%"
      ),
      icon: <Sprout className={iconClassName} />,
    },
  ];
  return (
    <div className="w-full lg:w-[calc(100vw/3)] flex flex-col gap-4 lg:gap-8">
      <Card className="gap-8 p-8">
        <h2 className="text-xl font-bold w-full text-left">Nível de Água</h2>
        {isLoading ? <WaterChartSkeleton /> : <WaterChart />}
      </Card>
      <div className="flex flex-col lg:flex-row w-full gap-4">
        {stats.map((stat, index) => (
          <Stat key={index} props={stat} />
        ))}
      </div>
    </div>
  );
};

interface StatProps {
  props: {
    title: string;
    value: string | React.ReactNode;
    icon: React.ReactNode;
  };
}

const Stat = ({ props }: StatProps) => {
  return (
    <Card className="flex flex-row items-center gap-2 p-4 w-full">
      {props.icon}
      <div className="flex flex-col gap-2 items-center w-full">
        <span className="text-xl font-semibold">{props.title}</span>
        <span className="text-xl font-bold text-primary">{props.value}</span>
      </div>
    </Card>
  );
};
