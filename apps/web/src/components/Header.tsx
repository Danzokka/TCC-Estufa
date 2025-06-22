import React from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import ThemeSwitcher from "./ThemeSwitcher";
import { SidebarTrigger } from "./ui/sidebar";
import Notification from "./Notifications";
import Logo from "./Logo";
import { getSession } from "@/server/actions/session";
import UserMenu from "./UserMenu";

const NavLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  return (
    <li>
      <Button
        className="text-foreground transition hover:text-foreground/75"
        variant="ghost"
        asChild
      >
        <Link href={href}>{children}</Link>
      </Button>
    </li>
  );
};

const Header = async () => {
  const user = await getSession();

  const links = [
    { href: "/about", label: "Sobre" },
    { href: "/install", label: "Instalação" },
    { href: "/blog", label: "Blog" },
  ];

  return (
    <header className="">
      <div className="mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="md:flex md:items-center md:gap-12">
            <Link className="block text-primary" href="/">
              <Logo />
            </Link>
            <div className="hidden md:block">
              <nav aria-label="Global">
                <ul className="flex items-center gap-6 text-sm">
                  {links.map((link) => (
                    <NavLink key={link.label} href={link.href}>
                      {link.label}
                    </NavLink>
                  ))}
                </ul>
              </nav>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Notification />
            <ThemeSwitcher />
            <div className="sm:flex sm:gap-4">
              {user.isLoggedIn ? (
                <UserMenu user={user} />
              ) : (
                <Button
                  className="bg-secondary text-white font-bold shadow-sm"
                  asChild
                  variant="secondary"
                >
                  <Link href="/login">Login</Link>
                </Button>
              )}
            </div>
            <SidebarTrigger className="size-8 md:hidden" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
