"use client";

import { useSearchParams } from "next/navigation";
import AuthForm from "@/components/AuthForm";

export default function MobileAuthPage() {
  const searchParams = useSearchParams();
  const redirectUri = searchParams?.get("redirect_uri") ?? null;
  const provider = searchParams?.get("provider") ?? null;

  const callbackURL = redirectUri
    ? `/mobile-auth/callback?redirect_uri=${encodeURIComponent(redirectUri)}`
    : "/";

  return (
    <main className="page" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <AuthForm
          callbackURL={callbackURL}
          autoProvider={provider === "google" || provider === "microsoft" ? provider : undefined}
        />
      </div>
    </main>
  );
}
