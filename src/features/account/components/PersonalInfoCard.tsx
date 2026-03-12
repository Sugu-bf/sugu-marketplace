"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Pencil, Loader2 } from "lucide-react";
import { Button, Input, Modal } from "@/components/ui";
import { updateProfile } from "@/features/account";
import type { UserProfile } from "@/features/account";
import { useRouter } from "next/navigation";

interface PersonalInfoCardProps {
  profile: UserProfile;
  className?: string;
}

/**
 * Personal info card — displays profile info with edit modal.
 * Client component — handles profile editing via the real API.
 */
function PersonalInfoCard({ profile, className }: PersonalInfoCardProps) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phoneE164 ?? "");

  const handleSave = async () => {
    setError(null);

    if (!name.trim()) {
      setError("Le nom est requis.");
      return;
    }

    try {
      setSaving(true);
      await updateProfile({
        name: name.trim(),
        phone_e164: phone.trim() || undefined,
      });
      setShowEdit(false);
      router.refresh(); // Refresh server component data
    } catch (err) {
      setError(
        (err as Error)?.message ?? "Erreur lors de la mise à jour du profil."
      );
    } finally {
      setSaving(false);
    }
  };

  const openEdit = () => {
    setName(profile.name);
    setPhone(profile.phoneE164 ?? "");
    setError(null);
    setShowEdit(true);
  };

  return (
    <>
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
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil size={14} /> Modifier
          </Button>
        </div>

        {/* 2-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="Nom complet" value={profile.name} />
          <InfoField
            label="Email"
            value={profile.email ?? "—"}
            badge={
              profile.emailVerified ? (
                <span className="inline-flex items-center gap-1 ml-2 text-[10px] font-semibold text-success">
                  <CheckCircle2 size={12} />
                  Vérifié
                </span>
              ) : null
            }
          />
          <InfoField
            label="Téléphone"
            value={profile.phoneE164 ?? "—"}
            badge={
              profile.phoneVerified ? (
                <span className="inline-flex items-center gap-1 ml-2 text-[10px] font-semibold text-success">
                  <CheckCircle2 size={12} />
                  Vérifié
                </span>
              ) : null
            }
          />
          <InfoField
            label="Membre depuis"
            value={new Date(profile.createdAt).toLocaleDateString("fr-FR", {
              month: "long",
              year: "numeric",
            })}
          />
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Modifier le profil"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Nom complet"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom complet"
            disabled={saving}
          />
          <Input
            label="Téléphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+22670000000"
            hint="Format international (ex: +22670000000)"
            disabled={saving}
          />
          <Input
            label="Email"
            value={profile.email ?? ""}
            disabled
            hint="L'email ne peut pas être modifié ici"
          />

          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowEdit(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
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
