import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";
import Github from "../icons/github";
import Instagram from "../icons/instagram";
import Logo from "../icons/logo";

const SocialLinks = ({
  href,
  icon,
}: {
  href: string;
  icon: React.ReactNode;
}) => {
  return (
    <Button
      variant="ghost"
      className="p-0 rounded-full hover:scale-110"
      size={"icon"}
      asChild
    >
      <Link href={href}>{icon}</Link>
    </Button>
  );
};

const Footer = () => {
  const socialLinks = [
    {
      href: "https://github.com",
      icon: <Github className="h-5 w-5" />,
    },
    {
      href: "https://instagram.com",
      icon: <Instagram className="h-5 w-5" />,
    },
  ];
  return (
    <footer className="">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 md:px-8">
        <div className="flex justify-center text-primary">
          <Logo className="flex w-full items-center justify-center" showTitle />
        </div>

        <p className="mx-auto mt-6 max-w-md text-center leading-relaxed text-foreground/75">
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Incidunt
          consequuntur amet culpa cum itaque neque.
        </p>

        <ul className="mt-12 flex justify-center gap-6 md:gap-8">
          {socialLinks.map((link) => (
            <li key={link.href}>
              <SocialLinks {...link} />
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
