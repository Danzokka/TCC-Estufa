"use client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { getSession, logout as sessionLogout } from "@/server/actions/session";
import { logout as authLogout } from "@/server/actions/auth";

const LogoutButton = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      // Pegar refreshToken da sessão antes de destruir
      const session = await getSession();

      // Chamar logout do backend (revoke refresh token)
      if (session.refreshToken) {
        await authLogout(session.refreshToken);
      }

      // Destruir sessão local
      await sessionLogout();

      // Redirecionar para login
      startTransition(() => {
        router.push("/login");
        router.refresh();
      });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);

      // Mesmo com erro, destruir sessão local
      await sessionLogout();

      startTransition(() => {
        router.push("/login");
        router.refresh();
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-full h-full flex items-center gap-2"
      onClick={handleLogout}
    >
      <LogOut className="w-4 h-4 text-foreground" />
      {isLoading || isPending ? "Saindo..." : "Logout"}
    </div>
  );
};

export default LogoutButton;
