"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Home,
  Briefcase,
  Users,
  Phone,
  Plus,
  Pencil,
  Trash2,
  Star,
  Loader2,
} from "lucide-react";
import { Button, Badge, Input, Modal } from "@/components/ui";
import {
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/features/account";
import type { Address, AddressInput } from "@/features/account";
import { useRouter } from "next/navigation";

// ─── Constants ───────────────────────────────────────────────

const LABEL_ICONS: Record<string, React.ReactNode> = {
  Domicile: <Home size={18} />,
  Bureau: <Briefcase size={18} />,
  Famille: <Users size={18} />,
};

const LABEL_OPTIONS = ["Domicile", "Bureau", "Famille", "Autre"];

// ─── Props ───────────────────────────────────────────────────

interface AddressListClientProps {
  initialAddresses: Address[];
}

/**
 * Client-side address list with full CRUD capabilities.
 * Add, edit, delete addresses via modals, and set default.
 */
function AddressListClient({ initialAddresses }: AddressListClientProps) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);

  // ── Form modal state ──
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Delete confirmation state ──
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Setting default state ──
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  // ── Form fields ──
  const [label, setLabel] = useState("Domicile");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [addressComplement, setAddressComplement] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  // ── Open create form ──
  const openCreateForm = () => {
    setEditingAddress(null);
    setLabel("Domicile");
    setFullName("");
    setPhone("");
    setAddressLine("");
    setAddressComplement("");
    setCity("");
    setState("");
    setIsDefault(addresses.length === 0); // First address is default
    setFormError(null);
    setShowForm(true);
  };

  // ── Open edit form ──
  const openEditForm = (addr: Address) => {
    setEditingAddress(addr);
    setLabel(addr.label);
    setFullName(addr.fullName);
    setPhone(addr.phone);
    setAddressLine(addr.addressLine);
    setAddressComplement(addr.addressComplement ?? "");
    setCity(addr.city);
    setState(addr.state ?? "");
    setIsDefault(addr.isDefault);
    setFormError(null);
    setShowForm(true);
  };

  // ── Save (create or update) ──
  const handleSave = async () => {
    setFormError(null);

    // Validation
    if (!fullName.trim())
      return setFormError("Le nom complet est requis.");
    if (!phone.trim())
      return setFormError("Le téléphone est requis.");
    if (!addressLine.trim())
      return setFormError("L'adresse est requise.");
    if (!city.trim()) return setFormError("La ville est requise.");

    const data: AddressInput = {
      label,
      full_name: fullName.trim(),
      phone: phone.trim(),
      address_line: addressLine.trim(),
      address_complement: addressComplement.trim() || null,
      city: city.trim(),
      state: state.trim() || null,
      country_code: "BF", // Default to Burkina Faso
      is_default: isDefault,
    };

    try {
      setSaving(true);
      if (editingAddress) {
        const updated = await updateAddress(editingAddress.id, data);
        setAddresses((prev) =>
          prev.map((a) => {
            if (a.id === updated.id) return updated;
            // If updated is default, un-default others
            if (updated.isDefault && a.isDefault) return { ...a, isDefault: false };
            return a;
          })
        );
      } else {
        const created = await createAddress(data);
        setAddresses((prev) => {
          if (created.isDefault) {
            return [...prev.map((a) => ({ ...a, isDefault: false })), created];
          }
          return [...prev, created];
        });
      }
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setFormError(
        (err as Error)?.message ?? "Erreur lors de l'enregistrement de l'adresse."
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      setDeleting(true);
      await deleteAddress(deletingId);
      setAddresses((prev) => prev.filter((a) => a.id !== deletingId));
      setDeletingId(null);
      router.refresh();
    } catch (err) {
      console.error("Delete address failed:", err);
      setDeletingId(null);
    } finally {
      setDeleting(false);
    }
  };

  // ── Set Default ──
  const handleSetDefault = async (id: string) => {
    try {
      setSettingDefaultId(id);
      await setDefaultAddress(id);
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }))
      );
      router.refresh();
    } catch (err) {
      console.error("Set default failed:", err);
    } finally {
      setSettingDefaultId(null);
    }
  };

  return (
    <>
      {/* Header with add button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Mes adresses
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {addresses.length} adresse{addresses.length > 1 ? "s" : ""} enregistrée{addresses.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={openCreateForm}>
          <Plus size={16} /> Ajouter une adresse
        </Button>
      </div>

      {/* Address list */}
      {addresses.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-background p-8 lg:p-12 text-center">
          <MapPin size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-base font-semibold text-foreground lg:text-lg">
            Aucune adresse
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Ajoutez votre première adresse de livraison.
          </p>
          <Button
            variant="primary"
            size="md"
            className="mt-4"
            onClick={openCreateForm}
          >
            <Plus size={16} /> Ajouter une adresse
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="rounded-2xl border border-border-light bg-background p-5 transition-all hover:shadow-sm group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary">
                    {LABEL_ICONS[addr.label] ?? <MapPin size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {addr.label}
                    </p>
                    {addr.isDefault && (
                      <Badge variant="success" size="xs" pill>
                        Par défaut
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      disabled={settingDefaultId === addr.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary-50 hover:text-primary transition-colors disabled:opacity-50"
                      title="Définir par défaut"
                    >
                      {settingDefaultId === addr.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Star size={14} />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => openEditForm(addr)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary-50 hover:text-primary transition-colors"
                    title="Modifier"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeletingId(addr.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-error/10 hover:text-error transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <p className="text-sm font-medium text-foreground">
                {addr.fullName}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {addr.addressLine}
              </p>
              {addr.addressComplement && (
                <p className="text-sm text-muted-foreground">
                  {addr.addressComplement}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {addr.city}
                {addr.state ? `, ${addr.state}` : ""}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                <Phone size={12} /> {addr.phone}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create/Edit Address Modal ── */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingAddress ? "Modifier l'adresse" : "Nouvelle adresse"}
        size="lg"
      >
        <div className="space-y-4">
          {/* Label selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Type d&apos;adresse
            </label>
            <div className="flex flex-wrap gap-2">
              {LABEL_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setLabel(opt)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                    label === opt
                      ? "bg-primary text-white border-primary"
                      : "bg-background text-foreground border-border hover:border-primary"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nom complet"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Prénom Nom"
              disabled={saving}
            />
            <Input
              label="Téléphone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+22670000000"
              disabled={saving}
            />
          </div>

          <Input
            label="Adresse"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            placeholder="Rue, numéro, quartier"
            disabled={saving}
          />

          <Input
            label="Complément (optionnel)"
            value={addressComplement}
            onChange={(e) => setAddressComplement(e.target.value)}
            placeholder="Appartement, étage, bâtiment..."
            disabled={saving}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Ville"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ouagadougou"
              disabled={saving}
            />
            <Input
              label="Province / État (optionnel)"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Kadiogo"
              disabled={saving}
            />
          </div>

          {/* Default toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              disabled={saving}
            />
            <span className="text-sm font-medium text-foreground">
              Définir comme adresse par défaut
            </span>
          </label>

          {formError && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20">
              <p className="text-sm text-error">{formError}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowForm(false)}
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
                  <Loader2 size={14} className="animate-spin" />{" "}
                  Enregistrement...
                </>
              ) : editingAddress ? (
                "Mettre à jour"
              ) : (
                "Ajouter"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Supprimer l'adresse"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Êtes-vous sûr de vouloir supprimer cette adresse ? Cette action est
            irréversible.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => setDeletingId(null)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-error hover:bg-error/90 border-error"
            >
              {deleting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Suppression...
                </>
              ) : (
                <>
                  <Trash2 size={14} /> Supprimer
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export { AddressListClient };
