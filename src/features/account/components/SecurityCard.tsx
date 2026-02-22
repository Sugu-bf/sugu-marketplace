import { cn } from "@/lib/utils";
import { Lock, Shield } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import type { SecurityInfo } from "@/features/account";

interface SecurityCardProps {
  security: SecurityInfo;
  className?: string;
}

/**
 * Security card — password and two-factor auth status.
 * Server Component — purely presentational (buttons are design-only).
 */
function SecurityCard({ security, className }: SecurityCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-light bg-background p-5 sm:p-6",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50">
          <Lock size={14} className="text-primary" />
        </div>
        <h2 className="text-base font-bold text-foreground">Sécurité</h2>
      </div>

      <div className="space-y-4">
        {/* Password */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 border border-border-light">
          <div className="flex items-center gap-3">
            <Lock size={16} className="text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Mot de passe
              </p>
              <p className="text-xs text-muted-foreground">
                Dernière modification {security.passwordLastChanged}
              </p>
            </div>
          </div>
          <Button variant="primary" size="sm">
            Modifier
          </Button>
        </div>

        {/* 2FA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 border border-border-light">
          <div className="flex items-center gap-3">
            <Shield size={16} className="text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Authentification à deux facteurs
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {security.twoFactorEnabled ? (
                  <Badge variant="success" size="xs" pill>
                    Activée
                  </Badge>
                ) : (
                  <Badge variant="danger" size="xs" pill>
                    Non activée
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            variant={security.twoFactorEnabled ? "outline" : "primary"}
            size="sm"
          >
            {security.twoFactorEnabled ? "Désactiver" : "Activer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { SecurityCard };
