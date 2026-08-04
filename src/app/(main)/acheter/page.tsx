import { EcosystemPage } from "@/components/marketing/EcosystemPage";
import { ecosystemPages } from "@/lib/ecosystem-pages";
import { createMetadata } from "@/lib/metadata";

const content = ecosystemPages.acheter;
export const metadata = createMetadata({ title: "Acheter sur Sugu", description: content.description, path: content.path });
export default function BuyOnSuguPage() { return <EcosystemPage content={content} />; }
