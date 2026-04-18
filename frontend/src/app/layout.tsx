import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import AuthGate from "@/components/AuthGate";
import ConvexClientProvider from "./ConvexClientProvider";
import { getToken } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "NutriCoach",
  description: "Real-time nutrition advice for life on the go",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialToken = await getToken();

  return (
    <html lang="en">
      <body>
        <ConvexClientProvider initialToken={initialToken ?? null}>
          <Nav />
          <AuthGate>{children}</AuthGate>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
