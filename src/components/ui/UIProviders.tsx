"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { ConfirmProvider } from "./confirm";
import { ThemeSync } from "./ThemeSync";

export function UIProviders({ children }: { children: ReactNode }) {
  return (
    <ConfirmProvider>
      <ThemeSync />
      {children}
      <Toaster position="bottom-right" richColors />
    </ConfirmProvider>
  );
}
