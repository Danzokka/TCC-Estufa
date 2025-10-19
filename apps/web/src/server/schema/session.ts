import { SessionOptions } from "iron-session";

export interface SessionData {
  userid?: string;
  username?: string;
  name?: string;
  email?: string;
  image?: string;
  token?: string;
  refreshToken?: string;
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
};

export const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    "complex_password_at_least_32_characters_long",
  cookieName: "smart-greenhouse",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Sessão permanente: 30 dias (mesmo tempo do refresh token)
    maxAge: 60 * 60 * 24 * 30, // 30 dias em segundos
  },
};
