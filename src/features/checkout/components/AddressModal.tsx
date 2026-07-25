"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Modal, Button, Input } from "@/components/ui";
import {
  MapPin,
  Home,
  Briefcase,
  Users,
  Check,
  Plus,
  ArrowLeft,
  Phone,
  Crosshair,
  Loader2,
} from "lucide-react";
import type { Address } from "@/features/account";
import { ADDRESS_LABELS, DEFAULT_ADDRESS_LABEL } from "@/lib/constants";
import { formatAddressLines, type AddressDraft } from "../utils/address";

// ─── Icon mapping for address labels ─────────────────────────

const LABEL_ICONS: Record<string, React.ReactNode> = {
  Domicile: <Home size={16} />,
  Bureau: <Briefcase size={16} />,
  Famille: <Users size={16} />,
};

function getLabelIcon(label: string) {
  return LABEL_ICONS[label] ?? <MapPin size={16} />;
}

// ─── Props ───────────────────────────────────────────────────

interface AddressModalProps {
  open: boolean;
  onClose: () => void;
  addresses: Address[];
  selectedAddressId: string | null;
  onSelectAddress: (id: string) => void;
  /** Persiste l'adresse dans le carnet. Rejette en cas d'échec serveur. */
  onCreateAddress: (draft: AddressDraft) => Promise<void>;
  /** Le carnet est en cours de chargement initial. */
  loading?: boolean;
}

type ModalView = "select" | "create";

type FieldErrors = Partial<
  Record<"fullName" | "phone" | "city" | "zone", string>
>;

/**
 * Address selection modal — select from saved addresses or create a new one.
 *
 * Le formulaire ne demande que ce dont la livraison a réellement besoin :
 * nom, téléphone, ville et quartier. La rue est facultative (l'adressage par
 * rue est peu exploitable en zone UEMOA) et le pays n'est plus demandé — il
 * était de toute façon forcé à BF à l'envoi. Les coordonnées GPS sont
 * capturées d'un tap plutôt que saisies.
 */
