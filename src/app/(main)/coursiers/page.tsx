import { EcosystemPage } from "@/components/marketing/EcosystemPage";
import { ecosystemPages } from "@/lib/ecosystem-pages";
import { createMetadata } from "@/lib/metadata";

const content = ecosystemPages.coursiers;
// See /vendeurs — canonicalised to the Sugu Pro page targeting the same query.
export const metadata = createMetadata({
  title: "Devenir coursier partenaire",
  description: content.description,
  path: content.path,
  canonicalUrl: "https://pro.sugu.pro/coursiers",
});
export default function CouriersPage() { return <EcosystemPage content={content} />; }
