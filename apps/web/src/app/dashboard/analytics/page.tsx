import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Análises</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Análises e Relatórios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta página está em desenvolvimento. Aqui você poderá visualizar
            análises detalhadas e relatórios sobre o crescimento das suas
            plantas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
