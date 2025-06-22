"use client";

import React from "react";
import { useEffect, useState } from "react";
import {
  subscribeUser,
  unsubscribeUser,
  sendNotification,
} from "@/server/actions/notification"; 
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    const sub = await registration.pushManager.getSubscription();
    setSubscription(sub);
  }

  async function subscribeToPush() {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    });
    setSubscription(sub);
    const serializedSub = JSON.parse(JSON.stringify(sub));
    await subscribeUser(serializedSub);
  }

  async function unsubscribeFromPush() {
    await subscription?.unsubscribe();
    setSubscription(null);
    await unsubscribeUser();
  }

  async function sendTestNotification() {
    if (subscription) {
      await sendNotification(message);
      setMessage("");
    }
  }

  if (!isSupported) {
    return <p>Push notifications are not supported in this browser.</p>;
  }

  return (
    <Card className="p-8 w-full flex flex-col items-center justify-center gap-4 bg-background">
      <h2 className="text-xl font-semibold text-foreground">
        Habilitar Notificação
      </h2>
      {subscription ? (
        <>
          <p className="text-lg text-foreground">
            As notificações estão ativas
          </p>
          <Input
            type="text"
            placeholder="Insira sua mensagem"
            value={message}
            className="w-52"
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex gap-4">
            <Button
              onClick={unsubscribeFromPush}
              variant="destructive"
              className="cursor-pointer font-bold"
            >
              Desabilitar
            </Button>
            <Button
              onClick={sendTestNotification}
              className="cursor-pointer font-bold text-foreground bg-primary/60 w-24"
            >
              Testar
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-lg text-foreground">
            As notificações estão desabilitadas
          </p>
          <Button
            onClick={subscribeToPush}
            className="cursor-pointer font-bold text-foreground bg-primary/60 w-24"
          >
            Habilitar
          </Button>
        </>
      )}
    </Card>
  );
}

export default PushNotificationManager;
