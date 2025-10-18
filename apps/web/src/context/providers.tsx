"use client";

import { ReactQueryProvider } from "./query-provider";
import { Toaster } from "@/components/ui/sonner";
import { ReactNode } from "react";
import { PlantProvider } from "./plant-provider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ReactQueryProvider>
      <PlantProvider>
        {children}
        <Toaster />
      </PlantProvider>
    </ReactQueryProvider>
  );
}
