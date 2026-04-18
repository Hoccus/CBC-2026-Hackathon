"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function AuthForm({
  callbackURL = "/",
  autoProvider,
}: {
  callbackURL?: string;
  autoProvider?: "google" | "microsoft";
}) {
  const [submitting, setSubmitting] = useState<"google" | "microsoft" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoStarted = useRef(false);

  const handleSocialSignIn = useCallback(async (provider: "google" | "microsoft") => {
    if (submitting) {
      return;
    }

    setSubmitting(provider);
    setError(null);

    try {
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL,
      });
      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setSubmitting(null);
    }
  }, [callbackURL, submitting]);

  useEffect(() => {
    if (!autoProvider || autoStarted.current) {
      return;
    }

    autoStarted.current = true;
    void handleSocialSignIn(autoProvider);
  }, [autoProvider, handleSocialSignIn]);

  return (
    <main className="page" style={{ display: "grid", placeItems: "center", minHeight: "calc(100vh - var(--nav-h))" }}>
      <div className="card" style={{ width: "100%", maxWidth: 420, padding: 24 }}>
        <div className="mb-4">
          <h1 className="h1">Sign In</h1>
          <p className="text-muted mt-1">
            Use your Google or Microsoft account to sync meals, profile, and coach history.
          </p>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <button
            type="button"
            className="btn btn-secondary btn-full"
            onClick={() => void handleSocialSignIn("google")}
            disabled={submitting !== null}
          >
            {submitting === "google" ? "Redirecting..." : "Continue With Google"}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-full"
            onClick={() => void handleSocialSignIn("microsoft")}
            disabled={submitting !== null}
          >
            {submitting === "microsoft" ? "Redirecting..." : "Continue With Microsoft"}
          </button>
          {error && (
            <p style={{ color: "#991b1b", fontSize: 12 }}>{error}</p>
          )}
          <p className="text-muted" style={{ fontSize: 12 }}>
            New users are created automatically on first sign-in.
          </p>
        </div>
      </div>
    </main>
  );
}
