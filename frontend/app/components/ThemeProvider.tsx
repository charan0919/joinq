"use client";

import { useEffect } from "react";

export default function ThemeProvider() {
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved) {
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  return null;
}