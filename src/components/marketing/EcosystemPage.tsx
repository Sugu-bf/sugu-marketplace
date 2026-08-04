import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Breadcrumb, Container } from "@/components/ui";
import { SITE_URL } from "@/lib/constants";

export interface EcosystemPageContent {
  path: string;
  eyebrow: string;
  title: string;
  description: string;
  intro: string;
  features: Array<{ title: string; description: string }>;
  cta: { label: string; href: string; external?: boolean };
  secondaryCta?: { label: string; href: string; external?: boolean };
}

function ActionLink({ action, primary = false }: { action: EcosystemPageContent["cta"]; primary?: boolean }) {
  const className = primary
    ? "inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 font-bold text-white shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary-600"
    : "inline-flex items-center gap-2 rounded-full border border-border bg-white px-7 py-4 font-bold text-foreground transition hover:border-primary/30 hover:text-primary";

  if (action.external) {
    return <a href={action.href} className={className}>{action.label}<ArrowRight className="h-5 w-5" aria-hidden="true" /></a>;
  }

  return <Link href={action.href} className={className}>{action.label}<ArrowRight className="h-5 w-5" aria-hidden="true" /></Link>;
}

export function EcosystemPage({ content }: { content: EcosystemPageContent }) {
  const url = `${SITE_URL}${content.path}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        name: content.title,
        description: content.description,
        url,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "fr-BF",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Sugu", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: content.eyebrow, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-orange-50 via-white to-emerald-50">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <Container className="relative py-16 sm:py-20 lg:py-28">
          <Breadcrumb items={[{ label: content.eyebrow }]} className="mb-8" />
          <div className="max-w-4xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-primary">{content.eyebrow}</p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl">{content.title}</h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">{content.description}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ActionLink action={content.cta} primary />
              {content.secondaryCta && <ActionLink action={content.secondaryCta} />}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-background">
        <Container className="py-16 sm:py-20 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-emerald-700">Pourquoi cette page existe</p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Un accès clair à la bonne solution Sugu.</h2>
              <p className="mt-6 text-base leading-8 text-muted-foreground sm:text-lg">{content.intro}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {content.features.map((feature) => (
                <article key={feature.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <CheckCircle2 className="h-7 w-7 text-primary" aria-hidden="true" />
                  <h3 className="mt-5 text-xl font-bold text-foreground">{feature.title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-slate-950 text-white">
        <Container className="flex flex-col gap-8 py-14 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-orange-300">Écosystème Sugu</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight">Marketplace, opérations professionnelles et paiement restent reliés.</h2>
          </div>
          <ActionLink action={content.cta} primary />
        </Container>
      </section>
    </>
  );
}
