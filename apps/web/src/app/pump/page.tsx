import React from "react";
import { getSession } from "@/server/actions/session";
import { redirect } from "next/navigation";
import { PumpControlPanel } from "@/components/pump/pump-control-panel";
import { PumpHistory } from "@/components/pump/pump-history";

const PumpControlPage = async () => {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Controle de Irrigação</h1>
        <p className="text-muted-foreground">
          Controle completo da bomba d&apos;água e histórico de operações
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Control Panel */}
        <div>
          <PumpControlPanel
            greenhouseId="greenhouse-1"
          />
        </div>

        {/* History */}
        <div>
          <PumpHistory
            greenhouseId="greenhouse-1"
            maxItems={10}
            autoRefresh={true}
          />
        </div>
      </div>
    </div>
  );
};

export default PumpControlPage;
