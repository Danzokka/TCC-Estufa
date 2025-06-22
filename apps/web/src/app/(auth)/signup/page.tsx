import { Card } from "@/components/ui/card";
import React from "react";
import SignupForm from "./SignupForm";

const page = () => {
  return (
    <Card className="w-full max-w-md p-6 bg-transparent border-secondary">
      <SignupForm />
    </Card>
  );
};

export default page;
