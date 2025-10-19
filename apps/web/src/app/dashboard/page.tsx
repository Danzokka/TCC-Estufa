import React from "react";
import { getSession } from "@/server/actions/session";
import { redirect } from "next/navigation";
import { DashboardContent } from "./_components/dashboard-content";
import { getUserPlants } from "@/server/actions/plant";
import PlantSelect from "@/components/home/plant-select";

const Dashboard = async () => {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/login");
  }

  // Buscar plantas do usuário
  let plants: Awaited<ReturnType<typeof getUserPlants>> = [];
  try {
    plants = await getUserPlants();
  } catch (error) {
    console.error("Error loading plants:", error);
  }

  const defaultPlant = plants[0];

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Dashboard content */}
      {defaultPlant ? (
        <DashboardContent plantId={defaultPlant.id} />
      ) : (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Nenhuma planta cadastrada</h2>
            <p className="text-muted-foreground">
              Adicione uma planta para começar a monitorar sua estufa.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
