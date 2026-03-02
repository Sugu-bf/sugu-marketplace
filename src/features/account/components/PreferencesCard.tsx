"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Globe, Coins } from "lucide-react";
import { CURRENCY } from "@/lib/constants";
import type { UserPreferences } from "@/features/account";

interface PreferencesCardProps {
  initialPreferences: UserPreferences;
  className?: string;
}

/**
 * User preferences card — toggles for notifications + language/currency selects.
 * Client component — handles toggle interactions.
 */
function PreferencesCard({
  initialPreferences,
  className,
}: PreferencesCardProps) {
  const [prefs, setPrefs] = useState(initialPreferences);

  const updatePref = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border-light bg-background p-5 sm:p-6",
        className
      )}
    >
      <h2 className="text-base font-bold text-foreground mb-5">Préférences</h2>

      <div className="space-y-4">
        {/* Newsletter */}
        <ToggleSwitch
          checked={prefs.newsletterSubscribed}
          onChange={(val) => updatePref("newsletterSubscribed", val)}
          label="Recevoir les newsletters"
          description="Offres exclusives et nouveautés"
        />

        {/* Push Notifications */}
        <ToggleSwitch
          checked={prefs.pushNotifications}
          onChange={(val) => updatePref("pushNotifications", val)}
          label="Notifications push"
          description="Mises à jour de commandes et promos"
        />

        {/* SMS */}
        <ToggleSwitch
          checked={prefs.smsNotifications}
          onChange={(val) => updatePref("smsNotifications", val)}
          label="Notifications SMS"
          description="Recevoir des SMS pour les commandes"
        />

        {/* Divider */}
        <div className="border-t border-border-light" />

        {/* Language */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Globe size={16} />
            </div>
            <span className="text-sm font-medium text-foreground">Langue</span>
          </div>
          <select
            value={prefs.language}
            onChange={(e) => updatePref("language", e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
              transition-all duration-200 cursor-pointer"
            aria-label="Langue"
          >
            <option value="Français">Français</option>
            <option value="English">English</option>
            <option value="العربية">العربية</option>
          </select>
        </div>

        {/* Currency */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Coins size={16} />
            </div>
            <span className="text-sm font-medium text-foreground">Devise</span>
          </div>
          <select
            value={prefs.currency}
            onChange={(e) => updatePref("currency", e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
              transition-all duration-200 cursor-pointer"
            aria-label="Devise"
          >
            <option value={CURRENCY.label}>{CURRENCY.label}</option>
            <option value="EUR (€)">EUR (€)</option>
            <option value="USD ($)">USD ($)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export { PreferencesCard };
