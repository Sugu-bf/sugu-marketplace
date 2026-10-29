"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Pencil, Loader2, Smartphone } from "lucide-react";
import { Button, Input, Modal, OtpInput } from "@/components/ui";
import { updateProfile, sendPhoneChangeCode, confirmPhoneChange } from "@/features/account";
import type { UserProfile } from "@/features/account";
import { useRouter } from "next/navigation";
import { isApiError } from "@/lib/api/errors";

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
  const [showPhoneChange, setShowPhoneChange] = useState(false);

  const handleSave = async () => {
    setError(null);

    if (!name.trim()) {
      setError("Le nom est requis.");
      return;
    }

    try {
      setSaving(true);
      await updateProfile({ name: name.trim() });
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
    setError(null);
    setShowEdit(true);
  };

  return (
    <>
      <div
        className={cn(
          "rounded-2xl border border-border/80 bg-white shadow-sm p-5 sm:p-6",
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
          <div className="space-y-1">
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
            <button
              type="button"
              onClick={() => setShowPhoneChange(true)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {profile.phoneE164 ? "Changer de numéro" : "Ajouter un numéro"}
            </button>
          </div>
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

      <PhoneChangeModal
        open={showPhoneChange}
        onClose={() => setShowPhoneChange(false)}
        onChanged={() => {
          setShowPhoneChange(false);
          router.refresh();
        }}
      />
    </>
  );
}

// ─── Phone change (code sent to the new number) ─────────────

function PhoneChangeModal({
  open,
  onClose,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [step, setStep] = useState<"number" | "code">("number");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const close = () => {
    setStep("number");
    setPhone("");
    setError(null);
    onClose();
  };

  const messageOf = (err: unknown, fallback: string): string => {
    if (isApiError(err)) {
      const fieldError = err.details?.errors?.phone_e164?.[0];
      return fieldError ?? err.message;
    }
    return fallback;
  };

  const sendCode = async () => {
    setError(null);
    const phoneE164 = phone.replace(/[\s\-(). ]/g, "");
    if (!/^\+[1-9]\d{7,14}$/.test(phoneE164)) {
      setError("Entrez le numéro au format international (ex: +22670000000).");
      return;
    }
    try {
      setBusy(true);
      await sendPhoneChangeCode(phoneE164);
      setPhone(phoneE164);
      setStep("code");
    } catch (err) {
      setError(messageOf(err, "Le code n'a pas pu être envoyé."));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (code: string) => {
    setError(null);
    try {
      setBusy(true);
      await confirmPhoneChange(phone, code);
      setStep("number");
      setPhone("");
      onChanged();
    } catch (err) {
      setError(messageOf(err, "Le numéro n'a pas pu être changé."));
      setAttempt((n) => n + 1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Changer de numéro" size="md">
      <div className="space-y-4">
        {step === "number" ? (
          <>
            <p className="text-sm text-muted-foreground">
              Votre numéro sert à vous connecter. Nous envoyons un code par SMS au
              nouveau numéro : il ne change qu&apos;une fois ce code confirmé.
            </p>
            <Input
              label="Nouveau numéro"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+22670000000"
              hint="Format international (ex: +22670000000)"
              disabled={busy}
            />
          </>
        ) : (
          <>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
              <Smartphone size={16} className="mt-0.5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Code envoyé au <span className="font-semibold text-foreground">{phone}</span>
              </p>
            </div>
            <OtpInput key={attempt} length={6} onComplete={confirm} error={!!error} disabled={busy} />
          </>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-error/10 border border-error/20" role="alert">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" size="md" onClick={close} disabled={busy}>
            Annuler
          </Button>
          {step === "number" && (
            <Button variant="primary" size="md" onClick={sendCode} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Envoi...
                </>
              ) : (
                "Recevoir le code"
              )}
            </Button>
          )}
        </div>
      </div>
    </Modal>
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
