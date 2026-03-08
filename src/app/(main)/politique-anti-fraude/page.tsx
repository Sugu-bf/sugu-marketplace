import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, Eye, Lock, UserX, BarChart3, Bell, Scale, Shield, Fingerprint, Ban, AlertTriangle, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Politique Anti-Fraude — Sugu",
  description:
    "Mesures de protection contre la fraude et les abus sur la marketplace Sugu. Scoring de fiabilité, vérification de livraison, protection des paiements et sanctions.",
  alternates: { canonical: "/politique-anti-fraude" },
  openGraph: {
    title: "Politique Anti-Fraude — Sugu",
    description:
      "Découvrez les systèmes de protection de Sugu contre la fraude : scoring automatique, vérification en 3 étapes et sécurité financière.",
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
  { id: "engagement", label: "Notre engagement" },
  { id: "types-fraude", label: "Types de fraude détectés" },
  { id: "scoring", label: "Système de scoring de fiabilité" },
  { id: "verification", label: "Vérification de livraison" },
  { id: "securite-paiements", label: "Sécurité des paiements" },
  { id: "securite-comptes", label: "Sécurité des comptes" },
  { id: "sanctions", label: "Sanctions" },
  { id: "signalement", label: "Signaler un abus" },
  { id: "protection-donnees", label: "Protection des données" },
  { id: "contact-fraude", label: "Contact" },
];

