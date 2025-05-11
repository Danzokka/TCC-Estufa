import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { SessionData } from "@/app/lib";
import Link from "next/link";
import { ChartNoAxesColumn, Settings, User2 } from "lucide-react";
import LogoutButton from "./Logout";

interface UserMenuProps {
  user: SessionData;
}

const UserMenu = ({ user }: UserMenuProps) => {
  const menuItems = [
    {
      label: "Profile",
      href: "/profile",
      icon: <User2 className="w-4 h-4 text-foreground" />,
    },
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <ChartNoAxesColumn className="w-4 h-4 text-foreground" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="w-4 h-4 text-foreground" />,
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer" asChild>
        <Avatar
          className="bg-secondary text-white font-bold shadow-sm size-8"
          asChild
        >
          <AvatarImage src={user.image} alt="User Avatar" />
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>User Menu</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menuItems.map((item) => (
          <DropdownMenuItem key={item.label} className="cursor-pointer">
            <Link
              href={item.href}
              className="w-full h-full flex items-center gap-2"
            >
              {item.icon}
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <LogoutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
