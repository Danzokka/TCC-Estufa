"use client";
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { signup } from "../authActions";
import { redirect } from "next/navigation";
const formSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  name: z.string().min(3, {
    message: "Name must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Invalid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

const SignupForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    await signup(values.username, values.name, values.email, values.password);
    redirect("/auth/login");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <h2 className="text-2xl font-bold text-center text-foreground">
          Cadastro
        </h2>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome de Usuário</FormLabel>
              <FormControl>
                <Input placeholder="exemplo123" {...field} />
              </FormControl>
              <FormDescription>Insira seu nome de usuário</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Seu Nome" {...field} />
              </FormControl>
              <FormDescription>Insira seu nome completo</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="example@email.com" {...field} />
              </FormControl>
              <FormDescription>Insira seu email</FormDescription>
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
                <Input placeholder="********" type="password" {...field} />
              </FormControl>
              <FormDescription>
                Insira sua senha de no mínimo 8 digitos
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col items-center justify-center w-full gap-4">
          <p className="w-full text-left text-sm text-foreground/65">
            Já possui um cadastro?{" "}
            <Link
              href="/auth/login"
              className="text-foreground hover:underline"
            >
              Clique aqui
            </Link>{" "}
            para acessar sua conta
          </p>
          <Button
            type="submit"
            className="hover:cursor-pointer text-foreground bg-primary/60 w-full"
          >
            Cadastrar
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default SignupForm;
