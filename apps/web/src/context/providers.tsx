"use client";

import { ReactQueryProvider } from "./query-provider";
import { SessionProvider } from "./session-provider";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ReactQueryProvider>
      <SessionProvider>{children}</SessionProvider>
    </ReactQueryProvider>
  );
}
