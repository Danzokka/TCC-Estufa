import PlantAlerts from "@/components/Home/PlantAlerts";
import { PlantDays, PlantStats } from "@/components/Home/PlantData";
import React from "react";
import { getSession } from "@/server/actions/session";
import { redirect } from "next/navigation";
import PlantSelect from "@/components/Home/PlantSelect";
import { PlantProvider } from "@/context/PlantContext";

const Home = async () => {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/login");
  }

  return (
    <PlantProvider>
      <div className="flex flex-col items-center justify-center py-8 px-8 lg:px-12 gap-8 w-full">
        <div className="w-full lg:w-[calc(100vw/3)] flex flex-col items-center justify-center gap-8">
          <h2 className="text-3xl font-bold">Estufa Inteligente</h2>
          <PlantSelect />
          <PlantDays />
          <PlantStats />
          <PlantAlerts />
        </div>
      </div>
    </PlantProvider>
  );
};

export default Home;
