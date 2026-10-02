"use client";

import { useEffect } from "react";

export function PwaRegistrar() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("ReviewMitra PWA Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("ReviewMitra PWA Service Worker registration skipped:", err);
        });
    }
  }, []);

  return null;
}
