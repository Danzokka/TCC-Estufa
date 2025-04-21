"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Footer from "./Footer";

const FooterHandler = () => {
  const pathname = usePathname();

  const showFooter =
    pathname !== "/install" &&
    pathname !== "/auth/login" &&
    pathname !== "/auth/signup";

  if (!showFooter) {
    return null;
  }

  return <Footer />;
};

export default FooterHandler;
