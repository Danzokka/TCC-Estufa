"use client";
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Clock } from "lucide-react";
import Link from "next/link";
import { login } from "@/server/actions/auth";
import { redirect } from "next/navigation";
import { useCaptcha } from "@/hooks/use-captcha";
import ReCaptzWrapper from "@/components/ui/recaptz-wrapper";

const formSchema = z.object({
  email: z.string().email({
    message: "Invalid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    isCaptchaRequired,
    isBlocked,
    attempts,
    canAttemptLogin,
    blockTimeRemaining,
    recordAttempt,
    resetAttempts,
    verifyCaptcha,
  } = useCaptcha();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Verificar se pode tentar login
    if (!canAttemptLogin) {
      if (isBlocked) {
        setError(
          `Muitas tentativas de login. Tente novamente em ${blockTimeRemaining}`
        );
      } else {
        setError("Por favor, complete o captcha para continuar.");
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Passar dados do captcha se necessário
      const captchaData = isCaptchaRequired
        ? {
            captcha: captchaValue,
            captchaId: captchaId,
          }
        : {};

      await login(
        values.email,
        values.password,
        captchaData.captcha,
        captchaData.captchaId
      );

      // Login bem-sucedido - resetar tentativas
      resetAttempts();
      redirect("/");
    } catch (err: any) {
      console.error("Login error:", err);

      // Registrar tentativa falhada
      recordAttempt(false);

      // Tratar diferentes tipos de erro
      if (err.message?.includes("Usuário não encontrado")) {
        setError("Usuário não encontrado. Verifique seu email.");
      } else if (err.message?.includes("Senha incorreta")) {
        setError("Senha incorreta. Tente novamente.");
      } else if (err.message?.includes("Too Many Requests")) {
        setError(
          "Muitas tentativas de login. Aguarde um momento e tente novamente."
        );
      } else {
        setError("Erro ao fazer login. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <h2 className="text-2xl font-bold text-center text-foreground">
          Login
        </h2>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isBlocked && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Muitas tentativas de login. Tente novamente em{" "}
              {blockTimeRemaining}
            </AlertDescription>
          </Alert>
        )}

        {attempts > 0 && !isBlocked && (
          <Alert>
            <AlertDescription>
              Tentativas de login: {attempts}/5
              {attempts >= 3 && " - Captcha necessário"}
            </AlertDescription>
          </Alert>
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="example@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ReCaptzWrapper
          onVerify={verifyCaptcha}
          isRequired={isCaptchaRequired}
          isBlocked={isBlocked}
        />

        <div className="flex flex-col items-center justify-center w-full gap-4">
          <p className="w-full text-left text-sm text-foreground/65">
            Não tem uma conta?{" "}
            <Link href="/signup" className="text-foreground hover:underline">
              Clique aqui
            </Link>
            para criar sua conta
          </p>
          <Button
            type="submit"
            disabled={isLoading || !canAttemptLogin}
            className="hover:cursor-pointer text-foreground bg-primary/60 w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : isBlocked ? (
              `Bloqueado (${blockTimeRemaining})`
            ) : isCaptchaRequired && !canAttemptLogin ? (
              "Complete o captcha"
            ) : (
              "Realizar Login"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default LoginForm;
