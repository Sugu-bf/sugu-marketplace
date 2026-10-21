import { createMetadata } from "@/lib/metadata";
import Link from "next/link";
import { Container, Breadcrumb, buttonVariants } from "@/components/ui";
import { SupportChatWidget } from "@/features/support-chat";
import { OpenSupportChatButton } from "@/features/support-chat/OpenSupportChatButton";
import { cn } from "@/lib/utils";
import { Headphones, BookOpen } from "lucide-react";

export const metadata = createMetadata({
  title: "Chat Support",
  description: "Écrivez à l'équipe support Sugu depuis le chat.",
  path: "/support-chat",
  noIndex: true,
});

/**
 * The live support chat, and only what is true of it: how to open it, what
 * helps the agent, and the help centre. No phone, no address, no promise of
 * availability or response time the page cannot keep.
 */
export default function SupportChatPage() {
  return (
    <main className="pb-12">
      <Container className="pt-4 pb-2">
        <Breadcrumb items={[{ label: "Centre d'aide", href: "/help" }, { label: "Chat support" }]} />
      </Container>

      <Container className="pb-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Chat support
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Écrivez à l&apos;équipe Sugu depuis cette page.
        </p>
      </Container>

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content — instructions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Getting started card */}
            <div className="rounded-2xl border border-border-light bg-background p-6 sm:p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-white mx-auto mb-5">
                <Headphones size={32} />
              </div>
              <h2 className="text-lg font-bold text-foreground text-center">
                Démarrez une conversation
              </h2>
              <p className="text-sm text-muted-foreground text-center mt-2 max-w-md mx-auto">
                Ouvrez le chat pour écrire à un agent Sugu. Votre conversation reste ici tant qu&apos;elle est ouverte.
              </p>
              <div className="mt-5 flex flex-col items-center gap-2">
                <OpenSupportChatButton />
                <p className="text-xs text-muted-foreground">
                  Le chat est ouvert aux comptes connectés.
                </p>
              </div>

              {/* Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                <StepCard number={1} title="Ouvrir le chat" description="Ce bouton, ou le bouton orange en bas à droite" />
                <StepCard number={2} title="Décrire votre problème" description="Entrez un sujet et lancez le chat" />
                <StepCard number={3} title="Échanger avec un agent" description="Sa réponse s'affiche dans le chat" />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:col-span-1">
            {/* Help centre */}
            <div className="rounded-2xl border border-border-light bg-background p-5">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={18} className="text-primary" />
                <h3 className="text-sm font-bold text-foreground">Centre d&apos;aide</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Les réponses aux questions les plus fréquentes.
              </p>
              <Link href="/help" className={cn(buttonVariants({ variant: "outline", size: "sm", fullWidth: true }), "mt-3 text-xs")}>
                Voir les questions fréquentes
              </Link>
            </div>

            {/* Tips */}
            <div className="rounded-2xl border border-border-light bg-background p-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Conseils</h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Décrivez votre problème en détail
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Pour une commande, ouvrez le chat depuis son suivi : elle est jointe à la conversation
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Container>

      {/* The real floating chat widget from features/support-chat */}
      <SupportChatWidget />
    </main>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="text-center p-4 rounded-xl bg-muted/30 border border-border-light">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white text-sm font-bold mx-auto mb-2">
        {number}
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
