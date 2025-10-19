import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React from "react";
import { ThemeProvider } from "@/context/theme-provider";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Providers } from "@/context/providers";
import { getSession } from "@/server/actions/session";
import { AlertsBadge } from "@/components/layout/alerts-badge";
import { IrrigationNotification } from "@/components/IrrigationNotification";
import { TokenRefreshProvider } from "@/components/providers/token-refresh-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Estufa Inteligente - Sistema de Monitoramento",
  description:
    "Sistema IoT para monitoramento e controle de estufas inteligentes",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  const user = session.isLoggedIn
    ? {
        name: session.name || "Usuário",
        email: session.email || "",
        image: session.image,
      }
    : undefined;

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="theme"
        >
          <TokenRefreshProvider>
            <Providers>
              {session.isLoggedIn ? (
                <SidebarProvider>
                  <AppSidebar user={user} />
                  <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4">
                      <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <h2 className="text-lg font-semibold">
                          Estufa Inteligente
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertsBadge />
                      </div>
                    </header>
                    <main className="flex flex-1 flex-col">{children}</main>
                    <IrrigationNotification />
                  </SidebarInset>
                </SidebarProvider>
              ) : (
                <main className="min-h-screen">{children}</main>
              )}
            </Providers>
          </TokenRefreshProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
