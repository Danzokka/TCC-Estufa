"use client";

import InstallPrompt from "./components/InstallPrompt";
import PushNotificationManager from "./components/PushNotificationManager";
import React from "react";

export default function Page() {
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  return (
    <div className="w-full h-[calc(100vh-4rem)] gap-8 flex flex-col items-center py-4 bg-[url('/blobs/waves-light.svg')] dark:bg-[url('/blobs/waves-dark.svg')] bg-no-repeat bg-cover bg-center">
      <h2 className="font-bold text-3xl">Instalação</h2>
      <div className="w-full px-4 md:w-2/5 flex flex-col items-center justify-center gap-8 mb-8 md:mb-0">
        <InstallPrompt isIOS={isIOS} isStandalone={isStandalone} />
        <PushNotificationManager />
      </div>
    </div>
  );
}