function AddressModal({
  open,
  onClose,
  addresses,
  selectedAddressId,
  onSelectAddress,
  onCreateAddress,
  loading = false,
}: AddressModalProps) {
  // If no addresses exist, open directly in "create" mode
  const [view, setView] = useState<ModalView>(
    addresses.length === 0 ? "create" : "select"
  );

  // New address form state
  const [newLabel, setNewLabel] = useState<string>(DEFAULT_ADDRESS_LABEL);
  const [newFullName, setNewFullName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newZone, setNewZone] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newComplement, setNewComplement] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Async state
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const handleSelectAndClose = (id: string) => {
    onSelectAddress(id);
    onClose();
  };

  // ── Capture GPS position (1 tap, no typing) ──
  const handleLocate = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }

    setLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: Number(position.coords.latitude.toFixed(7)),
          lng: Number(position.coords.longitude.toFixed(7)),
        });
        setLocating(false);
      },
      () => {
        setGeoError(
          "Position indisponible. Vérifiez que la localisation est autorisée."
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    );
  };

  const resetForm = () => {
    setNewFullName("");
    setNewPhone("");
    setNewCity("");
    setNewZone("");
    setNewStreet("");
    setNewComplement("");
    setCoords(null);
    setNewLabel(DEFAULT_ADDRESS_LABEL);
    setFieldErrors({});
    setFormError(null);
    setGeoError(null);
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!newFullName.trim()) errors.fullName = "Le nom complet est requis.";
    if (!newPhone.trim()) errors.phone = "Le téléphone est requis.";
    if (!newCity.trim()) errors.city = "La ville est requise.";
    if (!newZone.trim()) errors.zone = "Le quartier est requis.";
    return errors;
  };

  const handleCreateSubmit = async () => {
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const zone = newZone.trim();

    setSaving(true);
    setFormError(null);

    try {
      await onCreateAddress({
        label: newLabel,
        fullName: newFullName.trim(),
        phone: newPhone.trim(),
        // Sans précision de rue, le quartier fait office de ligne d'adresse :
        // le backend exige une line1 non vide.
        addressLine: newStreet.trim() || zone,
        addressComplement: newComplement.trim() || null,
        city: newCity.trim(),
        zone,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      });

      resetForm();
      setView("select");
      onClose();
    } catch (err) {
      setFormError(
        (err as Error)?.message ??
          "Impossible d'enregistrer l'adresse. Veuillez réessayer."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    setView(addresses.length === 0 ? "create" : "select");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={view === "select" ? "Adresse de livraison" : "Nouvelle adresse"}
      size="lg"
    >
      {view === "select" ? (
        /* ═══ SELECT VIEW ═══ */
        <div className="space-y-3">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              Chargement de vos adresses…
            </div>
          )}

          {/* Saved addresses list */}
          <div className="space-y-2.5">
            {addresses.map((addr) => {
              const isSelected = addr.id === selectedAddressId;
              return (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => handleSelectAndClose(addr.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200",
                    "hover:border-primary/40 hover:bg-primary-50/30",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    isSelected
                      ? "border-primary bg-primary-50"
                      : "border-border bg-background"
                  )}
                >
                  {/* Check/radio indicator */}
                  <div
                    className={cn(
                      "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
                      isSelected ? "border-primary bg-primary" : "border-border"
                    )}
                  >
                    {isSelected && (
                      <Check size={12} className="text-white" strokeWidth={3} />
                    )}
                  </div>

                  {/* Icon */}
                  <div
                    className={cn(
                      "mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {getLabelIcon(addr.label)}
                  </div>

                  {/* Address details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          Par défaut
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground mt-0.5">
                      {addr.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {formatAddressLines(addr).join(" · ")}
                    </p>
                    {addr.phone && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Phone size={10} />
                        {addr.phone}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Add new address button */}
          <button
            type="button"
            onClick={() => setView("create")}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-4",
              "text-sm font-semibold text-muted-foreground transition-all duration-200",
              "hover:border-primary/40 hover:text-primary hover:bg-primary-50/30",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            )}
          >
            <Plus size={18} />
            Ajouter une nouvelle adresse
          </button>
        </div>
      ) : (
        /* ═══ CREATE VIEW ═══ */
        <div className="space-y-5">
          {/* Back button — only if there is something to go back to */}
          {addresses.length > 0 && (
            <button
              type="button"
              onClick={() => setView("select")}
              disabled={saving}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
            >
              <ArrowLeft size={14} />
              Retour aux adresses
            </button>
          )}

          {/* Label selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Type d&apos;adresse
            </label>
            <div className="flex flex-wrap gap-2">
              {ADDRESS_LABELS.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setNewLabel(label)}
                  disabled={saving}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200 disabled:opacity-50",
                    newLabel === label
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-background text-foreground hover:border-primary/40 hover:text-primary"
                  )}
                >
                  {getLabelIcon(label)}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nom complet *"
              placeholder="Ex: Mamadou Diallo"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              error={fieldErrors.fullName}
              disabled={saving}
              inputSize="lg"
            />
            <Input
              label="Téléphone *"
              placeholder="Ex: +226 70 00 00 00"
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              error={fieldErrors.phone}
              hint="Le livreur vous appellera sur ce numéro."
              disabled={saving}
              inputSize="lg"
            />
            <Input
              label="Ville *"
              placeholder="Ex: Ouagadougou"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              error={fieldErrors.city}
              disabled={saving}
              inputSize="lg"
            />
            <Input
              label="Quartier / Secteur *"
              placeholder="Ex: Tanghin, Secteur 15"
              value={newZone}
              onChange={(e) => setNewZone(e.target.value)}
              error={fieldErrors.zone}
              disabled={saving}
              inputSize="lg"
            />
            <div className="sm:col-span-2">
              <Input
                label="Rue, porte ou repère (optionnel)"
                placeholder="Ex: Rue 12.34, porte 567 — derrière la pharmacie"
                value={newStreet}
                onChange={(e) => setNewStreet(e.target.value)}
                disabled={saving}
                inputSize="lg"
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Complément (optionnel)"
                placeholder="Ex: 2e étage, portail vert"
                value={newComplement}
                onChange={(e) => setNewComplement(e.target.value)}
                disabled={saving}
                inputSize="lg"
              />
            </div>
          </div>

          {/* GPS capture — one tap instead of typing coordinates */}
          <div className="rounded-xl border border-border-light bg-muted/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Position GPS (optionnel)
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {coords
                    ? `Position enregistrée : ${coords.lat}, ${coords.lng}`
                    : "Aide le livreur à vous retrouver plus vite."}
                </p>
              </div>
              <Button
                variant={coords ? "outline" : "primary"}
                size="sm"
                onClick={handleLocate}
                disabled={saving || locating}
                type="button"
              >
                {locating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Localisation…
                  </>
                ) : (
                  <>
                    {coords ? <Check size={14} /> : <Crosshair size={14} />}
                    {coords ? "Position OK" : "Utiliser ma position"}
                  </>
                )}
              </Button>
            </div>
            {geoError && (
              <p className="mt-2 text-xs text-error">{geoError}</p>
            )}
          </div>

          {formError && (
            <div
              className="rounded-lg border border-error/20 bg-error/10 p-3"
              role="alert"
            >
              <p className="text-sm text-error">{formError}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() =>
                addresses.length > 0 ? setView("select") : handleClose()
              }
              disabled={saving}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleCreateSubmit}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Enregistrer l&apos;adresse
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export { AddressModal };
