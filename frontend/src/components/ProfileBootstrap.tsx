"use client";

import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";

export default function ProfileBootstrap() {
  const ensureMine = useMutation(api.profiles.ensureMine);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    void ensureMine({});
  }, [ensureMine]);

  return null;
}
