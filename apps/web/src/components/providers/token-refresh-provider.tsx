"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/server/actions/session";
import { refreshToken } from "@/server/actions/auth";

/**
 * Componente que renova automaticamente o access token
 * antes que ele expire (15 minutos)
 *
 * Usa Server Actions para manter consistência com o padrão do projeto
 */
export function TokenRefreshProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Renovar token a cada 10 minutos (access token expira em 15 minutos)
    const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutos em ms

    const handleRefreshToken = async () => {
      try {
        const session = await getSession();

        if (!session.isLoggedIn || !session.refreshToken) {
          console.log("Usuário não autenticado, ignorando refresh");
          return;
        }

        // Chamar server action para renovar o token
        await refreshToken(session.refreshToken);
        console.log("Token renovado com sucesso");
      } catch (error) {
        console.error("Erro ao renovar token:", error);
        // Se o refresh falhar, redirecionar para login
        router.push("/login");
      }
    };

    // Executar primeira renovação após 10 minutos
    const intervalId = setInterval(handleRefreshToken, REFRESH_INTERVAL);

    // Cleanup ao desmontar
    return () => clearInterval(intervalId);
  }, [router]);

  return <>{children}</>;
}
