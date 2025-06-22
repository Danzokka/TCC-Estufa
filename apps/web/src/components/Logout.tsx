"use client";
import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { logout } from "@/server/actions/session";

const LogoutButton = () => {
  const handleLogout = async () => {
    await logout();
    redirect("/auth/login");
  };
  return (
    <div
      className="w-full h-full flex items-center gap-2"
      onClick={handleLogout}
    >
      <LogOut className="w-4 h-4 text-foreground" />
      Logout
    </div>
  );
};

export default LogoutButton;
