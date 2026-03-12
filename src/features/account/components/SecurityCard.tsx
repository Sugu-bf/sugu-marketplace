"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Lock, Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button, Badge, Input, Modal } from "@/components/ui";
import { changePassword } from "@/features/account";
import type { SecurityInfo } from "@/features/account";
import { useRouter } from "next/navigation";

interface SecurityCardProps {
  security: SecurityInfo;
  className?: string;
}

/**
 * Security card — password change + 2FA status.
 * Client component — handles password change via real API.
 */
function SecurityCard({ security, className }: SecurityCardProps) {
  const router = useRouter();

  // ── Password change modal state ──
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const openPasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setPasswordSuccess(false);
    setShowPasswordModal(true);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError("Le mot de passe actuel est requis.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(
        "Le nouveau mot de passe doit contenir au moins 8 caractères."
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setChangingPassword(true);
      await changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setPasswordSuccess(true);
      // Auto-close after success
      setTimeout(() => {
        setShowPasswordModal(false);
        router.refresh();
      }, 1500);
    } catch (err) {
      setPasswordError(
        (err as Error)?.message ?? "Erreur lors du changement de mot de passe."
      );
    } finally {
      setChangingPassword(false);
    }
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
              <Lock
                size={16}
                className="text-muted-foreground flex-shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Mot de passe
                </p>
                <p className="text-xs text-muted-foreground">
                  Dernière modification {security.passwordLastChanged}
                </p>
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={openPasswordModal}>
              Modifier
            </Button>
          </div>

          {/* 2FA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 border border-border-light">
            <div className="flex items-center gap-3">
              <Shield
                size={16}
                className="text-muted-foreground flex-shrink-0"
              />
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
              disabled
              title="Disponible prochainement"
            >
              {security.twoFactorEnabled ? "Désactiver" : "Activer"}
            </Button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <Modal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Changer le mot de passe"
        size="md"
      >
        {passwordSuccess ? (
          <div className="text-center py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-success mx-auto mb-3">
              <Lock size={24} />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Mot de passe modifié avec succès !
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Password */}
            <div className="relative">
              <Input
                label="Mot de passe actuel"
                type={showCurrentPw ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Votre mot de passe actuel"
                disabled={changingPassword}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showCurrentPw ? "Masquer" : "Afficher"}
              >
                {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* New Password */}
            <div className="relative">
              <Input
                label="Nouveau mot de passe"
                type={showNewPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Au moins 8 caractères"
                hint="Minimum 8 caractères"
                disabled={changingPassword}
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showNewPw ? "Masquer" : "Afficher"}
              >
                {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Confirm Password */}
            <Input
              label="Confirmer le mot de passe"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmez le nouveau mot de passe"
              disabled={changingPassword}
              error={
                confirmPassword && newPassword !== confirmPassword
                  ? "Les mots de passe ne correspondent pas"
                  : undefined
              }
            />

            {passwordError && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                <p className="text-sm text-error">{passwordError}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowPasswordModal(false)}
                disabled={changingPassword}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleChangePassword}
                disabled={
                  changingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
              >
                {changingPassword ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Changement...
                  </>
                ) : (
                  "Changer le mot de passe"
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export { SecurityCard };
