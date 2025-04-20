"use client";

import InstallPrompt from "./components/InstallPrompt";
import PushNotificationManager from "./components/PushNotificationManager";
import React from "react";

export default function Page() {
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  return (
    <div className="w-full h-full gap-8 flex flex-col items-center justify-center">
      <h2 className="font-bold text-3xl">Instalação</h2>
      <div className="w-2/5 flex flex-col items-center justify-center gap-8">
        <InstallPrompt isIOS={isIOS} isStandalone={isStandalone} />
        <PushNotificationManager />
      </div>
    </div>
  );
}
