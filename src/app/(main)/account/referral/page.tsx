import { createMetadata } from "@/lib/metadata";
import { Breadcrumb, Badge } from "@/components/ui";
import { Gift } from "lucide-react";

export const metadata = createMetadata({ title: "Parrainer un ami", description: "Le parrainage arrive bientôt sur Sugu.", path: "/account/referral", noIndex: true });

/**
 * The referral programme is not open yet: no reward is paid, no referral is
 * recorded and the share link has no page. The page says so, and shows no
 * code, figure or reward until it is.
 */
export default function ReferralPage() {
  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Mon compte", href: "/account" }, { label: "Parrainer un ami" }]} />
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl mt-3">Parrainer un ami</h1>
      </div>

      <div className="rounded-2xl border border-border/80 bg-white shadow-sm p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary mx-auto mb-3">
          <Gift size={24} />
        </div>
        <Badge variant="secondary" size="sm" pill>Bientôt disponible</Badge>
        <p className="text-base font-semibold text-foreground mt-3">Le parrainage arrive bientôt</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Vous pourrez bientôt inviter vos proches à rejoindre Sugu. Nous vous préviendrons dès que
          le programme sera ouvert, avec ses conditions.
        </p>
      </div>
    </div>
  );
}
