"use client";

import { useState, useEffect } from "react";
import {
  Phone,
  Mail,
  MapPin,
  ArrowUp,
} from "lucide-react";

const footerColumns = [
  {
    title: "À Propos",
    links: [
      { label: "Profil de l'entreprise", href: "#" },
      { label: "Tous nos magasins", href: "#" },
      { label: "Espace vendeur", href: "#" },
      { label: "Programme d'affiliation", href: "#" },
      { label: "Contactez-nous", href: "#" },
      { label: "Commentaires", href: "#" },
      { label: "Règles et politique", href: "#" },
    ],
  },
  {
    title: "Service Client",
    links: [
      { label: "Centre d'aide", href: "/help" },
      { label: "Chat Support", href: "/support-chat" },
      { label: "Contactez-nous", href: "#" },
      { label: "Carte cadeau", href: "#" },
      { label: "Signaler un abus", href: "#" },
      { label: "Soumettre un litige", href: "#" },
      { label: "Politiques et règles", href: "#" },
      { label: "Utiliser un bon", href: "#" },
    ],
  },
  {
    title: "Mon Compte",
    links: [
      { label: "Mon compte", href: "/account" },
      { label: "Mes commandes", href: "/account/orders" },
      { label: "Panier", href: "/cart" },
      { label: "Mes adresses", href: "/account/addresses" },
      { label: "Mes paiements", href: "/account/payments" },
      { label: "Mes coupons", href: "/account/coupons" },
      { label: "Liste de souhaits", href: "#" },
    ],
  },
  {
    title: "Informations",
    links: [
      { label: "Devenir vendeur", href: "#" },
      { label: "Programme d'affiliation", href: "#" },
      { label: "Politique de confidentialité", href: "#" },
      { label: "Nos fournisseurs", href: "#" },
      { label: "Garantie étendue", href: "#" },
      { label: "Communauté", href: "#" },
      { label: "Forum", href: "#" },
    ],
  },
];

const socialLinks = [
  { name: "Facebook", icon: "f" },
  { name: "Twitter", icon: "𝕏" },
  { name: "Google", icon: "G" },
  { name: "LinkedIn", icon: "in" },
];

const paymentMethods = ["AM", "VISA", "MC", "CB", "PP"];

export default function Footer() {
  const [loaded, setLoaded] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    setLoaded(true);

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
      setScrollProgress(progress);
      setShowScrollTop(scrollTop > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      className={`bg-white transition-all duration-700 ${
        loaded ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* ── Main Footer ── */}
      <div className="mx-auto max-w-[1400px] px-4 pt-12 pb-8 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-6">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-[#F15412] flex items-center justify-center">
                <span className="text-white text-xs font-black">S</span>
              </div>
              <span className="text-lg font-extrabold text-gray-900 tracking-tight">
                MARKETPRO
              </span>
            </div>

            <p className="text-sm text-gray-500 leading-relaxed mb-5 max-w-[260px]">
              Sugu est la plus grande plateforme de vente en ligne
            </p>

            {/* Contact info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <Phone size={14} className="text-[#F15412] flex-shrink-0" />
                <span className="text-sm text-gray-600">+226000000</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={14} className="text-[#F15412] flex-shrink-0" />
                <span className="text-sm text-gray-600">contact@sugu.pro</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin size={14} className="text-[#F15412] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600 leading-relaxed">
                  3252 Bobo Dioula Avenue<br />
                  Guimbi Ouattara koko,<br />
                  Burkina Faso
                </span>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-bold text-gray-900 mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-[#F15412] transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social Icons */}
        <div className="flex items-center gap-3 mt-10">
          {socialLinks.map((social) => (
            <a
              key={social.name}
              href="#"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F15412] text-white text-xs font-bold transition-all duration-200 hover:bg-[#d94a0f] hover:scale-110 active:scale-95"
              title={social.name}
            >
              {social.icon}
            </a>
          ))}
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="border-t border-gray-200">
        <div className="mx-auto max-w-[1400px] px-4 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left */}
          <p className="text-xs text-gray-400">
            sugu © 2026. Tous droits réservés
          </p>

          {/* Center – mini logo */}
          <div className="h-6 w-6 rounded-md bg-gray-100 flex items-center justify-center">
            <span className="text-[10px] font-black text-gray-400">S</span>
          </div>

          {/* Right – payment + scroll to top */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 mr-1">Nous acceptons</span>
              {paymentMethods.map((pm) => (
                <div
                  key={pm}
                  className="flex h-6 w-9 items-center justify-center rounded bg-gray-100 text-[9px] font-bold text-gray-500"
                >
                  {pm}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Fixed Floating Scroll-to-Top Button ── */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 ${
          showScrollTop
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* SVG Progress Ring */}
        <svg
          className="absolute inset-0 -rotate-90"
          width="44"
          height="44"
          viewBox="0 0 44 44"
        >
          {/* Background circle */}
          <circle
            cx="22"
            cy="22"
            r="20"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="2"
          />
          {/* Progress arc */}
          <circle
            cx="22"
            cy="22"
            r="20"
            fill="none"
            stroke="#F15412"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 20}`}
            strokeDashoffset={`${2 * Math.PI * 20 * (1 - scrollProgress)}`}
            className="transition-all duration-150"
          />
        </svg>
        <ArrowUp size={16} className="text-[#F15412] relative z-10" />
      </button>
    </footer>
  );
}
