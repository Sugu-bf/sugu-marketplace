import { EcosystemPage } from "@/components/marketing/EcosystemPage";
import { ecosystemPages } from "@/lib/ecosystem-pages";
import { createMetadata } from "@/lib/metadata";

const content = ecosystemPages.vendeurs;
// Canonicalised to Sugu Pro: pro.sugu.pro/vendeurs targets the same query and is
// where a seller actually signs up. Keeping both self-canonical made the two
// domains compete for the same result.
export const metadata = createMetadata({
  title: "Vendre sur Sugu",
  description: content.description,
  path: content.path,
  canonicalUrl: "https://pro.sugu.pro/vendeurs",
});
export default function SellOnSuguPage() { return <EcosystemPage content={content} />; }
