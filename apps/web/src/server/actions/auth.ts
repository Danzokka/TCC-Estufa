"use server";

import api from "@/lib/api";
import { login as SessionLogin } from "@/server/actions/session";

export async function login(email: string, password: string) {
  const response = await api.post("/auth", { email, password });

  if (!response.data.accessToken) {
    throw new Error("Login failed");
  }

  const { accessToken, username, name, image, id } = response.data;

  await SessionLogin({
    userid: id,
    username,
    email,
    name,
    image,
    token: accessToken,
    isLoggedIn: true,
  });

  return response.data;
}

export async function signup(
  username: string,
  name: string,
  email: string,
  password: string
) {
  const response = await api.post("/user", { username, name, email, password });
  return response.data;
}
