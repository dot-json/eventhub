import React from "react";
import Header from "./header";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Header />
      <main className="container mx-auto flex h-full w-full max-w-4xl flex-1 flex-col p-4 sm:py-8">
        {children}
      </main>
    </>
  );
};

export default Layout;
