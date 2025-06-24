"use client";
import React, { useRef, useEffect } from "react";
import {
  useSidebar,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  ChartNoAxesColumn,
  Download,
  Globe,
  Home,
  MessagesSquare,
  Settings,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "../icons/logo";

const items = [
  { title: "Home", url: "/", icon: Home },
  { title: "Sobre", url: "/about", icon: Globe },
  { title: "Blog", url: "/blog", icon: MessagesSquare },
  { title: "Instalação", url: "/install", icon: Download },
  { title: "Dashboard", url: "/dashboard", icon: ChartNoAxesColumn },
  { title: "Perfil", url: "/profile", icon: User },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  const { open, setOpen, isMobile } = useSidebar();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || isMobile) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, setOpen, isMobile]);

  if (!open && !isMobile) return null;

  return (
    <Sidebar side="right" className="md:hidden" ref={sidebarRef}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarHeader>
            <Logo showTitle />
          </SidebarHeader>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className={`flex items-center gap-2 ${pathname === item.url ? "text-primary" : "text-foreground"}`}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
