import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AlertsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Alertas e Notificações
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Central de Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta página está em desenvolvimento. Aqui você poderá visualizar e
            gerenciar alertas sobre condições críticas da estufa.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
