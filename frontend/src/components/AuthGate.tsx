"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import AuthForm from "./AuthForm";

export default function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname?.startsWith("/mobile-auth")) {
    return <>{children}</>;
  }

  return (
    <>
      <AuthLoading>
        <main className="page" style={{ display: "grid", placeItems: "center", minHeight: "calc(100vh - var(--nav-h))" }}>
          <p className="text-muted">Restoring your session…</p>
        </main>
      </AuthLoading>
      <Unauthenticated>
        <AuthForm />
      </Unauthenticated>
      <Authenticated>{children}</Authenticated>
    </>
  );
}
