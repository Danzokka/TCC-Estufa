"use server";

import webpush from "web-push";

// Define the browser PushSubscription interface with keys
interface BrowserPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

webpush.setVapidDetails(
  "https://example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

let subscription: webpush.PushSubscription | null = null;

export async function subscribeUser(sub: BrowserPushSubscription) {
  // Convert browser PushSubscription to web-push compatible format
  const webpushSubscription: webpush.PushSubscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
  };

  subscription = webpushSubscription;
  // In a production environment, you would want to store the subscription in a database
  // For example: await db.subscriptions.create({ data: sub })
  return { success: true };
}

export async function unsubscribeUser() {
  subscription = null;
  // In a production environment, you would want to remove the subscription from the database
  // For example: await db.subscriptions.delete({ where: { ... } })
  return { success: true };
}

export async function sendNotification(message: string) {
  if (!subscription) {
    throw new Error("No subscription available");
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: "Test Notification",
        body: message,
        icon: "/icon.png",
      })
    );
    return { success: true };
  } catch (error) {
    console.error("Error sending push notification:", error);
    return { success: false, error: "Failed to send notification" };
  }
}
