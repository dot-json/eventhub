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
      <Toaster
        toastOptions={{
          //duration: 3000,
          classNames: {
            success: "bg-green-500 text-white",
            error: "bg-red-500 text-white",
          },
        }}
      />
    </>
  );
};

export default Layout;
