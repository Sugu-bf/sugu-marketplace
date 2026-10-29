"use client";

import { useState, useCallback } from "react";
import {
  Trash2,
  Download,
  AlertTriangle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button, Input, Modal, OtpInput } from "@/components/ui";
import { deleteAccount, exportAccountData, sendAccountDeletionCode } from "@/features/account";
import { clearAuthTokenCookie } from "@/features/auth/services/auth-service";
import { resetClientSession } from "@/lib/session/reset-client-session";

interface DataPrivacyCardProps {
  /**
   * False for an account that signs in by SMS code or Google: the deletion is
   * then confirmed by a code sent to it, not by a password it does not have.
   */
  hasPassword: boolean;
}

/**
 * Data & Privacy section — delete account + export data.
 * Client component — handles modals and API calls.
 */
function DataPrivacyCard({ hasPassword }: DataPrivacyCardProps) {
  // ── Export data state ──
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  // ── Delete account state ──
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Account without a password: where the confirmation code was sent.
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [codeAttempt, setCodeAttempt] = useState(0);

  // ── Export data ──
  const handleExport = useCallback(async () => {
    try {
      setExporting(true);
      const data = await exportAccountData();

      // Create a downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sugu-mes-donnees-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } catch (err) {
      console.error("Data export failed:", err);
    } finally {
      setExporting(false);
    }
  }, []);

  // ── Delete account ──
  const openDeleteModal = () => {
    setDeletePassword("");
    setDeleteError(null);
    setCodeSentTo(null);
    setShowDeleteModal(true);
  };

  const deleteWith = async (confirmation: { password: string } | { code: string }) => {
    setDeleteError(null);
    try {
      setDeleting(true);
      await deleteAccount(confirmation);
      // The account is gone: drop its session cookie and every trace it left
      // in this browser, then start over from home.
      await clearAuthTokenCookie();
      await resetClientSession("/");
    } catch (err) {
      setDeleteError(
        (err as Error)?.message ?? "Erreur lors de la suppression du compte."
      );
      setCodeAttempt((n) => n + 1);
      setDeleting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePassword) {
      setDeleteError("Veuillez entrer votre mot de passe pour confirmer.");
      return;
    }
    await deleteWith({ password: deletePassword });
  };

  const handleSendCode = async () => {
    setDeleteError(null);
    try {
      setDeleting(true);
      const sent = await sendAccountDeletionCode();
      setCodeSentTo(sent.destination ?? (sent.channel === "email" ? "votre adresse e-mail" : "votre numéro"));
    } catch (err) {
      setDeleteError((err as Error)?.message ?? "Le code n'a pas pu être envoyé.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-border/80 bg-white shadow-sm p-5 sm:p-6">
        <h2 className="text-base font-bold text-foreground mb-4">
          Données et confidentialité
        </h2>
        <div className="space-y-3">
          {/* Export data */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 border border-border-light">
            <div className="flex items-center gap-3">
              <Download size={16} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Télécharger mes données
                </p>
                <p className="text-xs text-muted-foreground">
                  Exportez une copie de vos données personnelles
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Export...
                </>
              ) : exportDone ? (
                <>
                  <CheckCircle size={14} className="text-success" /> Téléchargé
                </>
              ) : (
                <>
                  <Download size={14} /> Exporter
                </>
              )}
            </Button>
          </div>

          {/* Delete account */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border-2 border-error/20 bg-error/5">
            <div className="flex items-center gap-3">
              <AlertTriangle size={16} className="text-error" />
              <div>
                <p className="text-sm font-medium text-error">
                  Supprimer mon compte
                </p>
                <p className="text-xs text-muted-foreground">
                  Cette action est irréversible
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-error text-error hover:bg-error/10"
              onClick={openDeleteModal}
            >
              <Trash2 size={14} /> Supprimer
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer mon compte"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-error/10 border border-error/20">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-error flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-error">
                  Attention — Action irréversible
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  La suppression de votre compte entraînera la perte définitive
                  de toutes vos données : commandes, adresses, préférences et
                  historique. Vous ne pourrez plus récupérer ces informations.
                </p>
              </div>
            </div>
          </div>

          {hasPassword ? (
            <>
              <p className="text-sm text-muted-foreground">
                Pour confirmer la suppression, veuillez entrer votre mot de passe :
              </p>

              <Input
                label="Mot de passe"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Votre mot de passe actuel"
                disabled={deleting}
              />
            </>
          ) : codeSentTo ? (
            <>
              <p className="text-sm text-muted-foreground">
                Entrez le code envoyé à <span className="font-semibold text-foreground">{codeSentTo}</span> pour
                supprimer définitivement votre compte :
              </p>
              <OtpInput
                key={codeAttempt}
                length={6}
                onComplete={(code) => void deleteWith({ code })}
                error={!!deleteError}
                disabled={deleting}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Votre compte n&apos;a pas de mot de passe : pour confirmer, nous vous
              envoyons un code.
            </p>
          )}

          {deleteError && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20">
              <p className="text-sm text-error">{deleteError}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            {!hasPassword && !codeSentTo && (
              <Button
                variant="primary"
                size="md"
                onClick={handleSendCode}
                disabled={deleting}
                className="bg-error hover:bg-error/90 border-error"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : null}
                Recevoir le code
              </Button>
            )}
            {hasPassword && (
              <Button
                variant="primary"
                size="md"
                onClick={handleDelete}
                disabled={deleting || !deletePassword}
                className="bg-error hover:bg-error/90 border-error"
              >
                {deleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> Supprimer définitivement
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}

export { DataPrivacyCard };
