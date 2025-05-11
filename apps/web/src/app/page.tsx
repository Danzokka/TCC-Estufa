import PlantAlerts from "@/components/Home/PlantAlerts";
import { PlantDays, PlantStats } from "@/components/Home/PlantData";
import React from "react";
import { getSession } from "./actions";
import { redirect } from "next/navigation";

const Home = async () => {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/auth/login");
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 px-8 lg:px-12 gap-8">
      <h2 className="text-3xl font-bold">Estufa Inteligente</h2>
      <PlantDays />
      <PlantStats />
      <PlantAlerts className="w-full lg:w-[calc(100vw/3)]" />
    </div>
  );
};

export default Home;
