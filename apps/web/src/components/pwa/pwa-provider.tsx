"use client";

import React, { useState, useEffect } from "react";
import { PWAInstallModal } from "@/components/pwa/pwa-install-modal";
import { usePWA } from "@/hooks/usePWA";

export function PWAProvider() {
  const [showModal, setShowModal] = useState(false);
  const { showInstallPrompt, isInstalled } = usePWA();

  useEffect(() => {
    // Mostrar modal automaticamente se deve mostrar o prompt
    if (showInstallPrompt && !isInstalled) {
      // Aguardar um pouco para não aparecer imediatamente
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 3000); // 3 segundos após carregar

      return () => clearTimeout(timer);
    }
  }, [showInstallPrompt, isInstalled]);

  return (
    <PWAInstallModal 
      open={showModal} 
      onOpenChange={setShowModal} 
    />
  );
}
