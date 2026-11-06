import { ShoppingBag, TrendingDown, Users } from "lucide-react";
import { Breadcrumb, Container } from "@/components/ui";
import { ServiceUnavailable } from "@/components/ServiceUnavailable";
import { createMetadata } from "@/lib/metadata";
import { fetchGroupBuys } from "@/features/group-buy/api/group-buy.api";
import { GroupBuysListClient } from "@/features/group-buy/components/GroupBuysListClient";
import { parseGroupBuySort } from "@/features/group-buy/lib/group-buy-sorts";

export const metadata = createMetadata({
  title: "Achats groupés",
  description:
    "Rejoignez un achat groupé sur Sugu : plus on est nombreux, moins on paie. Gratuit pour rejoindre, vous payez votre part au prix atteint.",
  path: "/achats-groupes",
});

interface GroupBuysPageProps {
  searchParams: Promise<{ sort?: string }>;
}

export default async function GroupBuysPage({ searchParams }: GroupBuysPageProps) {
  const { sort: rawSort } = await searchParams;
  const sort = parseGroupBuySort(rawSort);

  let initial;
  try {
    initial = await fetchGroupBuys({ sort, perPage: 12 });
  } catch {
    return <ServiceUnavailable retryHref="/achats-groupes" />;
  }

  return (
    <main className="pb-16">
      <Container className="pb-2 pt-4">
        <Breadcrumb items={[{ label: "Achats groupés" }]} />
      </Container>

      <Container>
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-dark px-5 py-7 text-white shadow-lg sm:px-8 sm:py-9">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              <Users size={14} aria-hidden="true" /> Achats groupés
            </p>
            <h1 className="mt-3 text-2xl font-extrabold leading-tight sm:text-4xl">Plus on est nombreux, moins on paie.</h1>
            <p className="mt-2 text-sm text-white/85 sm:text-base">
              Rejoignez un groupe gratuitement, invitez vos proches, et commandez votre part au prix atteint à la clôture.
            </p>
          </div>
          <ul className="mt-6 grid gap-2 text-sm sm:grid-cols-3">
            <li className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
              <Users size={16} aria-hidden="true" /> Rejoignez sans payer
            </li>
            <li className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
              <TrendingDown size={16} aria-hidden="true" /> Le prix baisse à chaque palier
            </li>
            <li className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
              <ShoppingBag size={16} aria-hidden="true" /> Jamais plus cher que le prix normal
            </li>
          </ul>
        </header>
      </Container>

      <Container className="mt-6">
        <GroupBuysListClient sort={sort} initial={initial} />
      </Container>
    </main>
  );
}
