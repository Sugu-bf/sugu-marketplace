import type { Metadata } from "next";
import Link from "next/link";
import { Truck, Package, RotateCcw, Clock, MapPin, Shield, AlertTriangle, CreditCard, CheckCircle, XCircle, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Politique de Livraison & Retours — Sugu",
  description:
    "Conditions de livraison, retours et remboursements sur la marketplace Sugu. Délais, zones couvertes, vérification des produits et processus de retour au Burkina Faso.",
  alternates: { canonical: "/politique-livraison-retours" },
  openGraph: {
    title: "Politique de Livraison & Retours — Sugu",
    description:
      "Tout savoir sur la livraison et les retours sur Sugu : délais, frais, vérification et remboursements.",
    type: "article",
  },
};

/* ── Section Component ── */
function Section({
  icon: Icon,
  title,
  id,
  children,
}: {
  icon: React.ElementType;
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F15412]">
          <Icon size={20} />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="pl-0 md:pl-[52px] space-y-4 text-gray-700 leading-relaxed text-[15px]">
        {children}
      </div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

const tocItems = [
  { id: "zones", label: "Zones de livraison" },
  { id: "delais", label: "Délais de livraison" },
  { id: "frais", label: "Frais de livraison" },
  { id: "suivi", label: "Suivi de commande" },
  { id: "reception", label: "Réception et vérification" },
  { id: "code-livraison", label: "Code de livraison" },
  { id: "retours", label: "Politique de retours" },
  { id: "remboursements", label: "Remboursements" },
  { id: "cas-speciaux", label: "Cas spéciaux" },
  { id: "contact-livraison", label: "Contact" },
];

export default function DeliveryPolicyPage() {
  return (
    <article className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm mb-6">
            <Truck size={14} />
            <span>Dernière mise à jour : 8 mars 2026</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Livraison &amp; Retours
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Tout ce que vous devez savoir sur la livraison de vos commandes,
            la vérification des produits et la procédure de retour.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 md:py-16">
        {/* ── TOC ── */}
        <nav className="mb-12 p-6 rounded-2xl bg-gray-50 border border-gray-100" aria-label="Sommaire">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Sommaire</h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tocItems.map((item, i) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-[#F15412] transition-colors group"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-gray-200 text-xs font-semibold text-gray-400 group-hover:border-orange-200 group-hover:text-[#F15412] transition-colors">
                    {i + 1}
                  </span>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* ── Content ── */}
        <div className="space-y-12">

          {/* 1 — Zones */}
          <Section icon={MapPin} title="Zones de livraison" id="zones">
            <p>
              Sugu assure la livraison sur l&apos;ensemble du territoire du <strong>Burkina Faso</strong>,
              selon la disponibilité des agences de livraison partenaires dans votre zone.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 pr-4 font-semibold text-gray-900">Zone</th>
                    <th className="text-left py-3 pr-4 font-semibold text-gray-900">Couverture</th>
                    <th className="text-left py-3 font-semibold text-gray-900">Délai estimé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="py-2.5 pr-4">Ouagadougou centre</td><td className="py-2.5 pr-4">Complète</td><td className="py-2.5">24 – 48h</td></tr>
                  <tr><td className="py-2.5 pr-4">Ouagadougou périphérie</td><td className="py-2.5 pr-4">Complète</td><td className="py-2.5">48 – 72h</td></tr>
                  <tr><td className="py-2.5 pr-4">Bobo-Dioulasso</td><td className="py-2.5 pr-4">Complète</td><td className="py-2.5">48 – 72h</td></tr>
                  <tr><td className="py-2.5 pr-4">Autres villes (Koudougou, Banfora, etc.)</td><td className="py-2.5 pr-4">Partielle</td><td className="py-2.5">3 – 7 jours</td></tr>
                  <tr><td className="py-2.5 pr-4">Zones rurales</td><td className="py-2.5 pr-4">Selon disponibilité</td><td className="py-2.5">5 – 10 jours</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500">
              La disponibilité de la livraison pour votre adresse est vérifiée lors de la validation du panier.
              Si aucune agence ne couvre votre zone, le retrait en point de collecte peut vous être proposé.
            </p>
          </Section>

          {/* 2 — Délais */}
          <Section icon={Clock} title="Délais de livraison" id="delais">
            <p>
              Les délais de livraison indiqués sont <strong>estimatifs</strong> et courent à partir
              de la <strong>confirmation de la commande par le vendeur</strong> (et non à partir de la commande).
            </p>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-sm">
              <p className="font-semibold text-blue-900 mb-1">📋 Rappel important</p>
              <p className="text-blue-800">
                Le vendeur dispose de <strong>48 heures</strong> pour confirmer votre commande.
                Si ce délai est dépassé, la commande est automatiquement annulée et vous êtes notifié.
              </p>
            </div>
            <p>
              Les facteurs pouvant impacter les délais incluent : disponibilité du produit,
              conditions météorologiques, jours fériés, charge des agences de livraison et
              accessibilité de l&apos;adresse de livraison.
            </p>
            <p>
              Sugu ne peut être tenu responsable des retards de livraison, sauf en cas de faute
              avérée de la plateforme. Cependant, si un délai raisonnable est dépassé, vous pouvez
              ouvrir un litige pour obtenir une résolution.
            </p>
          </Section>

          {/* 3 — Frais */}
          <Section icon={CreditCard} title="Frais de livraison" id="frais">
            <p>
              Les frais de livraison sont calculés en fonction de :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>La <strong>distance</strong> entre le vendeur et l&apos;acheteur</li>
              <li>Le <strong>poids et le volume</strong> du colis</li>
              <li>La <strong>zone de livraison</strong> (tarifs variables selon les agences)</li>
              <li>Le <strong>mode de livraison</strong> choisi (standard, express si disponible)</li>
            </ul>
            <p>
              Les frais de livraison sont affichés <strong>avant la validation du panier</strong> et
              sont facturés en supplément du prix des produits. Le montant total (produits + livraison)
              est le montant à payer au coursier lors du paiement COD.
            </p>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-sm">
              <p className="font-semibold text-green-900 mb-1">💡 Bon à savoir</p>
              <p className="text-green-800">
                Certains vendeurs proposent la <strong>livraison gratuite</strong> à partir d&apos;un certain
                montant d&apos;achat. Cette information est visible sur la fiche produit et dans le panier.
              </p>
            </div>
          </Section>

          {/* 4 — Suivi */}
          <Section icon={Package} title="Suivi de commande" id="suivi">
            <p>
              Chaque commande dispose d&apos;un numéro de suivi unique au format{" "}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">SU-YYYY-NNNNNN</code>.
              Vous pouvez suivre l&apos;avancement de votre commande en temps réel via :
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>L&apos;espace <strong>« Mes commandes »</strong> de votre compte</li>
              <li>Les <strong>notifications push</strong> à chaque changement de statut</li>
              <li>La page de <strong>suivi de commande</strong> (/track-order)</li>
            </ul>
            <p>Les statuts de suivi sont :</p>
            <div className="space-y-2 mt-2">
              {[
                { status: "En attente", color: "bg-gray-100 text-gray-700", desc: "Commande créée, en attente de confirmation vendeur" },
                { status: "Confirmée", color: "bg-blue-100 text-blue-700", desc: "Le vendeur a confirmé et prépare la commande" },
                { status: "En préparation", color: "bg-indigo-100 text-indigo-700", desc: "Le vendeur emballe les produits" },
                { status: "Emballée", color: "bg-purple-100 text-purple-700", desc: "Colis prêt, en attente de collecte par le coursier" },
                { status: "Expédiée", color: "bg-orange-100 text-orange-700", desc: "Le coursier est en route vers votre adresse" },
                { status: "Livrée", color: "bg-green-100 text-green-700", desc: "Livraison confirmée par le code de vérification" },
              ].map((item) => (
                <div key={item.status} className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${item.color}`}>
                    {item.status}
                  </span>
                  <span className="text-sm text-gray-600">{item.desc}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* 5 — Réception et vérification */}
          <Section icon={CheckCircle} title="Réception et vérification" id="reception">
            <p>
              La réception d&apos;une commande sur Sugu suit un <strong>processus de vérification en 3 étapes</strong>{" "}
              conçu pour protéger toutes les parties :
            </p>

            <div className="space-y-4 mt-4">
              <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F15412] text-white text-xs font-bold">1</span>
                  <h4 className="font-bold text-gray-900">Vérification des produits</h4>
                </div>
                <p className="text-sm text-gray-700">
                  Le coursier vous présente le colis. Vous <strong>devez ouvrir et vérifier</strong> les produits
                  en sa présence. Vérifiez la conformité (bon produit, bonne quantité, pas de dommages).
                </p>
                <div className="mt-3 flex gap-3 text-sm">
                  <div className="flex items-center gap-1.5 text-green-700">
                    <CheckCircle size={14} />
                    <span>Accepter</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-red-600">
                    <XCircle size={14} />
                    <span>Refuser (litige auto-ouvert)</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
                  <h4 className="font-bold text-gray-900">Paiement au coursier (COD)</h4>
                </div>
                <p className="text-sm text-gray-700">
                  Si vous acceptez les produits, payez le montant exact au coursier en espèces
                  ou par Mobile Money. Le coursier confirme la réception du paiement dans l&apos;application.
                </p>
              </div>

              <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-white text-xs font-bold">3</span>
                  <h4 className="font-bold text-gray-900">Code de livraison</h4>
                </div>
                <p className="text-sm text-gray-700">
                  Après paiement, vous recevez un <strong>code à 6 chiffres</strong> par notification push.
                  Communiquez ce code oralement au coursier. C&apos;est votre <strong>preuve de réception</strong>.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-sm mt-4">
              <p className="font-semibold text-amber-900 mb-1">⚠️ Attention</p>
              <p className="text-amber-800">
                Ne communiquez <strong>jamais</strong> le code de livraison avant d&apos;avoir vérifié
                les produits ET effectué le paiement. Une fois le code saisi par le coursier,
                la livraison est considérée comme finalisée.
              </p>
            </div>
          </Section>

          {/* 6 — Code de livraison */}
          <Section icon={Shield} title="Code de livraison — Sécurité" id="code-livraison">
            <p>
              Le code de livraison est un élément central de sécurité :
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Généré aléatoirement</strong> — 6 chiffres uniques pour chaque livraison
              </li>
              <li>
                <strong>Envoyé par notification push</strong> — jamais affiché en clair sur le site
                pour éviter toute interception
              </li>
              <li>
                <strong>Usage unique</strong> — le code ne peut être utilisé qu&apos;une seule fois
              </li>
              <li>
                <strong>3 tentatives maximum</strong> — si le coursier entre un code incorrect 3 fois,
                le système se verrouille et un agent Sugu intervient
              </li>
              <li>
                <strong>Stocké sous forme chiffrée</strong> — le code brut n&apos;est jamais
                conservé dans nos systèmes
              </li>
            </ul>
          </Section>

          {/* 7 — Retours */}
          <Section icon={RotateCcw} title="Politique de retours" id="retours">
            <Sub title="7.1 Motifs de retour acceptés">
              <p>Un retour peut être déclenché dans les cas suivants :</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {[
                  { label: "Mauvais produit", desc: "Produit différent de la commande" },
                  { label: "Produit endommagé", desc: "Colis ou produit détérioré" },
                  { label: "Quantité incorrecte", desc: "Articles manquants ou en surplus" },
                  { label: "Non conforme", desc: "Produit différent de la description" },
                ].map((item) => (
                  <div key={item.label} className="bg-red-50 rounded-xl p-3 border border-red-100">
                    <p className="font-semibold text-red-900 text-sm">{item.label}</p>
                    <p className="text-xs text-red-700">{item.desc}</p>
                  </div>
                ))}
              </div>
            </Sub>

            <Sub title="7.2 Procédure de retour">
              <p>Le retour s&apos;effectue selon le processus suivant :</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>Refus lors de la vérification</strong> — Si vous constatez un problème
                  lors de l&apos;étape 1 (vérification produits), refusez la livraison dans l&apos;application.
                  Sélectionnez la catégorie de rejet et ajoutez une description.
                </li>
                <li>
                  <strong>Ouverture automatique de litige</strong> — Un litige (numéro DSP-XXXXXX) est
                  créé automatiquement. Toutes les parties (vous, le vendeur, l&apos;agence, l&apos;admin Sugu)
                  sont notifiées.
                </li>
                <li>
                  <strong>Photos de preuve</strong> — Prenez des photos du problème si possible.
                  Ces preuves accélèrent le traitement du litige.
                </li>
                <li>
                  <strong>Retour du colis</strong> — Le coursier reprend le colis et le retourne au vendeur.
                </li>
                <li>
                  <strong>Résolution</strong> — L&apos;équipe Sugu examine le litige et propose une résolution
                  sous <strong>5 jours ouvrés</strong>.
                </li>
              </ol>
            </Sub>

            <Sub title="7.3 Délai de signalement">
              <p>
                Les problèmes doivent être signalés <strong>au moment de la livraison</strong> (lors de la
                vérification des produits). Après validation du code de livraison, les réclamations
                sont traitées au cas par cas par le support client dans un délai maximum de{" "}
                <strong>48 heures après livraison</strong>.
              </p>
            </Sub>

            <Sub title="7.4 Produits non retournables">
              <p>Certains produits ne peuvent pas être retournés :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Produits alimentaires périssables</li>
                <li>Articles d&apos;hygiène et de soin (ouverts ou utilisés)</li>
                <li>Produits personnalisés sur commande</li>
                <li>Sous-vêtements et maillots de bain</li>
                <li>Logiciels et contenus numériques activés</li>
              </ul>
            </Sub>
          </Section>

          {/* 8 — Remboursements */}
          <Section icon={CreditCard} title="Remboursements" id="remboursements">
            <Sub title="8.1 Processus de remboursement">
              <p>
                Lorsqu&apos;un litige est résolu en faveur de l&apos;acheteur, le remboursement est effectué
                de la manière suivante :
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 pr-4 font-semibold text-gray-900">Mode de paiement initial</th>
                      <th className="text-left py-3 pr-4 font-semibold text-gray-900">Mode de remboursement</th>
                      <th className="text-left py-3 font-semibold text-gray-900">Délai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr><td className="py-2.5 pr-4">Cash-on-Delivery (COD)</td><td className="py-2.5 pr-4">Crédit wallet Sugu</td><td className="py-2.5">Immédiat</td></tr>
                    <tr><td className="py-2.5 pr-4">Mobile Money</td><td className="py-2.5 pr-4">Retour sur le compte Mobile Money</td><td className="py-2.5">3 – 5 jours ouvrés</td></tr>
                  </tbody>
                </table>
              </div>
            </Sub>

            <Sub title="8.2 Montant remboursé">
              <p>
                Le remboursement couvre le <strong>prix des produits concernés</strong>.
                Les frais de livraison sont remboursés si le retour est dû à une erreur du vendeur
                (mauvais produit, produit endommagé). En cas de rétractation de l&apos;acheteur,
                les frais de livraison restent à sa charge.
              </p>
            </Sub>
          </Section>

          {/* 9 — Cas spéciaux */}
          <Section icon={AlertTriangle} title="Cas spéciaux" id="cas-speciaux">
            <Sub title="9.1 Client absent à la livraison">
              <p>
                Si le client est absent lors de la livraison, le coursier tente de le contacter
                par téléphone. En l&apos;absence de réponse, une seconde tentative de livraison peut être
                programmée. Après 2 tentatives infructueuses, le colis est retourné au vendeur
                et des frais de retour peuvent s&apos;appliquer.
              </p>
            </Sub>

            <Sub title="9.2 Colis endommagé en transit">
              <p>
                Si le colis est visiblement endommagé à l&apos;arrivée du coursier, <strong>refusez
                la livraison</strong> lors de l&apos;étape de vérification et sélectionnez le motif
                « Produit endommagé ». Un litige sera automatiquement ouvert et l&apos;agence de
                livraison sera informée.
              </p>
            </Sub>

            <Sub title="9.3 Changement de mode de livraison">
              <p>
                Si une livraison à domicile n&apos;est pas possible, vous pouvez demander un
                changement vers un <strong>retrait en point de collecte</strong> (sous réserve
                de disponibilité) tant que la commande n&apos;est pas encore expédiée.
              </p>
            </Sub>
          </Section>

          {/* 10 — Contact */}
          <Section icon={Phone} title="Contact livraison" id="contact-livraison">
            <p>Pour toute question relative à votre livraison :</p>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-1.5 text-sm">
              <p><strong>Support Client Sugu</strong></p>
              <p>Email : <a href="mailto:support@sugu.pro" className="text-[#F15412] hover:underline">support@sugu.pro</a></p>
              <p>Chat en ligne : disponible depuis votre espace client</p>
              <p>Téléphone : +226 00 00 00 00 (Lun-Sam, 8h-18h)</p>
            </div>
          </Section>
        </div>

        {/* ── Cross-links ── */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/conditions-generales"
              className="flex-1 flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all group"
            >
              <Shield size={20} className="text-gray-400 group-hover:text-[#F15412] transition-colors" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Conditions générales</p>
                <p className="text-xs text-gray-500">CGU et CGV complètes</p>
              </div>
            </Link>
            <Link
              href="/politique-anti-fraude"
              className="flex-1 flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all group"
            >
              <AlertTriangle size={20} className="text-gray-400 group-hover:text-[#F15412] transition-colors" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Politique anti-fraude</p>
                <p className="text-xs text-gray-500">Nos mesures de protection</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
