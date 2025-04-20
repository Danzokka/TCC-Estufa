import PlantAlerts from "@/components/Home/PlantAlerts";
import WaterChart from "@/components/Home/WaterChart";
import { Card } from "@/components/ui/card";
import { Droplet, Sprout, Thermometer } from "lucide-react";
import Image from "next/image";
import React from "react";

const PlantDays = () => {
  return (
    <Card className="flex gap-8 flex-row p-8 w-[calc(100vw/3)] justify-between">
      {/*Dias*/}
      <div className="flex flex-col items-center justify-center gap-2">
        <span className="text-xl font-semibold">Tempo</span>
        <span className="text-2xl font-bold">10</span>
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
          Boa
        </span>
      </div>
    </Card>
  );
};

const PlantStats = () => {

  const iconClassName = "w-16 h-16 text-primary";

  const stats = [
    { title: "Umidade", value: "50%", icon: <Droplet className={iconClassName} /> },
    {
      title: "Temperatura",
      value: "25°C",
      icon: <Thermometer className={iconClassName} />,
    },
    { title: "Solo", value: "80%", icon: <Sprout className={iconClassName} /> },
  ];
  return (
    <div className="w-[calc(100vw/3)] flex flex-col gap-8">
      <Card className="gap-8 p-8">
        <h2 className="text-xl font-bold w-full text-left">
          Nível de Água
        </h2>
        <WaterChart />
      </Card>
      <div className="flex w-full gap-4">
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
    value: string;
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

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-12 gap-8">
      <h2 className="text-3xl font-bold">Estufa Inteligente</h2>
      <PlantDays />
      <PlantStats />
      <PlantAlerts className="w-[calc(100vw/3)]" />
    </div>
  );
};

export default Home;
