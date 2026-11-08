import { Breadcrumb } from "@/components/ui";
import { createMetadata } from "@/lib/metadata";
import {
  fetchMyGroupBuyStanding,
  fetchMyGroupBuyStats,
  fetchMyGroupBuys,
} from "@/features/group-buy/api/group-buy.api";
import { MyGroupBuysClient } from "@/features/group-buy/components/MyGroupBuysClient";

export const metadata = createMetadata({
  title: "Mes achats groupés",
  description: "Vos groupes en cours, vos commandes au prix de groupe et ce que vous avez économisé.",
  path: "/account/achats-groupes",
  noIndex: true,
});

/** The account layout already checked the session. */
export default async function MyGroupBuysPage() {
  const [stats, active, standing] = await Promise.all([
    fetchMyGroupBuyStats().catch(() => null),
    fetchMyGroupBuys("active").catch(() => null),
    fetchMyGroupBuyStanding().catch(() => null),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Mon compte", href: "/account" }, { label: "Mes achats groupés" }]} />
        <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">Mes achats groupés</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Suivez vos groupes et commandez votre part dès que le prix est bloqué.
        </p>
      </div>
      <MyGroupBuysClient stats={stats} initialActive={active} standing={standing} />
    </div>
  );
}
