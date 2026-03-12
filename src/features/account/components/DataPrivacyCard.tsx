"use client";

import { useState, useCallback } from "react";
import {
  Trash2,
  Download,
  AlertTriangle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button, Input, Modal } from "@/components/ui";
import { deleteAccount, exportAccountData } from "@/features/account";
import { useRouter } from "next/navigation";

/**
 * Data & Privacy section — delete account + export data.
 * Client component — handles modals and API calls.
 */
function DataPrivacyCard() {
  const router = useRouter();

  // ── Export data state ──
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  // ── Delete account state ──
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    setDeleteError(null);

    if (!deletePassword) {
      setDeleteError("Veuillez entrer votre mot de passe pour confirmer.");
      return;
    }

    try {
      setDeleting(true);
      await deleteAccount(deletePassword);
      // Redirect to home after deletion
      router.push("/");
    } catch (err) {
      setDeleteError(
        (err as Error)?.message ?? "Erreur lors de la suppression du compte."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-border-light bg-background p-5 sm:p-6">
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
          </div>
        </div>
      </Modal>
    </>
  );
}

export { DataPrivacyCard };
