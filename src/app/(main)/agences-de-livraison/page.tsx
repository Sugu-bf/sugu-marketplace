import { EcosystemPage } from "@/components/marketing/EcosystemPage";
import { ecosystemPages } from "@/lib/ecosystem-pages";
import { createMetadata } from "@/lib/metadata";

const content = ecosystemPages["agences-de-livraison"];
// See /vendeurs — canonicalised to the Sugu Pro page targeting the same query.
export const metadata = createMetadata({
  title: "Agences de livraison partenaires",
  description: content.description,
  path: content.path,
  canonicalUrl: "https://pro.sugu.pro/agences-de-livraison",
});
export default function DeliveryAgenciesPage() { return <EcosystemPage content={content} />; }
