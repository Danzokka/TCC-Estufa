"use client";

import React from "react";
import { Home, Settings, ChartNoAxesColumn } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NavLink = ({ href, label, icon }: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      className={`p-2 flex flex-col items-center justify-center w-16 ${isActive ? "text-primary" : "text-foreground"}`}
      href={href}
    >
      {icon}
      <span
        className={`text-xs {isActive ? "text-primary" : "text-foreground"}`}
      >
        {label}
      </span>
    </Link>
  );
};

// Navegacao do APP para dispositivos moveis fixado na parte inferior da tela
const Nav = () => {
  const links = [
    { href: "/", label: "Home", icon: <Home /> },
    { href: "/dashboard", label: "Métricas", icon: <ChartNoAxesColumn /> },
    { href: "/settings", label: "Configurações", icon: <Settings /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between bg-background border-t border-secondary h-20">
      <div className="flex items-center justify-between w-full px-4 py-2">
        {links.map((link) => (
          <NavLink key={link.label} {...link} />
        ))}
      </div>
    </div>
  );
};

export default Nav;
