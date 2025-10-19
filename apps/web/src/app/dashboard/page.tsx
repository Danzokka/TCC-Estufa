import React from "react";
import { getSession } from "@/server/actions/session";
import { redirect } from "next/navigation";
import { DashboardContent } from "./_components/dashboard-content";

const Dashboard = async () => {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/login");
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <DashboardContent />
    </div>
  );
};

export default Dashboard;
