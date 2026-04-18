"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { ReactNode } from "react";
import AuthForm from "./AuthForm";
import ProfileBootstrap from "./ProfileBootstrap";

export default function AuthGate({ children }: { children: ReactNode }) {
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
      <Authenticated>
        <ProfileBootstrap />
        {children}
      </Authenticated>
    </>
  );
}
