import { createMetadata } from "@/lib/metadata";
import { Container, Breadcrumb } from "@/components/ui";
import { SupportChatWidget } from "@/features/support-chat";
import { AssuranceBadge } from "@/components/ui/assurance-badge";
import { Headphones, ShieldCheck, Clock, Phone, MessageCircle, Mail } from "lucide-react";

export const metadata = createMetadata({
  title: "Chat Support",
  description: "Discutez en direct avec notre équipe de support Sugu. Disponible 24/7.",
  path: "/support-chat",
  noIndex: true,
});

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
          Notre équipe est disponible pour vous aider
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
                Cliquez sur le bouton de chat en bas à droite de votre écran pour commencer une conversation
                avec un agent Sugu. Notre équipe est disponible 24/7 pour vous aider.
              </p>

              {/* Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                <StepCard number={1} title="Ouvrir le chat" description="Cliquez sur le bouton orange en bas à droite" />
                <StepCard number={2} title="Décrire votre problème" description="Entrez un sujet et lancez le chat" />
                <StepCard number={3} title="Obtenir de l'aide" description="Un agent vous répondra en quelques minutes" />
              </div>
            </div>

            {/* Alternative contact */}
            <div className="rounded-2xl border border-border-light bg-background p-5 sm:p-6">
              <h2 className="text-base font-bold text-foreground mb-4">
                Autres moyens de nous contacter
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <ContactCard icon={<Phone size={18} />} label="Téléphone" value="+226 25 00 00 00" href="tel:+22625000000" />
                <ContactCard icon={<MessageCircle size={18} />} label="WhatsApp" value="+226 70 00 00 00" href="https://wa.me/22664528958" />
                <ContactCard icon={<Mail size={18} />} label="Email" value="support@sugu.pro" href="mailto:support@sugu.pro" />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:col-span-1">
            {/* Agent status */}
            <div className="rounded-2xl border border-border-light bg-background p-5 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white text-2xl font-bold mx-auto">
                S
              </div>
              <p className="text-sm font-bold text-foreground mt-3">Support Sugu</p>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-success font-medium">En ligne</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Temps de réponse moyen : &lt;2 min
              </p>
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
                  Fournissez votre numéro de commande si applicable
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Joignez des captures d&apos;écran si nécessaire
                </li>
              </ul>
            </div>

            {/* Badges */}
            <div className="space-y-2">
              <AssuranceBadge icon={<Headphones size={16} />} label="Support 24/7" />
              <AssuranceBadge icon={<ShieldCheck size={16} />} label="Conversation sécurisée" />
              <AssuranceBadge icon={<Clock size={16} />} label="Réponse rapide" />
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

function ContactCard({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30 border border-border-light hover:bg-primary-50 hover:border-primary/20 transition-all group">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
        {icon}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </a>
  );
}
