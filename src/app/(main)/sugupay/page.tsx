import { EcosystemPage } from "@/components/marketing/EcosystemPage";
import { ecosystemPages } from "@/lib/ecosystem-pages";
import { createMetadata } from "@/lib/metadata";

const content = ecosystemPages.sugupay;
export const metadata = createMetadata({ title: "SuguPay, le paiement officiel de Sugu", description: content.description, path: content.path });
export default function SuguPayEcosystemPage() { return <EcosystemPage content={content} />; }
