import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="w-full h-[calc(100vh-4rem)] bg-[url('/blobs/blob-light.svg')] dark:bg-[url('/blobs/blob-dark.svg')] bg-no-repeat bg-cover bg-center flex items-center justify-center px-4">
          {children}
    </section>
  );
}
