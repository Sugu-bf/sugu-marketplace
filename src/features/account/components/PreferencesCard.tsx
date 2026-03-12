"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Globe, Coins } from "lucide-react";
import { updatePreferences } from "@/features/account";
import type { UserPreferences } from "@/features/account";

interface PreferencesCardProps {
  initialPreferences: UserPreferences;
  className?: string;
}

/**
 * User preferences card — toggles for notifications + language/currency selects.
 * Client component — handles toggle interactions and calls API.
 * Debounces API calls to avoid rapid-fire requests.
 */
function PreferencesCard({
  initialPreferences,
  className,
}: PreferencesCardProps) {
  const [prefs, setPrefs] = useState(initialPreferences);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistPref = useCallback(
    (key: string, value: boolean | string) => {
      // Debounce API calls
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(async () => {
        try {
          setSaving(true);
          await updatePreferences({ [key]: value });
        } catch (error) {
          console.error("[Preferences] Failed to save:", error);
          // Revert on error would be complex, log for now
        } finally {
          setSaving(false);
        }
      }, 500);
    },
    []
  );

  const updatePref = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));

    // Map camelCase UI key to snake_case API key
    const apiKeyMap: Record<string, string> = {
      newsletterSubscribed: "newsletter_subscribed",
      pushNotifications: "push_notifications",
      smsNotifications: "sms_notifications",
      language: "language",
      currency: "currency",
    };

    persistPref(apiKeyMap[key] ?? key, value);
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border-light bg-background p-5 sm:p-6",
        className
      )}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-foreground">Préférences</h2>
        {saving && (
          <span className="text-xs text-muted-foreground animate-pulse">
            Enregistrement...
          </span>
        )}
      </div>

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
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="ar">العربية</option>
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
            <option value="XOF">FCFA (XOF)</option>
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export { PreferencesCard };
