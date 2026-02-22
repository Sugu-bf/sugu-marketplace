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
} from "lucide-react";
import type { ShippingAddress } from "@/features/checkout";

// ─── Icon mapping for address labels ─────────────────────────

const LABEL_ICONS: Record<string, React.ReactNode> = {
  Maison: <Home size={16} />,
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
  addresses: ShippingAddress[];
  selectedAddressId: number | null;
  onSelectAddress: (id: number) => void;
  onCreateAddress: (address: Omit<ShippingAddress, "id" | "isDefault">) => void;
}

type ModalView = "select" | "create";

/**
 * Address selection modal — select from saved addresses or create a new one.
 * Client component — handles view switching and form interaction.
 */
function AddressModal({
  open,
  onClose,
  addresses,
  selectedAddressId,
  onSelectAddress,
  onCreateAddress,
}: AddressModalProps) {
  const [view, setView] = useState<ModalView>("select");

  // New address form state
  const [newLabel, setNewLabel] = useState("Maison");
  const [newFullName, setNewFullName] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const availableLabels = ["Maison", "Bureau", "Famille", "Autre"];

  const handleSelectAndClose = (id: number) => {
    onSelectAddress(id);
    onClose();
  };

  const handleCreateSubmit = () => {
    if (!newFullName.trim() || !newStreet.trim() || !newCity.trim() || !newCountry.trim()) return;

    onCreateAddress({
      label: newLabel,
      fullName: newFullName.trim(),
      street: newStreet.trim(),
      city: newCity.trim(),
      country: newCountry.trim(),
      phone: newPhone.trim() || undefined,
    });

    // Reset form
    setNewFullName("");
    setNewStreet("");
    setNewCity("");
    setNewCountry("");
    setNewPhone("");
    setNewLabel("Maison");
    setView("select");
    onClose();
  };

  const handleClose = () => {
    setView("select");
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
                    <p className="text-sm text-foreground mt-0.5">{addr.fullName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {addr.street}, {addr.city}, {addr.country}
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
          {/* Back button */}
          <button
            type="button"
            onClick={() => setView("select")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} />
            Retour aux adresses
          </button>

          {/* Label selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Type d&apos;adresse
            </label>
            <div className="flex flex-wrap gap-2">
              {availableLabels.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setNewLabel(label)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
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
            <div className="sm:col-span-2">
              <Input
                label="Nom complet"
                placeholder="Ex: Mamadou Diallo"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                inputSize="lg"
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Adresse"
                placeholder="Ex: 123 Rue de la Paix"
                value={newStreet}
                onChange={(e) => setNewStreet(e.target.value)}
                inputSize="lg"
              />
            </div>
            <Input
              label="Ville"
              placeholder="Ex: Ouagadougou"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              inputSize="lg"
            />
            <Input
              label="Pays"
              placeholder="Ex: Burkina Faso"
              value={newCountry}
              onChange={(e) => setNewCountry(e.target.value)}
              inputSize="lg"
            />
            <div className="sm:col-span-2">
              <Input
                label="Téléphone (optionnel)"
                placeholder="Ex: +226 70 00 00 00"
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                inputSize="lg"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setView("select")}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleCreateSubmit}
              disabled={!newFullName.trim() || !newStreet.trim() || !newCity.trim() || !newCountry.trim()}
              className="flex-1"
            >
              <Plus size={16} />
              Enregistrer l&apos;adresse
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export { AddressModal };
