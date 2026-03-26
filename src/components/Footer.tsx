"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Phone,
  Mail,
  MapPin,
  ArrowUp,
  ChevronDown,
} from "lucide-react";

const footerColumns = [
  {
    title: "À Propos",
    links: [
      { label: "Tous nos magasins", href: "/stores" },
      { label: "Nos fournisseurs", href: "/fournisseurs" },
      { label: "Espace vendeur", href: "https://pro.sugu.pro/" },
      { label: "Contactez-nous", href: "/help" },
    ],
  },
  {
    title: "Service Client",
    links: [
      { label: "Centre d'aide", href: "/help" },
      { label: "Chat Support", href: "/support-chat" },
      { label: "Contactez-nous", href: "/help" },
      { label: "Signaler un abus", href: "/help" },
      { label: "Soumettre un litige", href: "/help" },
      { label: "Livraison & Retours", href: "/politique-livraison-retours" },
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
      { label: "Liste de souhaits", href: "/account/wishlist" },
    ],
  },
  {
    title: "Informations",
    links: [
      { label: "Conditions générales", href: "/conditions-generales" },
      { label: "Politique de confidentialité", href: "/politique-de-confidentialite" },
      { label: "Livraison & Retours", href: "/politique-livraison-retours" },
      { label: "Politique anti-fraude", href: "/politique-anti-fraude" },
      { label: "Devenir vendeur", href: "https://pro.sugu.pro/" },
    ],
  },
];

const socialLinks = [
  { name: "Facebook", icon: "f", href: "https://facebook.com/sugu" },
  { name: "Twitter", icon: "𝕏", href: "https://twitter.com/sugu" },
  { name: "Google", icon: "G", href: "https://google.com/search?q=sugu" },
  { name: "LinkedIn", icon: "in", href: "https://linkedin.com/company/sugu" },
];

const paymentMethods = [
  { name: "Wave", src: "/payments/wave.png" },
  { name: "Orange Money", src: "/payments/orange.png" },
  { name: "Moov Money", src: "/payments/moov.png" },
  { name: "Telecel Money", src: "/payments/telecel.png" },
];

/* ── Collapsible Link Column (mobile accordion) ── */

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 md:border-b-0">
      {/* Header — clickable on mobile, static on md+ */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-3 md:py-0 md:mb-4 md:cursor-default"
        aria-expanded={open}
      >
        <h4 className="text-sm font-bold text-gray-900">{title}</h4>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-300 md:hidden ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Links — toggle on mobile, always visible on md+ */}
      <ul
        className={`space-y-2.5 overflow-hidden transition-all duration-300 md:!max-h-none md:!opacity-100 md:!pb-0 ${
          open ? "max-h-[500px] opacity-100 pb-4" : "max-h-0 opacity-0"
        }`}
      >
        {links.map((link) => (
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
  );
}

/* ── Footer Component ── */

export default function Footer() {
  const [loaded, setLoaded] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
    setScrollProgress(progress);
    setShowScrollTop(scrollTop > 300);
  }, []);

  useEffect(() => {
    setLoaded(true);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

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
      <div className="mx-auto max-w-[1400px] px-4 pt-10 pb-6 sm:pt-12 sm:pb-8 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-0 md:gap-8 lg:gap-6">
          {/* Brand Column */}
          <div className="lg:col-span-2 mb-6 md:mb-0">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-extrabold text-gray-900 tracking-tight">
                Sugu
              </span>
            </div>

            <p className="text-sm text-gray-500 leading-relaxed mb-5 max-w-[280px]">
              Sugu est la plus grande plateforme de vente en ligne au Burkina Faso
            </p>

            {/* Contact info */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <Phone size={14} className="text-[#F15412] flex-shrink-0" />
                <span className="text-sm text-gray-600">+226 64 52 89 58</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={14} className="text-[#F15412] flex-shrink-0" />
                <span className="text-sm text-gray-600">contact@sugu.pro</span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin size={14} className="text-[#F15412] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600 leading-relaxed">
                  3252 Bobo Dioula Avenue, Guimbi Ouattara koko, Burkina Faso
                </span>
              </div>
            </div>

            {/* Social Icons — below contact on mobile, separate row on md+ */}
            <div className="flex items-center gap-2.5 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F15412] text-white text-xs font-bold transition-all duration-200 hover:bg-[#d94a0f] hover:scale-110 active:scale-95"
                  title={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns — accordion on mobile, grid on md+ */}
          <div className="md:contents">
            {/* Divider above links on mobile */}
            <div className="border-t border-gray-100 md:hidden" />

            {footerColumns.map((col) => (
              <FooterColumn key={col.title} title={col.title} links={col.links} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="border-t border-gray-200">
        <div className="mx-auto max-w-[1400px] px-4 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left — copyright */}
          <p className="text-xs text-gray-400 text-center sm:text-left">
            Sugu © 2026. Tous droits réservés
          </p>

          {/* Center — (Logo removed) */}
          {/* <div className="hidden sm:flex relative flex-shrink-0">
            <span className="text-sm font-extrabold text-gray-900 tracking-tight">
              Sugu
            </span>
          </div> */}

          {/* Right — payment methods */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-xs text-gray-400">Nous acceptons</span>
            <div className="flex items-center gap-2">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.name}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:scale-110 hover:border-[#F15412]/30"
                  title={pm.name}
                >
                  <Image
                    src={pm.src}
                    alt={pm.name}
                    fill
                    className="object-contain p-1.5"
                    sizes="40px"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Fixed Floating Scroll-to-Top Button ── */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-4 sm:right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 ${
          showScrollTop
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-label="Retour en haut"
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
