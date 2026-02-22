import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import type { UserProfile } from "@/features/account";

interface PersonalInfoCardProps {
  profile: UserProfile;
  className?: string;
}

const GENDER_LABELS: Record<string, string> = {
  male: "Homme",
  female: "Femme",
  other: "Autre",
};

/**
 * Personal info card — read-only display of user profile fields.
 * Server Component — purely presentational.
 */
function PersonalInfoCard({ profile, className }: PersonalInfoCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-light bg-background p-5 sm:p-6",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-foreground">
          Informations personnelles
        </h2>
        <button className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
          Modifier
        </button>
      </div>

      {/* 2-column grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoField label="Prénom" value={profile.firstName} />
        <InfoField label="Nom" value={profile.lastName} />
        <InfoField
          label="Email"
          value={profile.email}
          badge={
            profile.emailVerified ? (
              <span className="inline-flex items-center gap-1 ml-2 text-[10px] font-semibold text-success">
                <CheckCircle2 size={12} />
                Vérifié
              </span>
            ) : null
          }
        />
        <InfoField label="Téléphone" value={profile.phone} />
        <InfoField label="Date de naissance" value={profile.dateOfBirth} />
        <InfoField
          label="Genre"
          value={GENDER_LABELS[profile.gender] ?? profile.gender}
        />
      </div>
    </div>
  );
}

// ─── Helper ──────────────────────────────────────────────────

function InfoField({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center">
        <p className="text-sm font-medium text-foreground bg-muted/50 rounded-lg px-3 py-2 w-full">
          {value}
        </p>
        {badge}
      </div>
    </div>
  );
}

export { PersonalInfoCard };
