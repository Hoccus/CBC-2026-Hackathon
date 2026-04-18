"use client";

import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/coach", label: "Coach" },
  { href: "/track", label: "Track" },
  { href: "/restaurants", label: "Restaurants" },
  { href: "/profile", label: "Profile" },
];

export default function Nav() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) {
      return;
    }
    setSigningOut(true);
    try {
      await authClient.signOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <nav className="nav">
      <Link href="/" className="nav-logo">NutriCoach</Link>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`nav-link${pathname === l.href ? " nav-link-active" : ""}`}
        >
          {l.label}
        </Link>
      ))}
      {isAuthenticated && !isLoading && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleSignOut}
          disabled={signingOut}
          style={{ marginLeft: "auto" }}
        >
          {signingOut ? "Signing Out..." : "Sign Out"}
        </button>
      )}
    </nav>
  );
}
