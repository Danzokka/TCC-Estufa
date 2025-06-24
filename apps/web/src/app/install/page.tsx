"use client";

import InstallPrompt from "./components/install-prompt";
import PushNotificationManager from "./components/push-notification-manager";
import React, { useEffect, useState } from "react";

export default function Page() {
  const [deviceInfo, setDeviceInfo] = useState({
    isIOS: false,
    isStandalone: false,
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
      const isStandalone = window.matchMedia(
        "(display-mode: standalone)"
      ).matches;

      setDeviceInfo({ isIOS, isStandalone });
    }
  }, []);

  return (
    <div className="w-full h-[calc(100vh-4rem)] gap-8 flex flex-col items-center py-4 bg-[url('/blobs/waves-light.svg')] dark:bg-[url('/blobs/waves-dark.svg')] bg-no-repeat bg-cover bg-center">
      <h2 className="font-bold text-3xl">Instalação</h2>
      <div className="w-full px-4 md:w-2/5 flex flex-col items-center justify-center gap-8 mb-8 md:mb-0">
        <InstallPrompt
          isIOS={deviceInfo.isIOS}
          isStandalone={deviceInfo.isStandalone}
        />
        <PushNotificationManager />
      </div>
    </div>
  );
}
