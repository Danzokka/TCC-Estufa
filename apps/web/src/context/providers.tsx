"use client";

import { ReactQueryProvider } from "./query-provider";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <ReactQueryProvider>{children}</ReactQueryProvider>;
}
