"use server";

import { NotificationType } from "@/data/notifications";
import webpush from "web-push";
import { notifications } from "@/data/notifications";
import { SessionData } from "./lib";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, defaultSession } from "./lib";

webpush.setVapidDetails(
  "https://example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

let subscription: webpush.PushSubscription | null = null;

export async function subscribeUser(sub: PushSubscription) {
  subscription = sub;
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

export async function getAlerts(): Promise<NotificationType[]> {
  return notifications.sort((a, b) => {
    return a.timestamp.getTime() - b.timestamp.getTime();
  });
}

export async function getNotifications(): Promise<NotificationType[]> {
  return notifications.sort((a, b) => {
    return a.timestamp.getTime() - b.timestamp.getTime();
  });
}

export async function getSession() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

  if (!session.isLoggedIn) {
    session.isLoggedIn = defaultSession.isLoggedIn;
  }

  return session;
}

export async function login(user: SessionData) {
  const session = await getSession();

  session.isLoggedIn = true;
  session.userid = user.userid;
  session.email = user.email;
  session.username = user.username;
  session.token = user.token;

  await session.save();
}

export async function logout() {
  const session = await getSession();

  session.destroy();
}