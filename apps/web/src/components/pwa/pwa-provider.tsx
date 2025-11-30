"use client";

import React, { useState } from "react";
import { PWAInstallModal } from "@/components/pwa/pwa-install-modal";

export function PWAProvider() {
  // Modal desabilitado - só será mostrado manualmente na página /install
  const [showModal, setShowModal] = useState(false);

  return <PWAInstallModal open={showModal} onOpenChange={setShowModal} />;
}
