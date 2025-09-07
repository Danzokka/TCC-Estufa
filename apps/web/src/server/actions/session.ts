"use server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import {
  sessionOptions,
  defaultSession,
  SessionData,
} from "@/server/schema/session";

export async function getSession() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

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
  session.name = user.name;
  session.image = user.image;
  session.token = user.token;
  session.refreshToken = user.refreshToken;

  await session.save();
}

export async function logout() {
  const session = await getSession();

  session.destroy();
}
