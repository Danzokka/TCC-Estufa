"use server";

import api from "@/lib/api";
import { login as SessionLogin } from "@/server/actions/session";

export async function login(
  email: string,
  password: string,
  captcha?: string,
  captchaId?: string
) {
  let response;

  if (captcha && captchaId) {
    // Login com captcha
    response = await api.post("/auth/login-with-captcha", {
      email,
      password,
      captcha,
      captchaId,
    });
  } else {
    // Login normal
    response = await api.post("/auth/login", { email, password });
  }

  console.log("Login response:", response.data);

  if (!response.data.accessToken) {
    throw new Error("Login failed");
  }

  const { accessToken, refreshToken, username, name, image, id } =
    response.data;

  await SessionLogin({
    userid: id,
    username,
    email,
    name,
    image,
    token: accessToken,
    refreshToken,
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

export async function refreshToken(refreshToken: string) {
  const response = await api.post("/auth/refresh", { refreshToken });

  if (!response.data.accessToken) {
    throw new Error("Token refresh failed");
  }

  const { accessToken, user } = response.data;

  await SessionLogin({
    userid: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    image: user.image,
    token: accessToken,
    refreshToken,
    isLoggedIn: true,
  });

  return response.data;
}

export async function logout(refreshToken: string) {
  try {
    await api.post("/auth/logout", { refreshToken });
  } catch (error) {
    console.error("Logout error:", error);
  }
}
