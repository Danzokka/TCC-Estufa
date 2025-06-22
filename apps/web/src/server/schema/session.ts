import { SessionOptions } from "iron-session";

export interface SessionData {
  userid?: string;
  username?: string;
  name?: string;
  email?: string;
  image?: string;
  token?: string;
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
    maxAge: 60 * 60 * 4,
  },
};
