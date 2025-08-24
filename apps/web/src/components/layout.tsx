import React from "react";
import Header from "./header";
import { Toaster } from "sonner";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Header />
      <main className="container mx-auto flex h-full w-full max-w-4xl flex-1 flex-col p-4 sm:py-8">
        {children}
      </main>
      <Toaster />
    </>
  );
};

export default Layout;
