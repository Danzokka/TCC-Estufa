/* eslint-disable @next/next/no-img-element */
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative flex flex-wrap lg:h-screen lg:items-center">
      <div className="w-full px-4 py-12 sm:px-6 sm:py-16 lg:w-3/5 lg:px-8 lg:py-24 h-full bg-[url('/blobs/blob-light.svg')] dark:bg-[url('/blobs/blob-dark.svg')] bg-no-repeat bg-cover bg-center">
        <div className="w-full h-full flex items-center justify-center">
          {children}
        </div>
      </div>

      <div className="relative h-64 w-full sm:h-96 lg:h-full lg:w-2/5 bg-primary">
        <img
          alt=""
          src="/medics/heart.png"
          className="absolute inset-0 h-full w-full object-contain"
        />
      </div>
    </section>
  );
}
