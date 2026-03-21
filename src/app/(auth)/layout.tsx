import Image from "next/image";

const LOGO_URL = "https://cdn.sugu.pro/p/logo-sugu.avif";

/**
 * Auth layout — clean, full-screen for login/onboarding.
 * No Header or Footer here.
 * Desktop: brand panel left + form right.
 * Mobile: full-width form only (logo affiché en haut du formulaire).
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left — Brand panel (desktop only) */}
      <div className="hidden lg:flex lg:w-[45%] flex-col items-center justify-center bg-gradient-to-br from-primary via-primary-dark to-primary-900 px-12 text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-12 h-48 w-48 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Logo Sugu — CDN */}
          <div className="relative h-24 w-48 mb-8">
            <Image
              src={LOGO_URL}
              alt="Sugu"
              fill
              className="object-contain drop-shadow-lg"
              sizes="192px"
              priority
            />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-center">
            Bienvenue sur Sugu
          </h2>
          <p className="mt-4 max-w-sm text-center text-white/70 text-sm leading-relaxed">
            La plus grande plateforme de vente en ligne. Découvrez des milliers
            de produits au meilleur prix.
          </p>
        </div>
      </div>

      {/* Right — Form */}
      <main className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12 sm:px-8">
        {/* Logo visible UNIQUEMENT sur mobile (panneau gauche caché) */}
        <div className="mb-8 lg:hidden">
          <Image
            src={LOGO_URL}
            alt="Sugu"
            width={140}
            height={56}
            className="object-contain"
            priority
          />
        </div>

        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
