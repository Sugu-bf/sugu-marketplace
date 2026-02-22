import { createMetadata } from "@/lib/metadata";
import { Container } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = createMetadata({
  title: "Promotions & Bannières",
  description: "Découvrez nos offres spéciales et promotions en cours sur Sugu.",
  path: "/banners",
});

export default function BannersPage() {
  return (
    <Container as="section" className="py-8">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        Promotions & Bannières
      </h1>
      <p className="mt-2 text-muted-foreground">
        Toutes nos offres et promotions en cours.
      </p>

      <div className="mt-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[180px] sm:h-[220px] rounded-2xl" />
        ))}
      </div>
    </Container>
  );
}
