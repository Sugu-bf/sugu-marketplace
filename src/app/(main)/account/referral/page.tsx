import { createMetadata } from "@/lib/metadata";
import { Breadcrumb, Badge } from "@/components/ui";
import { queryReferralData } from "@/features/account";
import { ReferralActions } from "@/features/account/components/ReferralActions";
import { formatPrice } from "@/lib/constants";
import { Gift, Users, Coins } from "lucide-react";

export const metadata = createMetadata({ title: "Parrainer un ami", description: "Parrainez vos amis et gagnez des récompenses sur Sugu.", path: "/account/referral", noIndex: true });

export default async function ReferralPage() {
  const data = await queryReferralData();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Mon compte", href: "/account" }, { label: "Parrainer un ami" }]} />
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl mt-3">Parrainer un ami</h1>
        {data.rewardPerReferral > 0 && (
          <p className="text-sm text-muted-foreground mt-1">Gagnez {formatPrice(data.rewardPerReferral)} par parrainage réussi</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border-light bg-background p-5 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary mx-auto mb-2"><Users size={20} /></div>
          <p className="text-2xl font-bold text-foreground">{data.totalReferred}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Amis parrainés</p>
        </div>
        <div className="rounded-2xl border border-border-light bg-background p-5 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-success mx-auto mb-2"><Coins size={20} /></div>
          <p className="text-2xl font-bold text-primary">{formatPrice(data.totalEarnings)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total gagné</p>
        </div>
        <div className="rounded-2xl border border-border-light bg-background p-5 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-dark mx-auto mb-2"><Gift size={20} /></div>
          <p className="text-2xl font-bold text-foreground">{formatPrice(data.rewardPerReferral)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Par parrainage</p>
        </div>
      </div>

      {/* Referral code card */}
      {data.referralCode ? (
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary-light p-6 text-white">
          <p className="text-sm font-medium opacity-80">Votre code de parrainage</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-2">
            <code className="text-2xl font-bold tracking-wider bg-white/20 rounded-xl px-5 py-2.5">
              {data.referralCode}
            </code>
            <ReferralActions
              referralCode={data.referralCode}
              referralLink={data.referralLink}
            />
          </div>
          {data.referralLink && (
            <p className="text-xs opacity-70 mt-3">{data.referralLink}</p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-border-light bg-background p-6 text-center">
          <Gift size={32} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucun code de parrainage disponible pour le moment.</p>
        </div>
      )}

      {/* Referred users */}
      {data.referredUsers.length > 0 && (
        <div className="rounded-2xl border border-border-light bg-background p-5 sm:p-6">
          <h2 className="text-base font-bold text-foreground mb-4">Amis parrainés</h2>
          <div className="space-y-3">
            {data.referredUsers.map((user, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary text-xs font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <Badge variant={user.status === "completed" || user.status === "1" ? "success" : "secondary"} size="xs" pill>
                  {user.status === "completed" || user.status === "1" ? "Complété" : "En attente"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
