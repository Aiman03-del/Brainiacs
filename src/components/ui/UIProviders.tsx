"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { ConfirmProvider } from "./confirm";

export function UIProviders({ children }: { children: ReactNode }) {
  return (
    <ConfirmProvider>
      {children}
      <Toaster position="bottom-right" richColors />
    </ConfirmProvider>
  );
}