export default function AntiFraudPolicyPage() {
  return (
    <article className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm mb-6">
            <ShieldAlert size={14} />
            <span>Dernière mise à jour : 8 mars 2026</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Politique Anti-Fraude
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Sugu met en œuvre des mesures avancées pour protéger acheteurs, vendeurs
            et livreurs contre la fraude et les comportements abusifs.
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

          {/* 1 — Engagement */}
          <Section icon={Shield} title="Notre engagement" id="engagement">
            <p>
              Chez Sugu, la confiance est le fondement de notre marketplace. Nous investissons
              continuellement dans des systèmes de détection et de prévention de la fraude
              pour garantir une expérience sûre à toutes les parties prenantes.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Eye, label: "Surveillance en temps réel", desc: "Monitoring continu des transactions" },
                { icon: BarChart3, label: "Scoring automatique", desc: "Analyse quotidienne du comportement" },
                { icon: Lock, label: "Transactions sécurisées", desc: "Verrouillage atomique + audit trail" },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                  <item.icon size={24} className="text-[#F15412] mx-auto mb-2" />
                  <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* 2 — Types de fraude */}
          <Section icon={AlertTriangle} title="Types de fraude détectés" id="types-fraude">
            <p>Notre système est conçu pour détecter les catégories d&apos;abus suivantes :</p>

            <div className="space-y-3 mt-2">
              <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                <h4 className="font-semibold text-red-900 mb-1 text-sm">🏪 Fraude vendeur</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-red-800">
                  <li>Envoi de produits non conformes ou contrefaits</li>
                  <li>Manipulation des prix après commande</li>
                  <li>Annulations massives et répétées</li>
                  <li>Fausses fiches produits (photos trompeuses, description inexacte)</li>
                  <li>Tentative de crédit frauduleux sur le wallet</li>
                </ul>
              </div>

              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <h4 className="font-semibold text-orange-900 mb-1 text-sm">🛒 Fraude acheteur</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-orange-800">
                  <li>Commandes fictives (commande sans intention d&apos;achat)</li>
                  <li>Refus abusif de produits conformes</li>
                  <li>Abus de litiges pour obtenir des remboursements indus</li>
                  <li>Utilisation de faux comptes ou d&apos;identités volées</li>
                  <li>Absence répétée lors des livraisons</li>
                </ul>
              </div>

              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <h4 className="font-semibold text-purple-900 mb-1 text-sm">🚚 Fraude livreur</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-purple-800">
                  <li>Détournement de colis ou substitution de produits</li>
                  <li>Fausse confirmation de livraison (tentative de devinette du code)</li>
                  <li>Non-remise du paiement COD encaissé</li>
                  <li>Dégradation volontaire de colis</li>
                </ul>
              </div>
            </div>
          </Section>

          {/* 3 — Scoring */}
          <Section icon={BarChart3} title="Système de scoring de fiabilité" id="scoring">
            <p>
              Sugu opère un <strong>système de scoring automatique</strong> qui évalue la fiabilité
              de chaque acteur. Ce score est calculé quotidiennement sur la base des 90 derniers jours
              d&apos;activité.
            </p>

            <Sub title="3.1 Scoring vendeur">
              <p>Le score vendeur est basé sur :</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 pr-4 font-semibold text-gray-900">Métrique</th>
                      <th className="text-left py-3 font-semibold text-gray-900">Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr><td className="py-2.5 pr-4">Taux de confirmation des commandes</td><td className="py-2.5">Élevé</td></tr>
                    <tr><td className="py-2.5 pr-4">Taux de rejet produits par les clients</td><td className="py-2.5">Très élevé</td></tr>
                    <tr><td className="py-2.5 pr-4">Nombre de litiges ouverts</td><td className="py-2.5">Élevé</td></tr>
                    <tr><td className="py-2.5 pr-4">Temps moyen de confirmation</td><td className="py-2.5">Modéré</td></tr>
                    <tr><td className="py-2.5 pr-4">Nombre d&apos;annulations par timeout</td><td className="py-2.5">Élevé</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-3 bg-green-50 rounded-xl p-3 border border-green-100">
                  <span className="h-3 w-3 rounded-full bg-green-500 flex-shrink-0" />
                  <div className="text-sm">
                    <strong className="text-green-900">Normal</strong>
                    <span className="text-green-700"> — Taux de rejet &lt; 10% — Aucune action</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <span className="h-3 w-3 rounded-full bg-amber-500 flex-shrink-0" />
                  <div className="text-sm">
                    <strong className="text-amber-900">Avertissement</strong>
                    <span className="text-amber-700"> — Taux de rejet entre 10% et 25% — Notification d&apos;alerte envoyée</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-red-50 rounded-xl p-3 border border-red-100">
                  <span className="h-3 w-3 rounded-full bg-red-500 flex-shrink-0" />
                  <div className="text-sm">
                    <strong className="text-red-900">Suspension</strong>
                    <span className="text-red-700"> — Taux de rejet &gt; 25% (+ de 5 commandes) — Boutique suspendue automatiquement</span>
                  </div>
                </div>
              </div>
            </Sub>

            <Sub title="3.2 Scoring acheteur">
              <p>Le score acheteur prend en compte :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Nombre d&apos;annulations initiées par le client</li>
                <li>Nombre de litiges ouverts vs. commandes totales</li>
                <li>Nombre de livraisons échouées (absence, refus sans motif valide)</li>
                <li>Évaluations reçues des vendeurs et coursiers</li>
              </ul>
            </Sub>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-sm">
              <p className="font-semibold text-blue-900 mb-1">ℹ️ Transparence</p>
              <p className="text-blue-800">
                Le score de fiabilité n&apos;est <strong>pas public</strong>. Il est utilisé en interne
                pour déclencher des alertes et des actions automatiques. Si votre compte est impacté,
                vous serez notifié avec une explication des raisons.
              </p>
            </div>
          </Section>

          {/* 4 — Vérification livraison */}
          <Section icon={Fingerprint} title="Vérification de livraison" id="verification">
            <p>
              Le processus de vérification en <strong>3 étapes</strong> est notre principale défense
              contre la fraude à la livraison :
            </p>
            <div className="space-y-3">
              {[
                {
                  step: "1",
                  title: "Vérification des produits",
                  desc: "L'acheteur inspecte les articles en présence du coursier. Il peut refuser si les produits sont non conformes.",
                  protection: "Empêche les vendeurs d'envoyer des produits de mauvaise qualité."
                },
                {
                  step: "2",
                  title: "Confirmation de paiement COD",
                  desc: "Le coursier confirme le montant exact reçu dans l'application. Le montant doit correspondre au total de la commande.",
                  protection: "Empêche le détournement de fonds par le coursier."
                },
                {
                  step: "3",
                  title: "Code de livraison à 6 chiffres",
                  desc: "L'acheteur reçoit un code par notification push et le communique au coursier qui le saisit.",
                  protection: "Empêche les fausses confirmations de livraison et prouve la remise effective."
                },
              ].map((item) => (
                <div key={item.step} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F15412] text-white text-xs font-bold">
                      {item.step}
                    </span>
                    <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{item.desc}</p>
                  <p className="text-xs text-green-700 font-medium">🛡️ {item.protection}</p>
                </div>
              ))}
            </div>

            <p>
              Le code de livraison est limité à <strong>3 tentatives</strong>. Après 3 échecs,
              le système se verrouille et un administrateur Sugu doit intervenir manuellement.
              Cette mesure prévient les tentatives de devinette du code par des coursiers malveillants.
            </p>
          </Section>

          {/* 5 — Sécurité paiements */}
          <Section icon={Lock} title="Sécurité des paiements" id="securite-paiements">
            <p>
              Les transactions financières sur Sugu bénéficient de protections à plusieurs niveaux :
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Transactions atomiques", desc: "Chaque opération financière est protégée par un verrou de base de données — impossible de corrompre un solde" },
                { label: "Idempotence", desc: "Chaque opération porte une clé unique. Un double-appui sur « Payer » ne crée pas un double paiement" },
                { label: "Plafonds de sécurité", desc: "Les montants sont plafonnés : max 5M FCFA/retrait, max 10M FCFA/jour" },
                { label: "Audit trail complet", desc: "Chaque mouvement de fonds est enregistré dans un journal immuable avec horodatage" },
                { label: "Séparation des rôles", desc: "Seuls les administrateurs peuvent créditer un wallet. Les vendeurs ne peuvent que retirer" },
                { label: "Vérification d'intégrité", desc: "Le solde affiché est régulièrement vérifié par rapport à la somme des transactions" },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="font-semibold text-gray-900 text-sm mb-1">{item.label}</p>
                  <p className="text-xs text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* 6 — Sécurité comptes */}
          <Section icon={Fingerprint} title="Sécurité des comptes" id="securite-comptes">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Authentification par token</strong> — chaque session est protégée
                par un token sécurisé à durée de vie limitée (Laravel Sanctum)
              </li>
              <li>
                <strong>Rate limiting</strong> — protection contre les attaques par force brute
                (nombre de tentatives de connexion limité)
              </li>
              <li>
                <strong>OTP (One-Time Password)</strong> — vérification par code SMS ou email
                pour les opérations sensibles
              </li>
              <li>
                <strong>Step-up authentication</strong> — les opérations financières critiques
                (transfert entre wallets, paiement des vendeurs) nécessitent une ré-authentification
              </li>
              <li>
                <strong>Masquage PII</strong> — les numéros de téléphone, IBAN et informations
                bancaires sont masqués dans les interfaces et les logs
              </li>
              <li>
                <strong>Chiffrement TLS</strong> — toutes les communications entre votre appareil
                et nos serveurs sont chiffrées (HTTPS)
              </li>
            </ul>
          </Section>

          {/* 7 — Sanctions */}
          <Section icon={Ban} title="Sanctions" id="sanctions">
            <p>
              En cas de fraude avérée ou de comportement abusif, Sugu applique des sanctions
              graduelles :
            </p>
            <div className="space-y-2 mt-2">
              {[
                { level: "Niveau 1", action: "Avertissement", desc: "Notification d'alerte avec rappel des règles", color: "bg-amber-50 border-amber-200 text-amber-900" },
                { level: "Niveau 2", action: "Restriction", desc: "Limitation temporaire de certaines fonctionnalités (retrait wallet, publication produits)", color: "bg-orange-50 border-orange-200 text-orange-900" },
                { level: "Niveau 3", action: "Suspension", desc: "Suspension du compte pour une durée déterminée. Le wallet est gelé pendant l'investigation", color: "bg-red-50 border-red-200 text-red-900" },
                { level: "Niveau 4", action: "Bannissement", desc: "Fermeture définitive du compte. Signalement aux autorités si nécessaire", color: "bg-red-100 border-red-300 text-red-900" },
              ].map((item) => (
                <div key={item.level} className={`rounded-xl p-4 border ${item.color}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold">{item.level}</span>
                    <span className="font-semibold text-sm">— {item.action}</span>
                  </div>
                  <p className="text-sm opacity-80">{item.desc}</p>
                </div>
              ))}
            </div>

            <p className="mt-4">
              Les sanctions automatiques (suspension pour taux de rejet &gt; 25%) sont précédées
              d&apos;un avertissement sauf en cas de <strong>fraude caractérisée</strong> (contrefaçon,
              vol, usurpation d&apos;identité) où la suspension est immédiate.
            </p>

            <p>
              En cas de contestation d&apos;une sanction, vous pouvez faire appel auprès du support
              Sugu. L&apos;appel est examiné sous <strong>5 jours ouvrés</strong>.
            </p>
          </Section>

          {/* 8 — Signalement */}
          <Section icon={Bell} title="Signaler un abus" id="signalement">
            <p>
              Si vous êtes témoin ou victime d&apos;une fraude ou d&apos;un comportement abusif
              sur Sugu, vous pouvez le signaler de plusieurs manières :
            </p>
            <div className="space-y-3">
              {[
                { method: "Depuis l'application", desc: "Menu « Signaler un abus » disponible sur chaque fiche produit, profil vendeur et commande" },
                { method: "Par email", desc: "Envoyez les détails et preuves à fraude@sugu.pro" },
                { method: "Via le chat support", desc: "Accessible depuis votre espace client" },
                { method: "Par téléphone", desc: "+226 00 00 00 00 — Ligne fraude dédiée" },
              ].map((item) => (
                <div key={item.method} className="flex gap-3 items-start bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="h-2 w-2 rounded-full bg-[#F15412] mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.method}</p>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p>
              Tous les signalements sont traités de manière <strong>confidentielle</strong>.
              L&apos;identité du signalant n&apos;est jamais communiquée à la personne signalée.
              Nous nous engageons à examiner chaque signalement sous <strong>48 heures</strong>.
            </p>
          </Section>

          {/* 9 — Protection données */}
          <Section icon={Eye} title="Protection des données" id="protection-donnees">
            <p>
              Les données collectées dans le cadre de la détection de fraude sont traitées conformément
              à notre{" "}
              <Link href="/politique-de-confidentialite" className="text-[#F15412] hover:underline font-medium">
                Politique de Confidentialité
              </Link>{" "}
              et à la <strong>Loi N°001-2021/AN</strong> du Burkina Faso.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Les données de scoring sont conservées <strong>90 jours</strong> (glissants)</li>
              <li>Les scores ne sont <strong>jamais partagés</strong> avec des tiers</li>
              <li>Aucune décision automatique n&apos;a de conséquence irréversible sans possibilité d&apos;appel humain</li>
              <li>Les logs de sécurité (IP, tentatives de connexion) sont conservés <strong>6 mois</strong></li>
            </ul>
          </Section>

          {/* 10 — Contact */}
          <Section icon={Phone} title="Contact anti-fraude" id="contact-fraude">
            <p>Pour signaler une fraude ou poser une question sur nos mesures de sécurité :</p>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-1.5 text-sm">
              <p><strong>Équipe Anti-Fraude Sugu</strong></p>
              <p>Email : <a href="mailto:fraude@sugu.pro" className="text-[#F15412] hover:underline">fraude@sugu.pro</a></p>
              <p>Email DPO : <a href="mailto:dpo@sugu.pro" className="text-[#F15412] hover:underline">dpo@sugu.pro</a></p>
              <p>Téléphone : +226 00 00 00 00</p>
            </div>
          </Section>
        </div>

        {/* ── Cross-links ── */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
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
            <Link
              href="/politique-livraison-retours"
              className="flex-1 flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all group"
            >
              <AlertTriangle size={20} className="text-gray-400 group-hover:text-[#F15412] transition-colors" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Livraison &amp; Retours</p>
                <p className="text-xs text-gray-500">Conditions de livraison et retours</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
