import { createMetadata } from "@/lib/metadata";
import { Breadcrumb, Badge, Button } from "@/components/ui";
import { queryCoupons } from "@/features/account";
import { formatPrice } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Tag, Copy, Calendar, ShoppingBag } from "lucide-react";

export const metadata = createMetadata({ title: "Mes Coupons", description: "Consultez et utilisez vos codes promo sur Sugu.", path: "/account/coupons", noIndex: true });

export default async function CouponsPage() {
  const coupons = await queryCoupons();
  const active = coupons.filter((c) => !c.isUsed);
  const used = coupons.filter((c) => c.isUsed);

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Mon compte", href: "/account" }, { label: "Mes coupons" }]} />
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl mt-3">Mes coupons</h1>
        <p className="text-sm text-muted-foreground mt-1">{active.length} coupon{active.length > 1 ? "s" : ""} disponible{active.length > 1 ? "s" : ""}</p>
      </div>

      {/* Active coupons */}
      {active.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Disponibles</h2>
          {active.map((coupon) => (
            <div key={coupon.id} className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary-50/30 p-5 transition-all hover:border-primary/50">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                {coupon.discountType === "percentage"
                  ? <span className="text-lg font-bold">-{coupon.discountValue}%</span>
                  : <Tag size={24} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-bold text-primary tracking-wider">{coupon.code}</code>
                  <Badge variant="success" size="xs" pill>Actif</Badge>
                </div>
                <p className="text-sm text-foreground mt-0.5">{coupon.description}</p>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><ShoppingBag size={11} /> Min. {formatPrice(coupon.minOrder)}</span>
                  <span className="flex items-center gap-1"><Calendar size={11} /> Expire le {coupon.expiresAt}</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <Copy size={14} /> Copier
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Used coupons */}
      {used.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Utilisés</h2>
          {used.map((coupon) => (
            <div key={coupon.id} className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-border-light bg-muted/30 p-5 opacity-60">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                {coupon.discountType === "percentage"
                  ? <span className="text-lg font-bold">-{coupon.discountValue}%</span>
                  : <Tag size={24} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-bold text-muted-foreground tracking-wider line-through">{coupon.code}</code>
                  <Badge variant="secondary" size="xs" pill>Utilisé</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{coupon.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
