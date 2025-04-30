"use client"

import { Toaster } from "sonner"

export function SonnerProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme="dark"
      toastOptions={{
        style: {
          background: "rgba(30, 30, 30, 0.8)",
          backdropFilter: "blur(10px)",
          color: "white",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
        },
        className: "font-medium",
      }}
    />
  )
}
