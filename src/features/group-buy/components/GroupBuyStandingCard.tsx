import Link from "next/link";
import { Ban, CircleCheck, Gauge, ShieldAlert, ShieldCheck, Wallet } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { MyGroupBuyStanding } from "../api/group-buy.schemas";
import { formatCentimes, formatDay, plural } from "../lib/group-buy-format";

/** Dates of the record are calendar days in Ouagadougou, like the server's messages. */
const TZ = "Africa/Ouagadougou";

/**
 * "Ma fiabilité": the customer's level and how much they may hold reserved,
 * their strikes and what they cost — said plainly, so a sanction never
 * comes as a surprise.
 */
export function GroupBuyStandingCard({ standing }: { standing: MyGroupBuyStanding }) {
  const rules = standing.rules ?? null;
  const active = standing.strikes.filter((strike) => !strike.voided);
  const voided = standing.strikes.filter((strike) => strike.voided);
  const until = formatDay(standing.suspended_until, TZ);
  const used =
    standing.max_amount && standing.max_amount > 0
      ? Math.min(100, Math.round((standing.reserved_amount / standing.max_amount) * 100))
      : 0;

  return (
    <section className="rounded-2xl border border-border-light bg-white p-4 shadow-sm sm:p-5" aria-labelledby="gb-standing">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="gb-standing" className="inline-flex items-center gap-2 text-base font-bold text-foreground">
          <ShieldCheck size={18} className="text-primary" aria-hidden="true" />
          Ma fiabilité
        </h2>
        <Badge variant={standing.active_strikes > 0 ? "warning" : "success"} size="sm" pill>
          Niveau {standing.level_label}
        </Badge>
      </div>

      <p className="mt-1 text-xs text-foreground/70">
        {standing.delivered_orders} {plural(standing.delivered_orders, "commande livrée", "commandes livrées")}. Chaque
        commande livrée augmente votre plafond.
      </p>

      {/* ── Ceiling ── */}
      <div className="mt-3 rounded-xl bg-muted/60 p-3">
        {standing.max_amount === null ? (
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Gauge size={16} className="text-primary" aria-hidden="true" /> Pas de plafond de réservation
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                <Gauge size={16} className="text-primary" aria-hidden="true" /> Plafond : {formatCentimes(standing.max_amount)}
              </span>
              <span className="text-foreground/70">Réservé : {formatCentimes(standing.reserved_amount)}</span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-white"
              role="progressbar"
              aria-label="Part du plafond déjà réservée"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={used}
            >
              <div className={cn("h-full rounded-full", used >= 100 ? "bg-amber-500" : "bg-primary")} style={{ width: `${used}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-foreground/70">
              Encore possible : {formatCentimes(standing.available_amount ?? 0)}, au prix normal, tous groupes en cours compris.
            </p>
          </>
        )}
      </div>

      {/* ── Sanctions ── */}
      {standing.banned && (
        <Callout tone="danger" icon={<Ban size={16} />}>
          Votre compte ne peut plus participer aux achats groupés. Contactez le service client pour en parler.
        </Callout>
      )}
      {!standing.banned && standing.suspended_until && (
        <Callout tone="warning" icon={<ShieldAlert size={16} />}>
          Vous ne pouvez plus rejoindre ni lancer de groupe{until ? ` jusqu’au ${until}` : " pour le moment"}. Vos places
          déjà réservées restent valables.
        </Callout>
      )}
      {!standing.banned && standing.prepay_required && (
        <Callout tone="warning" icon={<Wallet size={16} />}>
          Paiement d’avance : à chaque clôture, vous payez votre part en ligne en premier, avant les autres membres.
        </Callout>
      )}

      {/* ── Strikes ── */}
      <div className="mt-4">
        <p className="text-sm font-semibold text-foreground">
          {active.length === 0
            ? "Aucun abandon en cours"
            : `${active.length} ${plural(active.length, "abandon compte", "abandons comptent")} en ce moment`}
        </p>
        {active.length === 0 && (
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-green-700">
            <CircleCheck size={14} aria-hidden="true" /> Merci de tenir vos engagements.
          </p>
        )}
        {standing.strikes.length > 0 && (
          <ul className="mt-2 divide-y divide-border-light rounded-xl border border-border-light">
            {[...active, ...voided].map((strike) => (
              <li key={strike.id} className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className={cn("font-medium", strike.voided ? "text-foreground/50 line-through" : "text-foreground")}>
                    {strike.label}
                  </p>
                  <p className="text-xs text-foreground/60">
                    {formatDay(strike.at, TZ) ? `Le ${formatDay(strike.at, TZ)}` : null}
                    {strike.group_code && (
                      <>
                        {" · "}
                        <Link href={`/groupe/${strike.group_code}`} className="font-semibold text-primary hover:underline">
                          groupe {strike.group_code}
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                <span className="text-xs text-foreground/60">
                  {strike.voided
                    ? "Annulé par Sugu"
                    : strike.counts_until
                      ? `Compte jusqu’au ${formatDay(strike.counts_until, TZ)}`
                      : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {rules && (
        <p className="mt-4 text-xs leading-relaxed text-foreground/70">
          Une place laissée sans commande après le prix obtenu, une grosse réservation non payée à temps ou un colis refusé à
          la livraison compte comme un abandon pendant {rules.strike_window_days} jours. À {rules.suspend_after_strikes}{" "}
          abandons : pas de nouveau groupe pendant {rules.suspension_days} jours ; à {rules.prepay_after_strikes} :{" "}
          {rules.long_suspension_days} jours, puis paiement d’avance.
        </p>
      )}
    </section>
  );
}

const TONES = {
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-800",
} as const;

function Callout({ tone, icon, children }: { tone: keyof typeof TONES; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={cn("mt-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm", TONES[tone])} role="status">
      <span className="mt-0.5 flex-shrink-0" aria-hidden="true">
        {icon}
      </span>
      <div>{children}</div>
    </div>
  );
}
