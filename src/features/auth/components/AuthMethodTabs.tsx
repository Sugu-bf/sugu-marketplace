"use client";

import { cn } from "@/lib/utils";
import { Mail, Phone } from "lucide-react";
import type { AuthMethod } from "../models/auth";

interface AuthMethodTabsProps {
  activeMethod: AuthMethod;
  onMethodChange: (method: AuthMethod) => void;
  className?: string;
}

/**
 * Email/Phone toggle tabs for the login form.
 * Pill-style design matching the Figma reference.
 */
function AuthMethodTabs({
  activeMethod,
  onMethodChange,
  className,
}: AuthMethodTabsProps) {
  const methods: { id: AuthMethod; label: string; icon: typeof Mail }[] = [
    { id: "email", label: "Email", icon: Mail },
    { id: "phone", label: "Phone", icon: Phone },
  ];

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="tablist"
      aria-label="Méthode de connexion"
    >
      {methods.map(({ id, label, icon: Icon }) => {
        const isActive = activeMethod === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${id}`}
            id={`tab-${id}`}
            onClick={() => onMethodChange(id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "border-2 border-primary bg-white text-primary shadow-sm"
                : "border-2 border-border bg-white text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export { AuthMethodTabs };
