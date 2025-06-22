"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Footer from "./footer";

const FooterHandler = () => {
  const pathname = usePathname();

  const showFooter =
    pathname !== "/install" &&
    pathname !== "/login" &&
    pathname !== "/signup";

  if (!showFooter) {
    return null;
  }

  return <Footer />;
};

export default FooterHandler;
