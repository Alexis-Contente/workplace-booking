"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      position="top-right"
      visibleToasts={6}
      duration={6000}
      closeButton={true}
      richColors={true}
      expand={true}
      offset="20px"
      gap={12}
      toastOptions={{
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "2px solid hsl(var(--border))",
          borderRadius: "0.625rem",
          fontSize: "0.9375rem",
          padding: "1.25rem",
          fontWeight: "500",
          boxShadow:
            "0 10px 40px -10px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        },
        className: "my-toast",
        duration: 6000,
      }}
      style={
        {
          "--normal-bg": "hsl(var(--popover))",
          "--normal-text": "hsl(var(--popover-foreground))",
          "--normal-border": "hsl(var(--border))",
          "--success-bg": "hsl(142.1 76.2% 36.3%)",
          "--success-text": "hsl(355.7 100% 97.3%)",
          "--error-bg": "hsl(0 84.2% 60.2%)",
          "--error-text": "hsl(210 20% 98%)",
          "--warning-bg": "hsl(32.1 81.2% 58.8%)",
          "--warning-text": "hsl(220.9 39.3% 11%)",
          "--info-bg": "hsl(217.2 91.2% 59.8%)",
          "--info-text": "hsl(210 20% 98%)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
