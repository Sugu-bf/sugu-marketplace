import { createMetadata } from "@/lib/metadata";
import { Breadcrumb } from "@/components/ui";
import { queryAddresses } from "@/features/account";
import { AddressListClient } from "@/features/account/components/AddressListClient";

export const metadata = createMetadata({ title: "Mes Adresses", description: "Gérez vos adresses de livraison sur Sugu.", path: "/account/addresses", noIndex: true });

export default async function AddressesPage() {
  const addresses = await queryAddresses();

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Mon compte", href: "/account" }, { label: "Mes adresses" }]} />
      <AddressListClient initialAddresses={addresses} />
    </div>
  );
}
