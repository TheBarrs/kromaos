"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function useAutoRefresh(intervalMs = 30_000) {
  const router = useRouter();
  const savedInterval = useRef(intervalMs);

  useEffect(() => {
    savedInterval.current = intervalMs;
  }, [intervalMs]);

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, savedInterval.current);
    return () => clearInterval(id);
  }, [router]);
}
