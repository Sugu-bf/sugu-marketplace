import { createMetadata } from "@/lib/metadata";
import { Container, Breadcrumb, buttonVariants } from "@/components/ui";
import Link from "next/link";
import { queryFaqItems, groupFaqsByCategory } from "@/features/faq";
import { FaqSection } from "@/features/faq/components/FaqSection";
import { cn } from "@/lib/utils";
import { Headphones, Mail } from "lucide-react";
import Script from "next/script";

export const metadata = createMetadata({
  title: "Centre d'aide - FAQ",
  description: "Trouvez des réponses à vos questions sur Sugu. FAQ, contact, support client.",
  path: "/help",
});

export default async function HelpCenterPage() {
  const faqItems = await queryFaqItems();
  const categories = groupFaqsByCategory(faqItems);

  // Build FAQ JSON-LD structured data for SEO
  const faqJsonLd = faqItems.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  } : null;

  return (
    <main className="pb-12">
      {/* FAQ JSON-LD Structured Data */}
      {faqJsonLd && (
        <Script
          id="faq-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <Container className="pt-4 pb-2">
        <Breadcrumb items={[{ label: "Centre d'aide" }]} />
      </Container>

      <Container className="pb-8">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Centre d&apos;aide</h1>
        <p className="text-sm text-muted-foreground mt-1">Comment pouvons-nous vous aider ?</p>
      </Container>

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border-light bg-background p-5 sm:p-6">
              <h2 className="text-lg font-bold text-foreground mb-5">Questions fréquentes</h2>
              <FaqSection items={faqItems} categories={categories} />
            </div>
          </div>

          {/* Contact sidebar — only real ways to reach Sugu */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border-light bg-background p-5 sm:p-6">
              <h2 className="text-base font-bold text-foreground mb-4">Contactez-nous</h2>
              <div className="space-y-3">
                <ContactRow icon={<Mail size={16} />} label="Email" value="support@sugu.pro" href="mailto:support@sugu.pro" />
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-light p-6 text-white text-center">
              <Headphones size={32} className="mx-auto mb-3 opacity-80" />
              <p className="text-base font-bold">Besoin d&apos;aide ?</p>
              <p className="text-sm opacity-80 mt-1">Écrivez à l&apos;équipe Sugu depuis le chat.</p>
              <Link
                href="/support-chat"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "md", fullWidth: true }),
                  "mt-4 bg-white/20 text-white border-white/30 hover:bg-white/30"
                )}
              >
                Ouvrir le chat
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}

function ContactRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border-light hover:bg-primary-50 hover:border-primary/20 transition-all group">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </a>
  );
}
