"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function MobileAuthCallbackPage() {
  const searchParams = useSearchParams();
  const redirectUri = searchParams?.get("redirect_uri") ?? null;
  const [message, setMessage] = useState("Finishing sign-in…");

  const redirectTarget = useMemo(() => {
    if (!redirectUri) {
      return null;
    }

    try {
      return new URL(redirectUri);
    } catch {
      return null;
    }
  }, [redirectUri]);

  useEffect(() => {
    let cancelled = false;

    async function complete() {
      if (!redirectTarget) {
        setMessage("Missing mobile redirect target.");
        return;
      }

      try {
        const { data, error } = await authClient.convex.token({
          fetchOptions: { throw: false },
        });

        if (error || !data?.token) {
          throw new Error(error?.message || "Unable to mint Convex token.");
        }

        redirectTarget.searchParams.set("token", data.token);
        window.location.replace(redirectTarget.toString());
      } catch (err) {
        if (!cancelled) {
          setMessage(err instanceof Error ? err.message : "Sign-in failed.");
        }
      }
    }

    void complete();

    return () => {
      cancelled = true;
    };
  }, [redirectTarget]);

  return (
    <main className="page" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <p className="text-muted">{message}</p>
    </main>
  );
}
