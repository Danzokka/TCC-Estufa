"use client";

import { ReactQueryProvider } from "./query-provider";
import { Toaster } from "@/components/ui/sonner";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ReactQueryProvider>
      {children}
      <Toaster />
    </ReactQueryProvider>
  );
}
