import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

const CTA = () => {
  return (
    <section className="">
      <div className="px-4 sm:px-6">
        <div className="mx-auto max-w-prose text-center">
          <h1 className="text-4xl font-bold sm:text-4xl">
            Understand user flow and
            <strong className="text-primary"> increase </strong>
            conversions
          </h1>

          <p className="mt-4 text-base text-foreground/75">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Eaque,
            nisi. Natus, provident accusamus impedit minima harum corporis
            iusto.
          </p>

          <div className="mt-4 flex justify-center gap-4 sm:mt-6">
            <Button asChild>
              <Link href="/auth/signin">Get Started</Link>
            </Button>

            <Button asChild variant="outline">
              <Link href="/">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
