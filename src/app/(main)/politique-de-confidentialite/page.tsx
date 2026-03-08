import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Lock, Eye, Database, UserCheck, Bell, FileText, Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "Politique de Confidentialité — Sugu",
  description:
    "Politique de confidentialité de Sugu : découvrez comment nous collectons, utilisons et protégeons vos données personnelles conformément à la Loi N°001-2021/AN du Burkina Faso.",
  alternates: { canonical: "/politique-de-confidentialite" },
  openGraph: {
    title: "Politique de Confidentialité — Sugu",
    description:
      "Découvrez comment Sugu protège vos données personnelles conformément à la législation burkinabè.",
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

/* ── Table of Contents ── */
const tocItems = [
  { id: "responsable", label: "Responsable du traitement" },
  { id: "collecte", label: "Données collectées" },
  { id: "finalites", label: "Finalités du traitement" },
  { id: "base-legale", label: "Base légale" },
  { id: "partage", label: "Partage des données" },
  { id: "securite", label: "Sécurité des données" },
  { id: "duree", label: "Durée de conservation" },
  { id: "droits", label: "Vos droits" },
  { id: "cookies", label: "Cookies et traceurs" },
  { id: "mineurs", label: "Protection des mineurs" },
  { id: "modifications", label: "Modifications" },
  { id: "contact", label: "Contact" },
];

export default function PrivacyPolicyPage() {
  return (
    <article className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm mb-6">
            <Shield size={14} />
            <span>Dernière mise à jour : 8 mars 2026</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Politique de Confidentialité
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Chez Sugu, la protection de vos données personnelles est une priorité.
            Cette politique détaille nos pratiques conformément à la{" "}
            <strong className="text-white">Loi N°001-2021/AN</strong> du Burkina Faso
            et aux standards internationaux.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 md:py-16">
        {/* ── Table of Contents ── */}
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
          {/* 1 — Responsable */}
          <Section icon={UserCheck} title="Responsable du traitement" id="responsable">
            <p>
              Le responsable du traitement des données à caractère personnel collectées
              via la plateforme <strong>sugu.pro</strong> et l&apos;application mobile Sugu est :
            </p>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-1.5">
              <p className="font-semibold text-gray-900">SUGU SARL</p>
              <p>RCCM : BF-OUA-01-2024-XXXXX</p>
              <p>IFU : 00XXXXXXX-X</p>
              <p>Siège social : 3252 Avenue Bobo Dioula, Guimbi Ouattara, Ouagadougou, Burkina Faso</p>
              <p>Email du DPO : <a href="mailto:dpo@sugu.pro" className="text-[#F15412] hover:underline">dpo@sugu.pro</a></p>
              <p>Téléphone : +226 00 00 00 00</p>
            </div>
            <p>
              Conformément à la <strong>Loi N°001-2021/AN du 30 mars 2021</strong> portant protection
              des personnes à l&apos;égard du traitement des données à caractère personnel, et sous le contrôle
              de la <strong>Commission de l&apos;Informatique et des Libertés (CIL)</strong>, autorité administrative
              indépendante du Burkina Faso, Sugu s&apos;engage à respecter l&apos;ensemble des obligations qui lui incombent.
            </p>
          </Section>

          {/* 2 — Données collectées */}
          <Section icon={Database} title="Données collectées" id="collecte">
            <p>Dans le cadre de l&apos;utilisation de nos services, nous collectons les catégories de données suivantes :</p>

            <div className="space-y-4">
              <div className="bg-orange-50/50 rounded-xl p-5 border border-orange-100">
                <h3 className="font-semibold text-gray-900 mb-2">Données d&apos;identification</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Nom complet, prénom</li>
                  <li>Adresse email</li>
                  <li>Numéro de téléphone (format E.164)</li>
                  <li>Photo de profil (optionnelle)</li>
                  <li>Type d&apos;utilisateur (acheteur, vendeur, livreur)</li>
                </ul>
              </div>

              <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                <h3 className="font-semibold text-gray-900 mb-2">Données de commandes</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Historique des commandes et numéros de suivi</li>
                  <li>Adresses de livraison</li>
                  <li>Montants des transactions (en FCFA)</li>
                  <li>Mode de paiement utilisé (Cash-on-Delivery, Mobile Money)</li>
                  <li>Codes de vérification de livraison (stockés sous forme de hash cryptographique)</li>
                </ul>
              </div>

              <div className="bg-green-50/50 rounded-xl p-5 border border-green-100">
                <h3 className="font-semibold text-gray-900 mb-2">Données techniques</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Adresse IP (masquée dans les logs après 30 jours)</li>
                  <li>Identifiant de l&apos;appareil (FCM token pour les notifications push)</li>
                  <li>User-Agent du navigateur (tronqué à 200 caractères)</li>
                  <li>Données de géolocalisation (uniquement pour les coursiers en service, avec consentement)</li>
                </ul>
              </div>

              <div className="bg-purple-50/50 rounded-xl p-5 border border-purple-100">
                <h3 className="font-semibold text-gray-900 mb-2">Données vendeurs</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Nom commercial et raison sociale</li>
                  <li>Numéro RCCM et IFU</li>
                  <li>Informations bancaires pour les versements (IBAN / numéro Mobile Money) — <strong>stockées de manière chiffrée et masquées dans l&apos;interface</strong></li>
                  <li>Score de fiabilité (calculé automatiquement, non public)</li>
                </ul>
              </div>
            </div>
          </Section>

          {/* 3 — Finalités */}
          <Section icon={Eye} title="Finalités du traitement" id="finalites">
            <p>Vos données sont traitées pour les finalités suivantes :</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 pr-4 font-semibold text-gray-900">Finalité</th>
                    <th className="text-left py-3 pr-4 font-semibold text-gray-900">Base légale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="py-2.5 pr-4">Création et gestion de votre compte</td><td className="py-2.5">Exécution du contrat</td></tr>
                  <tr><td className="py-2.5 pr-4">Traitement et suivi des commandes</td><td className="py-2.5">Exécution du contrat</td></tr>
                  <tr><td className="py-2.5 pr-4">Vérification de livraison (code à 6 chiffres)</td><td className="py-2.5">Exécution du contrat</td></tr>
                  <tr><td className="py-2.5 pr-4">Gestion des paiements et du wallet vendeur</td><td className="py-2.5">Exécution du contrat</td></tr>
                  <tr><td className="py-2.5 pr-4">Détection de fraude et scoring de fiabilité</td><td className="py-2.5">Intérêt légitime</td></tr>
                  <tr><td className="py-2.5 pr-4">Résolution des litiges et support client</td><td className="py-2.5">Intérêt légitime</td></tr>
                  <tr><td className="py-2.5 pr-4">Notifications push, email et WhatsApp</td><td className="py-2.5">Consentement</td></tr>
                  <tr><td className="py-2.5 pr-4">Amélioration des services et statistiques</td><td className="py-2.5">Intérêt légitime</td></tr>
                  <tr><td className="py-2.5 pr-4">Obligations légales et fiscales</td><td className="py-2.5">Obligation légale</td></tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* 4 — Base légale */}
          <Section icon={Scale} title="Base légale du traitement" id="base-legale">
            <p>
              Conformément aux articles 7 et suivants de la <strong>Loi N°001-2021/AN</strong>,
              tout traitement de données à caractère personnel par Sugu repose sur l&apos;une des bases légales suivantes :
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Exécution du contrat</strong> (Art. 7, al. 1) — Le traitement est nécessaire
                à l&apos;exécution du contrat de vente en ligne entre l&apos;acheteur et le vendeur, dont Sugu
                est l&apos;intermédiaire au sens de la <strong>Loi N°045-2009/AN</strong> sur les transactions électroniques.
              </li>
              <li>
                <strong>Consentement</strong> (Art. 7, al. 2) — Pour les communications marketing,
                les notifications WhatsApp et la géolocalisation des coursiers. Le consentement peut
                être retiré à tout moment.
              </li>
              <li>
                <strong>Intérêt légitime</strong> (Art. 7, al. 6) — Pour la détection de fraude,
                le scoring de fiabilité des vendeurs et la sécurité de la plateforme. Ces traitements
                sont proportionnés et ne portent pas atteinte aux droits fondamentaux des personnes.
              </li>
              <li>
                <strong>Obligation légale</strong> — Pour la conservation des données de facturation
                et de transaction, conformément au Code de Commerce burkinabè et aux obligations fiscales.
              </li>
            </ul>
          </Section>

          {/* 5 — Partage */}
          <Section icon={UserCheck} title="Partage des données" id="partage">
            <p>
              Vos données ne sont <strong>jamais vendues</strong> à des tiers. Elles peuvent être partagées
              dans les cas strictement nécessaires suivants :
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Vendeurs partenaires</strong> — Nom, adresse de livraison et numéro de commande,
                nécessaires à l&apos;exécution de votre commande. Le vendeur ne reçoit jamais votre email
                ni votre numéro de téléphone personnel, sauf si vous le communiquez directement.
              </li>
              <li>
                <strong>Agences de livraison et coursiers</strong> — Nom, adresse de livraison et
                informations de contact nécessaires à la livraison. Les numéros de téléphone sont masqués
                dans les interfaces coursier.
              </li>
              <li>
                <strong>Prestataires techniques</strong> — Firebase (notifications push), fournisseur
                d&apos;hébergement cloud (infrastructure). Ces prestataires sont contractuellement tenus
                au respect de la confidentialité.
              </li>
              <li>
                <strong>Autorités compétentes</strong> — Sur réquisition judiciaire ou demande de la CIL,
                dans le cadre des dispositions légales en vigueur au Burkina Faso.
              </li>
            </ul>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-sm">
              <p className="font-semibold text-amber-900 mb-1">🔒 Transferts internationaux</p>
              <p className="text-amber-800">
                Certaines données techniques transitent par des serveurs situés hors du Burkina Faso
                (notifications Firebase, CDN). Ces transferts sont encadrés par des clauses contractuelles
                conformes aux recommandations de la CIL et de la CEDEAO.
              </p>
            </div>
          </Section>

          {/* 6 — Sécurité */}
          <Section icon={Lock} title="Sécurité des données" id="securite">
            <p>
              Sugu met en œuvre des mesures techniques et organisationnelles avancées
              pour protéger vos données :
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Chiffrement TLS/SSL", desc: "Toutes les communications sont chiffrées en transit (HTTPS)" },
                { label: "Hachage des codes", desc: "Les codes de livraison sont stockés sous forme de hash, jamais en clair" },
                { label: "Verrouillage pessimiste", desc: "Les transactions financières utilisent des verrous en base de données" },
                { label: "Authentification par token", desc: "API sécurisée via Laravel Sanctum avec tokens à durée limitée" },
                { label: "Masquage PII", desc: "Téléphones et IBAN masqués dans les logs et les interfaces" },
                { label: "Limitation de débit", desc: "Protection contre les attaques par force brute (rate limiting)" },
                { label: "Audit trail", desc: "Toute opération sensible est journalisée avec horodatage" },
                { label: "Idempotence", desc: "Les opérations financières ont des clés d'idempotence anti-doublon" },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="font-semibold text-gray-900 text-sm mb-1">{item.label}</p>
                  <p className="text-xs text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* 7 — Durée de conservation */}
          <Section icon={FileText} title="Durée de conservation" id="duree">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 pr-4 font-semibold text-gray-900">Catégorie de données</th>
                    <th className="text-left py-3 font-semibold text-gray-900">Durée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="py-2.5 pr-4">Données de compte actif</td><td className="py-2.5">Durée de la relation commerciale</td></tr>
                  <tr><td className="py-2.5 pr-4">Données de compte supprimé</td><td className="py-2.5">Anonymisées sous 30 jours, sauf obligations légales</td></tr>
                  <tr><td className="py-2.5 pr-4">Données de commande et facturation</td><td className="py-2.5">10 ans (obligation comptable — Art. 24 AUDCG OHADA)</td></tr>
                  <tr><td className="py-2.5 pr-4">Données de paiement wallet</td><td className="py-2.5">10 ans (obligation fiscale)</td></tr>
                  <tr><td className="py-2.5 pr-4">Logs de connexion (IP, User-Agent)</td><td className="py-2.5">6 mois (IP masquée après 30 jours)</td></tr>
                  <tr><td className="py-2.5 pr-4">Codes de vérification livraison</td><td className="py-2.5">90 jours après livraison, puis supprimés</td></tr>
                  <tr><td className="py-2.5 pr-4">Données de scoring fraude</td><td className="py-2.5">90 jours glissants</td></tr>
                  <tr><td className="py-2.5 pr-4">Données de prospection marketing</td><td className="py-2.5">3 ans après le dernier contact</td></tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* 8 — Droits */}
          <Section icon={UserCheck} title="Vos droits" id="droits">
            <p>
              Conformément aux articles 15 à 22 de la <strong>Loi N°001-2021/AN</strong>,
              vous disposez des droits suivants :
            </p>
            <div className="space-y-3">
              {[
                { right: "Droit d'accès", desc: "Obtenir la confirmation que vos données sont traitées et en recevoir une copie." },
                { right: "Droit de rectification", desc: "Faire corriger vos données inexactes ou incomplètes." },
                { right: "Droit de suppression", desc: "Demander l'effacement de vos données, sous réserve des obligations légales de conservation." },
                { right: "Droit d'opposition", desc: "Vous opposer au traitement pour des motifs légitimes, notamment pour le marketing direct." },
                { right: "Droit à la portabilité", desc: "Recevoir vos données dans un format structuré et couramment utilisé." },
                { right: "Retrait du consentement", desc: "Retirer votre consentement à tout moment pour les traitements fondés sur celui-ci (notifications, WhatsApp, géolocalisation)." },
              ].map((item) => (
                <div key={item.right} className="flex gap-3 items-start bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="h-2 w-2 rounded-full bg-[#F15412] mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.right}</p>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mt-4 space-y-2">
              <p className="font-semibold text-gray-900 text-sm">Comment exercer vos droits ?</p>
              <p className="text-sm">
                Envoyez votre demande à <a href="mailto:dpo@sugu.pro" className="text-[#F15412] hover:underline font-medium">dpo@sugu.pro</a>{" "}
                en joignant une copie d&apos;une pièce d&apos;identité. Nous répondrons sous <strong>30 jours</strong> maximum.
              </p>
              <p className="text-sm">
                En cas de litige, vous pouvez saisir la <strong>Commission de l&apos;Informatique et des Libertés (CIL)</strong> :
              </p>
              <p className="text-sm text-gray-600">
                CIL — 01 BP 6245 Ouagadougou 01 — <a href="https://www.cil.bf" target="_blank" rel="noopener noreferrer" className="text-[#F15412] hover:underline">www.cil.bf</a>
              </p>
            </div>
          </Section>

          {/* 9 — Cookies */}
          <Section icon={Eye} title="Cookies et traceurs" id="cookies">
            <p>
              Sugu utilise des cookies strictement nécessaires au fonctionnement du site.
              Les cookies analytiques et marketing ne sont déposés qu&apos;avec votre consentement explicite.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 pr-4 font-semibold text-gray-900">Type</th>
                    <th className="text-left py-3 pr-4 font-semibold text-gray-900">Finalité</th>
                    <th className="text-left py-3 font-semibold text-gray-900">Durée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="py-2.5 pr-4">Essentiels</td><td className="py-2.5 pr-4">Session, panier, authentification</td><td className="py-2.5">Session / 30 jours</td></tr>
                  <tr><td className="py-2.5 pr-4">Analytiques</td><td className="py-2.5 pr-4">Mesure d&apos;audience anonymisée</td><td className="py-2.5">13 mois max</td></tr>
                  <tr><td className="py-2.5 pr-4">Marketing</td><td className="py-2.5 pr-4">Personnalisation des recommandations</td><td className="py-2.5">6 mois max</td></tr>
                </tbody>
              </table>
            </div>
            <p>
              Vous pouvez gérer vos préférences cookies à tout moment depuis les paramètres de votre navigateur
              ou via notre bandeau de consentement.
            </p>
          </Section>

          {/* 10 — Mineurs */}
          <Section icon={Shield} title="Protection des mineurs" id="mineurs">
            <p>
              Les services de Sugu sont destinés aux personnes âgées de <strong>18 ans et plus</strong>,
              ou de 16 ans avec le consentement d&apos;un représentant légal, conformément à l&apos;article 10
              de la Loi N°001-2021/AN. Nous ne collectons pas sciemment de données de mineurs de moins
              de 16 ans.
            </p>
          </Section>

          {/* 11 — Modifications */}
          <Section icon={Bell} title="Modifications de cette politique" id="modifications">
            <p>
              Nous pouvons mettre à jour cette politique pour refléter les évolutions de nos pratiques
              ou de la réglementation. Toute modification substantielle sera notifiée par email et/ou
              notification push au moins <strong>15 jours</strong> avant son entrée en vigueur.
            </p>
            <p>
              La date de dernière mise à jour figure en haut de cette page.
            </p>
          </Section>

          {/* 12 — Contact */}
          <Section icon={UserCheck} title="Contact" id="contact">
            <p>Pour toute question relative à vos données personnelles :</p>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-1.5 text-sm">
              <p><strong>Délégué à la Protection des Données (DPO)</strong></p>
              <p>Email : <a href="mailto:dpo@sugu.pro" className="text-[#F15412] hover:underline">dpo@sugu.pro</a></p>
              <p>Adresse : SUGU SARL — 3252 Avenue Bobo Dioula, Ouagadougou, Burkina Faso</p>
              <p>Téléphone : +226 00 00 00 00</p>
            </div>
          </Section>
        </div>

        {/* ── Legal references ── */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Références légales</h3>
          <ul className="space-y-1.5 text-xs text-gray-500">
            <li>• Loi N°001-2021/AN du 30 mars 2021 — Protection des personnes à l&apos;égard du traitement des données à caractère personnel</li>
            <li>• Loi N°045-2009/AN du 10 novembre 2009 — Réglementation des services et transactions électroniques</li>
            <li>• Acte Uniforme OHADA relatif au Droit Commercial Général (AUDCG) — Obligations comptables</li>
            <li>• Acte additionnel A/SA.1/01/10 de la CEDEAO — Protection des données à caractère personnel</li>
            <li>• Convention de l&apos;Union Africaine sur la cybersécurité et la protection des données à caractère personnel (Convention de Malabo, 2014)</li>
          </ul>
        </div>
      </div>
    </article>
  );
}
