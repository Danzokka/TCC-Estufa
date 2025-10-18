import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function IrrigationPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Controle de Irrigação
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sistema de Irrigação</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta página está em desenvolvimento. Aqui você poderá controlar o
            sistema de irrigação da sua estufa.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
