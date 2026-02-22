import Link from "next/link";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Créer un compte",
  description: "Inscrivez-vous sur Sugu pour profiter de milliers de produits.",
  path: "/onboarding",
  noIndex: true,
});

export default function OnboardingPage() {
  return (
    <div className="space-y-6">
      {/* Mobile logo */}
      <div className="lg:hidden text-center mb-8">
        <span className="text-2xl font-black text-primary">Sugu</span>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground">Créer un compte</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Rejoignez Sugu et commencez à acheter dès aujourd&apos;hui.
        </p>
      </div>

      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="firstName" className="text-sm font-medium text-foreground">
              Prénom
            </label>
            <input
              id="firstName"
              type="text"
              placeholder="Amadou"
              className="h-12 rounded-xl border border-border bg-background px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              autoComplete="given-name"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lastName" className="text-sm font-medium text-foreground">
              Nom
            </label>
            <input
              id="lastName"
              type="text"
              placeholder="Ouédraogo"
              className="h-12 rounded-xl border border-border bg-background px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              autoComplete="family-name"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="votre@email.com"
            className="h-12 rounded-xl border border-border bg-background px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            autoComplete="email"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-sm font-medium text-foreground">
            Téléphone
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="+226 70 00 00 00"
            className="h-12 rounded-xl border border-border bg-background px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            autoComplete="tel"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="h-12 rounded-xl border border-border bg-background px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            autoComplete="new-password"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
            Confirmer le mot de passe
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            className="h-12 rounded-xl border border-border bg-background px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          className="w-full h-12 rounded-xl bg-primary text-white font-semibold transition-all hover:bg-primary-dark active:scale-[0.98]"
        >
          Créer mon compte
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
