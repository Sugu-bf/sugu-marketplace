import type { Metadata } from "next";
import Link from "next/link";
import { Scale, ShoppingCart, Truck, Shield, AlertTriangle, Ban, CreditCard, MessageSquare, FileText, Gavel, Globe, Clock, UserCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — Sugu",
  description:
    "Conditions générales d'utilisation et de vente de la marketplace Sugu. Règles applicables aux acheteurs, vendeurs, agences de livraison et coursiers au Burkina Faso.",
  alternates: { canonical: "/conditions-generales" },
  openGraph: {
    title: "Conditions Générales d'Utilisation — Sugu",
    description:
      "CGU et CGV de la marketplace Sugu — droits et obligations de chaque partie prenante.",
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

/* ── Sub-section ── */
function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

/* ── Table of Contents ── */
const tocItems = [
  { id: "objet", label: "Objet et champ d'application" },
  { id: "definitions", label: "Définitions" },
  { id: "inscription", label: "Inscription et compte" },
  { id: "marketplace", label: "Fonctionnement de la marketplace" },
  { id: "commandes", label: "Commandes et processus de vente" },
  { id: "prix", label: "Prix et paiements" },
  { id: "livraison", label: "Livraison et vérification" },
  { id: "wallet", label: "Portefeuille vendeur (Wallet)" },
  { id: "litiges", label: "Litiges et réclamations" },
  { id: "obligations-vendeur", label: "Obligations des vendeurs" },
  { id: "obligations-acheteur", label: "Obligations des acheteurs" },
  { id: "obligations-livreur", label: "Obligations des livreurs" },
  { id: "interdictions", label: "Produits et comportements interdits" },
  { id: "propriete", label: "Propriété intellectuelle" },
  { id: "responsabilite", label: "Limitation de responsabilité" },
  { id: "resiliation", label: "Résiliation et sanctions" },
  { id: "droit-applicable", label: "Droit applicable et juridiction" },
  { id: "modifications-cgu", label: "Modifications des CGU" },
];

export default function TermsPage() {
  return (
    <article className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm mb-6">
            <Scale size={14} />
            <span>Dernière mise à jour : 8 mars 2026</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Conditions Générales
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Conditions d&apos;utilisation et de vente de la marketplace Sugu.
            En utilisant nos services, vous acceptez les présentes conditions.
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

          {/* 1 — Objet */}
          <Section icon={FileText} title="Objet et champ d'application" id="objet">
            <p>
              Les présentes Conditions Générales d&apos;Utilisation et de Vente (ci-après « CGU/CGV »)
              régissent l&apos;accès et l&apos;utilisation de la plateforme <strong>Sugu</strong> (site web{" "}
              <a href="https://sugu.pro" className="text-[#F15412] hover:underline">sugu.pro</a>{" "}
              et application mobile), éditée par <strong>SUGU SARL</strong>, société de droit burkinabè.
            </p>
            <p>
              Sugu est une marketplace, c&apos;est-à-dire un intermédiaire technique mettant en relation
              des vendeurs professionnels et des acheteurs, conformément à la{" "}
              <strong>Loi N°045-2009/AN du 10 novembre 2009</strong> portant réglementation des services
              et transactions électroniques au Burkina Faso.
            </p>
            <p>
              L&apos;utilisation des services Sugu implique l&apos;acceptation pleine et entière des présentes CGU/CGV.
              En cas de désaccord, l&apos;utilisateur doit cesser immédiatement d&apos;utiliser la plateforme.
            </p>
          </Section>

          {/* 2 — Définitions */}
          <Section icon={FileText} title="Définitions" id="definitions">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 pr-4 font-semibold text-gray-900 w-1/3">Terme</th>
                    <th className="text-left py-3 font-semibold text-gray-900">Définition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="py-2.5 pr-4 font-medium">Plateforme</td><td className="py-2.5">Le site web sugu.pro et l&apos;application mobile Sugu</td></tr>
                  <tr><td className="py-2.5 pr-4 font-medium">Acheteur / Client</td><td className="py-2.5">Toute personne physique inscrite effectuant un achat</td></tr>
                  <tr><td className="py-2.5 pr-4 font-medium">Vendeur</td><td className="py-2.5">Personne physique ou morale proposant des produits à la vente via Sugu</td></tr>
                  <tr><td className="py-2.5 pr-4 font-medium">Store</td><td className="py-2.5">Boutique virtuelle du vendeur sur la plateforme</td></tr>
                  <tr><td className="py-2.5 pr-4 font-medium">Agence</td><td className="py-2.5">Société de livraison partenaire gérant les coursiers</td></tr>
                  <tr><td className="py-2.5 pr-4 font-medium">Coursier</td><td className="py-2.5">Personne physique effectuant la livraison pour le compte d&apos;une agence</td></tr>
                  <tr><td className="py-2.5 pr-4 font-medium">COD</td><td className="py-2.5">Cash-on-Delivery — paiement à la livraison en espèces</td></tr>
                  <tr><td className="py-2.5 pr-4 font-medium">Wallet</td><td className="py-2.5">Portefeuille électronique du vendeur crédité après livraison confirmée</td></tr>
                  <tr><td className="py-2.5 pr-4 font-medium">Code de livraison</td><td className="py-2.5">Code à 6 chiffres envoyé au client pour confirmer la réception</td></tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* 3 — Inscription */}
          <Section icon={UserCheck} title="Inscription et compte" id="inscription">
            <Sub title="3.1 Conditions d'inscription">
              <p>
                L&apos;inscription est ouverte à toute personne physique âgée d&apos;au moins <strong>18 ans</strong>{" "}
                (ou 16 ans avec autorisation parentale) et disposant de la capacité juridique, ou à toute
                personne morale légalement constituée au Burkina Faso ou dans un pays de la CEDEAO.
              </p>
            </Sub>
            <Sub title="3.2 Données obligatoires">
              <p>
                Lors de l&apos;inscription, l&apos;utilisateur fournit : nom complet, adresse email valide,
                numéro de téléphone au format international et mot de passe sécurisé.
                Les vendeurs doivent en outre fournir leur numéro RCCM, IFU et coordonnées bancaires.
              </p>
            </Sub>
            <Sub title="3.3 Sécurité du compte">
              <p>
                L&apos;utilisateur est seul responsable de la confidentialité de ses identifiants. Toute activité
                réalisée sous son compte est présumée effectuée par lui. En cas d&apos;utilisation non autorisée,
                il doit immédiatement en informer Sugu à <a href="mailto:contact@sugu.pro" className="text-[#F15412] hover:underline">contact@sugu.pro</a>.
              </p>
            </Sub>
            <Sub title="3.4 Vérification d'identité">
              <p>
                Sugu se réserve le droit de demander des justificatifs d&apos;identité et/ou d&apos;activité
                commerciale à tout moment, conformément aux obligations de vigilance.
                Le refus de fournir ces documents peut entraîner la suspension du compte.
              </p>
            </Sub>
          </Section>

          {/* 4 — Marketplace */}
          <Section icon={Globe} title="Fonctionnement de la marketplace" id="marketplace">
            <Sub title="4.1 Rôle d'intermédiaire">
              <p>
                Sugu agit en qualité d&apos;hébergeur et d&apos;intermédiaire technique au sens de la{" "}
                <strong>Loi N°045-2009/AN</strong>. Sugu n&apos;est <strong>ni vendeur ni acheteur</strong>{" "}
                des produits proposés. Le contrat de vente est conclu directement entre l&apos;acheteur et le vendeur.
              </p>
            </Sub>
            <Sub title="4.2 Commission">
              <p>
                Sugu perçoit une commission sur chaque vente réalisée. Le taux est communiqué au vendeur
                lors de son inscription et peut être révisé avec un préavis de <strong>30 jours</strong>.
                Les frais de livraison sont facturés séparément.
              </p>
            </Sub>
            <Sub title="4.3 Catalogue produits">
              <p>
                Les vendeurs sont seuls responsables du contenu de leurs fiches produits (description,
                photos, prix, stock). Sugu se réserve le droit de retirer tout produit contrevenant
                aux présentes CGU ou à la législation en vigueur.
              </p>
            </Sub>
          </Section>

          {/* 5 — Commandes */}
          <Section icon={ShoppingCart} title="Commandes et processus de vente" id="commandes">
            <Sub title="5.1 Passation de commande">
              <p>
                L&apos;acheteur passe commande en ajoutant des produits au panier puis en validant.
                Chaque commande reçoit un numéro unique (format : <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">SU-YYYY-NNNNNN</code>).
                La commande ne vaut pas encore acceptation tant que le vendeur ne l&apos;a pas confirmée.
              </p>
            </Sub>
            <Sub title="5.2 Confirmation vendeur">
              <p>
                Le vendeur dispose d&apos;un délai de <strong>48 heures</strong> pour confirmer la commande.
                Un rappel automatique est envoyé à 24h du délai. Passé 48h sans confirmation,
                la commande est <strong>automatiquement annulée</strong> et le client est notifié.
              </p>
            </Sub>
            <Sub title="5.3 Snapshot de prix">
              <p>
                Au moment de la validation de commande, un <strong>instantané des prix</strong> est capturé
                et enregistré dans les métadonnées de chaque article. Aucune modification de prix
                postérieure à la commande ne peut affecter le montant facturé.
              </p>
            </Sub>
            <Sub title="5.4 Annulation">
              <p>
                L&apos;acheteur peut annuler une commande tant que son statut est « pending » ou « confirmed ».
                Le vendeur peut annuler avant l&apos;expédition (statut « processing » max). Les annulations
                abusives répétées impactent le score de fiabilité de l&apos;acteur concerné.
              </p>
            </Sub>
          </Section>

          {/* 6 — Prix et paiements */}
          <Section icon={CreditCard} title="Prix et paiements" id="prix">
            <Sub title="6.1 Monnaie">
              <p>
                Tous les prix sont affichés et facturés en <strong>Franc CFA (XOF)</strong>,
                monnaie ayant cours légal au Burkina Faso.
              </p>
            </Sub>
            <Sub title="6.2 Modes de paiement">
              <p>
                Sugu propose le paiement par <strong>Cash-on-Delivery (COD)</strong> — paiement en espèces
                au coursier à la livraison — et par <strong>Mobile Money</strong> (Orange Money, Moov Money).
              </p>
            </Sub>
            <Sub title="6.3 Conformité fiscale">
              <p>
                Les vendeurs sont responsables de leurs obligations fiscales propres (IFU, déclarations).
                Sugu émet un relevé mensuel des commissions perçues. Les obligations de facturation
                électronique sont respectées conformément aux dispositions de la Loi N°045-2009/AN.
              </p>
            </Sub>
          </Section>

          {/* 7 — Livraison */}
          <Section icon={Truck} title="Livraison et vérification" id="livraison">
            <Sub title="7.1 Délais de livraison">
              <p>
                Les délais de livraison sont indicatifs et dépendent de la zone géographique,
                de la disponibilité des coursiers et des conditions extérieures. Sugu ne peut être
                tenu responsable des retards sauf en cas de faute avérée.
              </p>
            </Sub>
            <Sub title="7.2 Vérification des produits">
              <p>
                À la réception, l&apos;acheteur <strong>doit vérifier les produits</strong> en présence du coursier.
                Il peut accepter ou refuser les produits. En cas de refus (produit endommagé, non conforme
                ou manquant), un <strong>litige est automatiquement ouvert</strong> et le colis est retourné.
              </p>
            </Sub>
            <Sub title="7.3 Paiement COD">
              <p>
                Après acceptation des produits, l&apos;acheteur paie le montant exact au coursier.
                Le coursier confirme la réception du paiement dans l&apos;application.
                Le montant doit correspondre exactement au total de la commande.
              </p>
            </Sub>
            <Sub title="7.4 Code de livraison">
              <p>
                Après paiement COD, un <strong>code de livraison à 6 chiffres</strong> est envoyé
                au client par notification push. Le client communique ce code oralement au coursier,
                qui le saisit pour confirmer la livraison. Ce mécanisme constitue la preuve de remise.
              </p>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-sm">
                <p className="font-semibold text-amber-900 mb-1">⚠️ Sécurité</p>
                <p className="text-amber-800">
                  Ne partagez jamais votre code de livraison avant d&apos;avoir vérifié les produits
                  ET effectué le paiement. Le code est votre preuve de réception.
                  Le coursier dispose de 3 tentatives maximum pour saisir le code.
                </p>
              </div>
            </Sub>
            <Sub title="7.5 Preuve de livraison">
              <p>
                La saisie correcte du code de livraison par le coursier constitue la preuve de remise
                du colis. Cette vérification déclenche le passage du statut de commande à « Livré »
                et le crédit du wallet vendeur (après déduction de la commission Sugu).
              </p>
            </Sub>
          </Section>

          {/* 8 — Wallet */}
          <Section icon={CreditCard} title="Portefeuille vendeur (Wallet)" id="wallet">
            <Sub title="8.1 Crédit du wallet">
              <p>
                Le wallet du vendeur est crédité après confirmation de livraison (code de livraison vérifié).
                Le montant crédité correspond au prix de vente <strong>moins la commission Sugu</strong> et
                les éventuels frais de livraison pris en charge.
              </p>
            </Sub>
            <Sub title="8.2 Retrait (payout)">
              <p>Les vendeurs peuvent demander un retrait sous conditions :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Montant minimum : <strong>5 000 FCFA</strong></li>
                <li>Montant maximum par retrait : <strong>5 000 000 FCFA</strong></li>
                <li>Limite journalière : <strong>10 000 000 FCFA</strong></li>
                <li>Maximum <strong>3 demandes de retrait simultanées</strong> en attente</li>
                <li>Frais de retrait : <strong>gratuit</strong> (inclus dans la commission de vente de 5%)</li>
                <li>Délai de traitement : <strong>24 à 48 heures ouvrées</strong></li>
              </ul>
            </Sub>
            <Sub title="8.3 Sécurité financière">
              <p>
                Toutes les opérations sur le wallet sont enregistrées dans un journal d&apos;audit immuable.
                En cas de suspicion de fraude ou de litige, Sugu se réserve le droit de geler temporairement
                le wallet le temps de l&apos;investigation.
              </p>
            </Sub>
          </Section>

          {/* 9 — Litiges */}
          <Section icon={MessageSquare} title="Litiges et réclamations" id="litiges">
            <Sub title="9.1 Processus de litige">
              <p>
                En cas de problème avec une commande (produit non conforme, endommagé, manquant),
                un litige peut être ouvert automatiquement lors du refus de produits à la livraison
                ou manuellement depuis l&apos;espace client. Chaque litige reçoit un numéro unique
                (format : <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">DSP-XXXXXX</code>).
              </p>
            </Sub>
            <Sub title="9.2 Médiation">
              <p>
                Sugu intervient en qualité de médiateur entre l&apos;acheteur et le vendeur. L&apos;équipe support
                examined les preuves (photos, historique de commande, tracking) et propose une résolution
                dans un délai de <strong>5 jours ouvrés</strong>.
              </p>
            </Sub>
            <Sub title="9.3 Remboursement">
              <p>
                En cas de résolution en faveur de l&apos;acheteur, le remboursement est effectué
                sur le wallet de l&apos;acheteur. Les montants peuvent être débités du wallet vendeur
                si la responsabilité du vendeur est établie.
              </p>
            </Sub>
            <Sub title="9.4 Recours externes">
              <p>
                Si la médiation Sugu ne vous satisfait pas, vous pouvez saisir :
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>La <strong>Direction Générale du Commerce</strong> (protection du consommateur)</li>
                <li>Le <strong>Tribunal de Commerce de Ouagadougou</strong></li>
                <li>L&apos;<strong>ARCEP</strong> pour les questions relatives aux communications électroniques</li>
              </ul>
            </Sub>
          </Section>

          {/* 10 — Obligations vendeurs */}
          <Section icon={ShoppingCart} title="Obligations des vendeurs" id="obligations-vendeur">
            <ul className="list-disc pl-5 space-y-2">
              <li>Disposer d&apos;un numéro <strong>RCCM et IFU</strong> valides (personnes morales) ou d&apos;une pièce d&apos;identité (personnes physiques exerçant une activité commerciale autorisée)</li>
              <li>Fournir des descriptions <strong>exactes et non trompeuses</strong> des produits</li>
              <li>Respecter les prix affichés et ne pas les modifier après confirmation de commande</li>
              <li>Confirmer ou refuser les commandes dans le <strong>délai de 48 heures</strong></li>
              <li>Emballer correctement les produits pour le transport</li>
              <li>Garantir la conformité des produits avec la <strong>réglementation burkinabè</strong> (normes, étiquetage, dates de péremption)</li>
              <li>Ne pas vendre de produits contrefaits, volés, dangereux ou interdits</li>
              <li>Maintenir un taux de rejet inférieur à <strong>25%</strong> sous peine de suspension automatique</li>
              <li>Respecter les droits de propriété intellectuelle d&apos;autrui</li>
            </ul>
          </Section>

          {/* 11 — Obligations acheteurs */}
          <Section icon={UserCheck} title="Obligations des acheteurs" id="obligations-acheteur">
            <ul className="list-disc pl-5 space-y-2">
              <li>Fournir des <strong>informations exactes</strong> lors de l&apos;inscription et de la commande</li>
              <li>Fournir une <strong>adresse de livraison précise et accessible</strong></li>
              <li>Être présent ou représenté à l&apos;adresse de livraison au créneau convenu</li>
              <li>Vérifier les produits <strong>en présence du coursier</strong> avant de payer</li>
              <li>Payer le montant exact de la commande (COD)</li>
              <li>Ne communiquer le code de livraison qu&apos;<strong>après</strong> vérification et paiement</li>
              <li>Signaler tout problème dans un <strong>délai raisonnable</strong> (48h après livraison)</li>
              <li>Ne pas utiliser la plateforme à des fins frauduleuses (commandes fictives, abus de litiges)</li>
            </ul>
          </Section>

          {/* 12 — Obligations livreurs */}
          <Section icon={Truck} title="Obligations des livreurs et agences" id="obligations-livreur">
            <ul className="list-disc pl-5 space-y-2">
              <li>Manipuler les colis avec <strong>soin et diligence</strong></li>
              <li>Respecter les <strong>délais de livraison</strong> communiqués</li>
              <li>Permettre au client de <strong>vérifier les produits</strong> avant paiement</li>
              <li>Collecter le montant exact du paiement COD et le confirmer dans l&apos;application</li>
              <li>Saisir le code de livraison communiqué par le client — <strong>ne jamais forcer ou deviner le code</strong></li>
              <li>Ne pas ouvrir, consommer ou substituer les produits du colis</li>
              <li>Signaler immédiatement tout incident (colis endommagé, client absent, refus)</li>
              <li>Les agences doivent maintenir leurs <strong>licences de transport</strong> à jour</li>
            </ul>
          </Section>

          {/* 13 — Interdictions */}
          <Section icon={Ban} title="Produits et comportements interdits" id="interdictions">
            <Sub title="13.1 Produits interdits">
              <p>Sont formellement interdits à la vente sur Sugu :</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {[
                  "Armes et munitions",
                  "Stupéfiants et substances illicites",
                  "Médicaments sans autorisation AMM",
                  "Produits contrefaits",
                  "Produits volés ou d'origine douteuse",
                  "Animaux vivants (sauf autorisation spéciale)",
                  "Tabac et cigarettes électroniques",
                  "Contenu pornographique",
                  "Produits périmés ou dangereux",
                  "Organes humains ou produits dérivés",
                ].map((p) => (
                  <div key={p} className="flex items-center gap-2 text-sm bg-red-50 rounded-lg p-2.5 border border-red-100">
                    <Ban size={12} className="text-red-500 flex-shrink-0" />
                    <span className="text-red-800">{p}</span>
                  </div>
                ))}
              </div>
            </Sub>
            <Sub title="13.2 Comportements interdits">
              <ul className="list-disc pl-5 space-y-1">
                <li>Manipulation de prix ou enchères fictives</li>
                <li>Création de faux avis ou faux comptes</li>
                <li>Utilisation de bots ou scripts automatisés</li>
                <li>Tentative d&apos;accès non autorisé aux systèmes Sugu</li>
                <li>Harcèlement, menaces ou discrimination envers les autres utilisateurs</li>
                <li>Contournement des systèmes de sécurité (code de livraison, vérification)</li>
              </ul>
            </Sub>
          </Section>

          {/* 14 — Propriété intellectuelle */}
          <Section icon={Shield} title="Propriété intellectuelle" id="propriete">
            <p>
              La marque <strong>Sugu</strong>, le logo, le design du site et de l&apos;application,
              ainsi que l&apos;ensemble des contenus produits par Sugu (textes, visuels, code source)
              sont protégés par le droit de la propriété intellectuelle et les dispositions de
              l&apos;<strong>Accord de Bangui (OAPI)</strong> révisé en 2015.
            </p>
            <p>
              Toute reproduction, représentation, modification ou exploitation non autorisée
              est constitutive de contrefaçon et sera poursuivie.
            </p>
            <p>
              Les vendeurs garantissent qu&apos;ils disposent de tous les droits nécessaires sur les
              contenus qu&apos;ils publient (photos, descriptions). En cas de signalement de contrefaçon,
              Sugu applique une procédure de retrait conforme aux standards internationaux (notice and takedown).
            </p>
          </Section>

          {/* 15 — Limitation de responsabilité */}
          <Section icon={AlertTriangle} title="Limitation de responsabilité" id="responsabilite">
            <p>En qualité d&apos;intermédiaire technique, Sugu :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>N&apos;est pas responsable</strong> de la qualité, de la conformité ou de la disponibilité
                des produits vendus par les vendeurs tiers
              </li>
              <li>
                <strong>N&apos;est pas responsable</strong> des retards de livraison imputables aux agences ou aux conditions extérieures
              </li>
              <li>
                <strong>S&apos;engage</strong> à mettre en œuvre tous les moyens raisonnables pour assurer la disponibilité
                et la sécurité de la plateforme (obligation de moyens, non de résultat)
              </li>
              <li>
                <strong>S&apos;engage</strong> à intervenir en qualité de médiateur en cas de litige entre acheteur et vendeur
              </li>
            </ul>
            <p>
              La responsabilité de Sugu est limitée au montant des commissions perçues sur la transaction
              litigieuse, sauf en cas de faute lourde ou de dol.
            </p>
          </Section>

          {/* 16 — Résiliation */}
          <Section icon={Ban} title="Résiliation et sanctions" id="resiliation">
            <Sub title="16.1 Par l'utilisateur">
              <p>
                Tout utilisateur peut supprimer son compte à tout moment depuis ses paramètres
                ou en contactant le support. La suppression est effective sous 30 jours,
                sauf commandes ou litiges en cours.
              </p>
            </Sub>
            <Sub title="16.2 Par Sugu">
              <p>Sugu peut suspendre ou résilier un compte en cas de :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Violation des présentes CGU</li>
                <li>Taux de rejet produits supérieur à 25% (vendeurs)</li>
                <li>Abus de litiges ou commandes frauduleuses (acheteurs)</li>
                <li>Non-fourniture des justificatifs d&apos;identité demandés</li>
                <li>Inactivité prolongée (plus de 12 mois sans connexion)</li>
              </ul>
              <p>
                La suspension est précédée d&apos;un avertissement, sauf en cas de fraude avérée
                ou de danger immédiat.
              </p>
            </Sub>
          </Section>

          {/* 17 — Droit applicable */}
          <Section icon={Gavel} title="Droit applicable et juridiction" id="droit-applicable">
            <p>
              Les présentes CGU/CGV sont régies par le <strong>droit burkinabè</strong>.
              En cas de litige, les parties s&apos;engagent à rechercher une solution amiable
              dans un délai de 30 jours.
            </p>
            <p>
              À défaut de résolution amiable, le litige sera porté devant le{" "}
              <strong>Tribunal de Commerce de Ouagadougou</strong>, compétent à titre exclusif,
              conformément aux dispositions de l&apos;Acte Uniforme OHADA relatif au Droit Commercial Général.
            </p>
            <p>
              Pour les litiges transfrontaliers au sein de la CEDEAO, les dispositions du{" "}
              <strong>Traité révisé de la CEDEAO</strong> et de la Cour de Justice de la CEDEAO
              s&apos;appliquent subsidiairement.
            </p>
          </Section>

          {/* 18 — Modifications */}
          <Section icon={Clock} title="Modifications des CGU" id="modifications-cgu">
            <p>
              Sugu se réserve le droit de modifier les présentes CGU/CGV. Toute modification
              substantielle sera notifiée aux utilisateurs par email et/ou notification push
              au moins <strong>30 jours</strong> avant son entrée en vigueur.
            </p>
            <p>
              L&apos;utilisation continue de la plateforme après l&apos;entrée en vigueur des nouvelles
              conditions vaut acceptation. En cas de désaccord, l&apos;utilisateur peut résilier son
              compte dans les conditions prévues à l&apos;article 16.
            </p>
          </Section>
        </div>

        {/* ── Legal references ── */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Références légales</h3>
          <ul className="space-y-1.5 text-xs text-gray-500">
            <li>• Loi N°045-2009/AN du 10 novembre 2009 — Réglementation des services et transactions électroniques</li>
            <li>• Loi N°001-2021/AN du 30 mars 2021 — Protection des données à caractère personnel</li>
            <li>• Acte Uniforme OHADA relatif au Droit Commercial Général (AUDCG)</li>
            <li>• Accord de Bangui (OAPI) révisé — Propriété intellectuelle</li>
            <li>• Code des douanes du Burkina Faso — Importation de marchandises</li>
            <li>• Loi N°016-2017/AN — Loi sur le commerce intérieur au Burkina Faso</li>
            <li>• Acte additionnel A/SA.1/01/10 de la CEDEAO — Protection des données personnelles</li>
          </ul>
        </div>

        {/* ── Cross-links ── */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/politique-de-confidentialite"
            className="flex-1 flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all group"
          >
            <Shield size={20} className="text-gray-400 group-hover:text-[#F15412] transition-colors" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Politique de confidentialité</p>
              <p className="text-xs text-gray-500">Comment nous protégeons vos données</p>
            </div>
          </Link>
        </div>
      </div>
    </article>
  );
}
