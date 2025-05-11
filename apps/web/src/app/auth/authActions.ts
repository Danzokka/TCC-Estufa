"use server";

import api from "@/lib/api";
import { login as SessionLogin } from "../actions";

export async function login(email: string, password: string) {

  console.log("email", email);
  console.log("password", password);

  const response = await api.post("/auth", { email, password });

  console.log("response", response);
  if (!response.data.accessToken) {
    throw new Error("Login failed");
  }

  const { accessToken, username, name, imagem, id } = response.data;

  await SessionLogin({
    userid: id,
    username,
    email,
    name,
    image: imagem,
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
  console.log("response", response);
  return response.data;
}
