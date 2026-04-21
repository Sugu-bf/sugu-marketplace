"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Script from "next/script";
import { Bell, ArrowLeft, User, Store, Shirt, Hash, MapPin, Locate, MessageCircle, Mail, Globe, Briefcase, BadgeCheck, ShieldCheck, Smartphone, CheckCircle2 } from "lucide-react";
import s from "./ComingSoon.module.css";
import { API_BASE_URL } from "@/lib/api/config";


const PROGRESS_GOAL = 50000;
const COUNTER_TARGET = 10247;
const COUNTER_DURATION = 2500;
const PROGRESS_DURATION = 2200;

/**
 * Coming Soon — Pre-launch landing page.
 *
 * Rendered instead of the real home page when COMING_SOON_ENABLED=true.
 * Uses CSS Modules for 100% style isolation from the main marketplace.
 *
 * On launch day: remove COMING_SOON_ENABLED from .env → redeploy → done.
 */
export default function ComingSoon() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneCode: "+226",
    phone: "",
    missing: "",
    expectations: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [progress, setProgress] = useState(5);

  // Seller Modal State
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [isSellerSubmitted, setIsSellerSubmitted] = useState(false);
  const [isSellerLoading, setIsSellerLoading] = useState(false);
  const [sellerError, setSellerError] = useState<string | null>(null);
  const [sellerData, setSellerData] = useState({
    fullName: "",
    storeName: "",
    companyProfile: "",
    salesChannel: "",
    productCount: "",
    country: "",
    city: "",
    neighborhood: "",
    phone: "",
    email: "",
    description: "",
    hasPhotos: false,
    hasRCCM: false,
    useLocation: false,
  });

  const COUNTRY_CODES: Record<string, string> = {
    BF: "+226", CI: "+225", SN: "+221", ML: "+223", TG: "+228", BJ: "+229", NE: "+227", GW: "+245"
  };

  const handleSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSellerLoading(true);
    setSellerError(null);

    try {
      const res = await fetch("/api/prelaunch/seller-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sellerData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Une erreur est survenue.");
      }

      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "CompleteRegistration");
      }
      setIsSellerSubmitted(true);
    } catch (err: any) {
      setSellerError(err.message);
    } finally {
      setIsSellerLoading(false);
    }
  };

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      setSellerData(prev => ({...prev, useLocation: true, city: "Recherche en cours..."}));
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await res.json();
          const detectedCountry = data.address?.country_code?.toUpperCase();

          setSellerData(prev => ({
            ...prev,
            ...(detectedCountry && COUNTRY_CODES[detectedCountry] ? { country: detectedCountry } : {}),
            city: data.address?.city || data.address?.town || data.address?.state || "Inconnue",
            neighborhood: data.address?.suburb || data.address?.neighbourhood || ""
          }));
        } catch(e) {
          setSellerData(prev => ({...prev, city: "Erreur GPS", neighborhood: ""}));
        }
      }, () => {
         setSellerData(prev => ({...prev, city: "GPS Refusé", useLocation: false}));
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      const res = await fetch("/api/prelaunch/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone_code: formData.phoneCode,
          phone: formData.phone,
          missing: formData.missing,
          expectations: formData.expectations,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Une erreur est survenue.");
      }

      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "Lead");
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; size: number }[]
  >([]);
  const [leadCount, setLeadCount] = useState(0);
  const [sellerCount, setSellerCount] = useState(0);
  const [dynamicStats, setDynamicStats] = useState({ 
    leads: 10247, 
    sellers: 2400,
    countries: 2
  });
  const particleId = useRef(0);

  // ── Fetch Stats & Animate Progress ────────────────────────
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/prelaunch/stats");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setDynamicStats(data.data);
            
            // Goal from API or fallback
            const goal = data.data.goal || 50000;
            
            // Calculate dynamic progress target (capped at 99% until launch)
            const realPct = Math.min(Math.floor((data.data.leads / goal) * 100), 99);
            const finalPct = Math.max(realPct, 5); // Maintain a subtle 5% baseline for credibility
            
            animateProgress(finalPct);
          }
        }
      } catch (e) {
        console.error("Failed to fetch prelaunch stats");
        animateProgress(20); // Fallback baseline
      }
    };

    const animateProgress = (target: number) => {
      const start = Date.now();
      const frame = () => {
        const t = Math.min((Date.now() - start) / PROGRESS_DURATION, 1);
        const ease = (val: number) => 1 - Math.pow(1 - val, 3);
        setProgress(ease(t) * target);
        if (t < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    };

    fetchStats();
  }, []);

  // ── Animated counters ───────────────────────────────────
  useEffect(() => {
    const start = Date.now();
    const frame = () => {
      const t = Math.min((Date.now() - start) / COUNTER_DURATION, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setLeadCount(Math.round(ease * dynamicStats.leads));
      setSellerCount(Math.round(ease * dynamicStats.sellers));
      if (t < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [dynamicStats]);

  // ── Particle emitter ───────────────────────────────────
  useEffect(() => {
    if (progress < 15) return; // Wait for some progress before emitting particles
    const interval = setInterval(() => {
      const id = particleId.current++;
      setParticles((prev) => [
        ...prev.slice(-20),
        {
          id,
          x: (Math.random() - 0.5) * 40,
          y: -(8 + Math.random() * 32),
          size: 2 + Math.random() * 3,
        },
      ]);
    }, 110);
    return () => clearInterval(interval);
  }, [progress]);

  const milestones = [
    { pct: 25, label: "Partenaires" },
    { pct: 50, label: "Beta" },
    { pct: 75, label: "Lancement" },
    { pct: 100, label: "Go Live" },
  ];

  const shareText = "Je viens de rejoindre la liste d'attente VIP de Sugu, la prochaine grande marketplace en Afrique ! rejoignez l'aventure ici : https://mysugu.com";
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <>
      {/* Google Fonts — loaded once, deduped by the browser */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap"
      />

      <Script id="fb-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID || ''}');
          fbq('track', 'PageView');
        `}
      </Script>

      <div className={s.page}>
        <div className={s.heroBg}>
          <nav className={s.nav}>
            <div className={s.navLogoWrapper}>
              <span className={s.navLogoText}>SUGU</span>
            </div>
            <button 
              className={s.btnNav}
              onClick={() => document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Bell size={16} />
              Me notifier
            </button>
          </nav>

          <section className={s.hero}>
            <div className={s.heroBrandWrapper}>
              <Image
                src="https://cdn.sugu.pro/p/sugu_logo.png"
                alt="SUGU"
                width={200}
                height={138}
                priority
                className={s.heroLogoImg} 
              />
            </div>
            <p className={s.heroSub}>La plus grande marketplace africaine</p>
            <h1 className={s.heroHeadline}>
              Quelque chose d&apos;
              <span className={s.highlightBadge}>immense</span> arrive.
            </h1>

            {/* ── PROGRESS BAR ── */}
            <div className={s.pbWrap}>
              <div className={s.pbTop}>
                <span className={s.pbTopLabel}>
                  Progression vers le lancement
                </span>
                <span className={s.pbPct}>
                  {progress.toFixed(1)}
                  <em className={s.pbPctUnit}>%</em>
                </span>
              </div>

              <div className={s.pbTrack}>
                <div
                  className={s.pbGlow}
                  style={{ width: `${progress}%` }}
                />
                <div
                  className={s.pbFill}
                  style={{ width: `${progress}%` }}
                />

                {/* Animated tip */}
                <div className={s.pbTip} style={{ left: `${progress}%` }}>
                  <div className={s.pbRing} />
                  <div className={s.pbRing2} />
                  <div className={s.pbTipCore} />

                  {particles.map((p) => (
                    <div
                      key={p.id}
                      className={s.particle}
                      style={{
                        width: p.size,
                        height: p.size,
                        left: "50%",
                        top: "50%",
                        marginLeft: -p.size / 2,
                        marginTop: -p.size / 2,
                        "--tx": `${p.x}px`,
                        "--ty": `${p.y}px`,
                      } as React.CSSProperties}
                    />
                  ))}
                </div>
              </div>

              {/* Milestone markers */}
              <div className={s.msRow}>
                {milestones.map((m) => (
                  <div className={s.ms} key={m.pct}>
                    <div
                      className={`${s.msDot} ${
                        progress >= m.pct ? s.msDotOn : ""
                      }`}
                    />
                    <span
                      className={`${s.msLbl} ${
                        progress >= m.pct ? s.msLblOn : ""
                      }`}
                    >
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className={s.stats}>
                <div className={s.stat}>
                  <span className={s.statN}>
                    {leadCount.toLocaleString("fr-FR")}
                  </span>
                  <span className={s.statL}>Sur la liste</span>
                </div>
                <div className={s.statSep} />
                <div className={s.stat}>
                  <span className={s.statN}>{dynamicStats.countries}</span>
                  <span className={s.statL}>Pays</span>
                </div>
                <div className={s.statSep} />
                <div className={s.stat}>
                  <span className={s.statN}>
                    {sellerCount.toLocaleString("fr-FR")}+
                  </span>
                  <span className={s.statL}>Vendeurs</span>
                </div>
                <div className={s.statSep} />
                <div className={s.stat}>
                  <span className={s.statN}>--</span>
                  <span className={s.statL}>Lancement</span>
                </div>
              </div>
            </div>

            {/* Extended Waitlist Form */}
            <div className={s.extFormBox} id="waitlist-form">
              {isSubmitted ? (
                <div className={s.successBox}>
                  <div className={s.successIcon}>✓</div>
                  <h3 className={s.successTitle}>Merci pour votre inscription !</h3>
                  <p className={s.successSub}>
                    Vous êtes officiellement sur la liste VIP. Nous avons hâte de vous dévoiler Sugu très bientôt.
                  </p>
                  
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={s.whatsappShareBtn}>
                    <MessageCircle size={20} />
                    Partager sur WhatsApp
                  </a>
                </div>
              ) : (
                <>
                  <h3 className={s.extFormTitle}>Rejoignez la liste d&apos;attente VIP</h3>
                  <form className={s.extForm} onSubmit={handleSubmit}>
                    {formError && <div className={s.formErrorMessage}>{formError}</div>}
                    <div className={s.extFormGroup}>
                      <input
                        type="text"
                        required
                        placeholder="Nom complet *"
                        className={s.extInput}
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className={s.extFormGroup}>
                      <input
                        type="email"
                        placeholder="Adresse e-mail"
                        className={s.extInput}
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div className={s.extPhoneGroup}>
                      <div className={s.extSelectWrap}>
                        <select
                          className={s.extInput}
                          value={formData.phoneCode}
                          onChange={(e) => setFormData({...formData, phoneCode: e.target.value})}
                        >
                          <option value="+226">🇧🇫 +226</option>
                          <option value="+225">🇨🇮 +225</option>
                          <option value="+221">🇸🇳 +221</option>
                          <option value="+223">🇲🇱 +223</option>
                          <option value="+228">🇹🇬 +228</option>
                          <option value="+229">🇧🇯 +229</option>
                          <option value="+227">🇳🇪 +227</option>
                          <option value="+245">🇬🇼 +245</option>
                        </select>
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="Numéro de téléphone *"
                        className={s.extInput}
                        style={{ flex: 1 }}
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>

                    <div className={s.extFormGroup}>
                      <label className={s.extLabel}>Qu&apos;est-ce qui vous manque le plus lors de vos achats en ligne ?</label>
                      <div className={s.radioGroup}>
                        {[
                          { val: "authentiques", label: "Trouver des produits authentiques" },
                          { val: "qualité", label: "Avoir confiance en la qualité des produits" },
                          { val: "livraison", label: "Une livraison rapide et fiable" },
                          { val: "prix", label: "Des prix abordables et transparents" },
                          { val: "client", label: "Un service client disponible et réactif" },
                          { val: "paiement", label: "Pouvoir payer facilement (Mobile Money, carte, etc.)" }
                        ].map(opt => (
                          <label key={opt.val} className={s.radioLabel}>
                            <input
                              type="radio"
                              name="missing"
                              value={opt.val}
                              checked={formData.missing === opt.val}
                              onChange={(e) => setFormData({...formData, missing: e.target.value})}
                              className={s.radioInput}
                            />
                            <span className={s.radioText}>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className={s.extFormGroup}>
                      <label className={s.extLabel}>Quelles sont vos attentes concernant Sugu ?</label>
                      <div className={s.extTextareaWrap}>
                        <textarea
                          placeholder="Partagez vos attentes ici..."
                          className={s.extTextarea}
                          maxLength={300}
                          value={formData.expectations}
                          onChange={(e) => setFormData({...formData, expectations: e.target.value})}
                        />
                        <span className={s.extCharCount}>{formData.expectations.length}/300</span>
                      </div>
                    </div>

                    <button type="submit" className={s.extBtnCta} disabled={isLoading}>
                      {isLoading ? (
                         <div className={s.loader} />
                      ) : (
                        <>
                          <Bell size={18} />
                          Me notifier en premier
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Social proof */}
            <div className={s.social}>
              <div className={s.avts}>
                {[
                  { bg: "#7B5EA7", l: "A" },
                  { bg: "#3D7EBF", l: "M" },
                  { bg: "#5A9E6F", l: "K" },
                ].map((a, i) => (
                  <div
                    key={i}
                    className={s.av}
                    style={{ background: a.bg }}
                  >
                    {a.l}
                  </div>
                ))}
                <div className={`${s.av} ${s.avMore}`}>+</div>
              </div>
              <span>
                Rejoignez la liste d&apos;attente
              </span>
            </div>
          </section>
        </div>

        {/* Why Sugu? (USP) */}
        <section className={s.uspSec}>
          <div className={s.uspContainer}>
            <h2 className={s.uspTitle}>Pourquoi choisir Sugu ?</h2>
            <p className={s.uspSub}>L&apos;excellence du e-commerce enfin disponible chez vous.</p>
            
            <div className={s.uspGrid}>
              <div className={s.uspItem}>
                <div className={s.uspIconWrap}><BadgeCheck size={32} /></div>
                <h4>100% Authentique</h4>
                <p>Chaque vendeur est vérifié manuellement pour garantir des produits originaux.</p>
              </div>
              <div className={s.uspItem}>
                <div className={s.uspIconWrap}><ShieldCheck size={32} /></div>
                <h4>Paiement Sécurisé</h4>
                <p>Payez en toute confiance via Mobile Money ou à la livraison.</p>
              </div>
              <div className={s.uspItem}>
                <div className={s.uspIconWrap}><Smartphone size={32} /></div>
                <h4>Interface Intuitive</h4>
                <p>Une expérience d&apos;achat fluide, pensée pour les réseaux mobiles africains.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sneak Peek Section */}
        <section className={s.peekSec}>
          <div className={s.peekContainer}>
            <div className={s.peekContent}>
              <span className={s.peekBadge}>Avant-première</span>
              <h2 className={s.peekTitle}>Une expérience shopping révolutionnaire.</h2>
              <p className={s.peekDesc}>
                Sugu n&apos;est pas juste un site de plus. C&apos;est votre nouveau compagnon shopping quotidien, intelligent, rapide et élégant.
              </p>
              <ul className={s.peekList}>
                <li style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', fontSize: '15px', color: '#555'}}>
                   <CheckCircle2 size={18} className="text-orange-500" /> Mode, Électronique, Déco et plus
                </li>
                <li style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', fontSize: '15px', color: '#555'}}>
                   <CheckCircle2 size={18} className="text-orange-500" /> Offres exclusives réservées aux membres VIP
                </li>
              </ul>
            </div>
            <div className={s.peekVisual}>
               <div className={s.peekImgWrapper}>
                 <Image 
                    src="/app_sneak_peek.png" 
                    alt="Sugu App Sneak Peek" 
                    width={600} 
                    height={800} 
                    className={s.peekImg}
                 />
               </div>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className={s.cardsSec}>
          <div className={s.cards}>
            <div className={s.card}>
              {/* <span className={s.cardIco}>🌍</span> */}
              <h3 className={s.cardTtl}>
                Vendeurs d&apos;exception
              </h3>
              <p className={s.cardDsc}>
                Une sélection rigoureuse des meilleurs commerçants et artisans pour une qualité garantie.
              </p>
            </div>
            <div className={`${s.card} ${s.cardFeat}`}>
              {/* <span className={s.cardIco}>🛍️</span> */}
              <h3 className={s.cardTtl}>Une sélection riche et variée</h3>
              <p className={s.cardDsc}>
                Le meilleur de la mode, de la beauté, de l&apos;électronique et bien plus, à portée de main.
              </p>
            </div>
            <div className={s.card}>
              {/* <span className={s.cardIco}>🚀</span> */}
              <h3 className={s.cardTtl}>
                Livraison fiable et sécurisée
              </h3>
              <p className={s.cardDsc}>
                Une logistique locale optimisée pour vous servir avec soin et rapidité dans toutes nos zones couvertes.
              </p>
            </div>
          </div>
        </section>

        <footer className={s.footer}>
          <div className={s.fLogoWrapper}>
            <Image
              src="https://cdn.sugu.pro/p/sugu_logo.png"
              alt="SUGU Logo"
              width={50}
              height={34}
              className={s.fLogoImg}
            />
            <span className={s.fLogoText}>SUGU</span>
          </div>
          <ul className={s.fLinks}>
            <li>
              <a href="#">À propos</a>
            </li>
            <li>
              <a href="#">Confidentialité</a>
            </li>
            <li>
              <a href="#">Contact</a>
            </li>
            <li>
              <button 
                onClick={(e) => { e.preventDefault(); setIsSellerModalOpen(true); }}
                className={s.fLinkBtn}
              >
                Vendre sur Sugu
              </button>
            </li>
          </ul>
          <span className={s.fCopy}>
            © 2026 SUGU Tous droits réservés
          </span>
        </footer>
      </div>

      {/* WhatsApp Floating Button */}
      <a 
        href={process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL || "#"} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={s.whatsappFloat}
      >
        <span className={s.whatsappBadge}>Canal VIP</span>
        <MessageCircle size={32} />
      </a>

      {/* SELLER REGISTRATION MODAL */}
      {isSellerModalOpen && (
        <div className={s.modalOverlay}>
          <div className={s.modalContent}>
            {/* Modal Header */}
            <div className={s.modalHeader}>
              <button className={s.modalBackBtn} onClick={() => setIsSellerModalOpen(false)}>
                <ArrowLeft size={24} />
              </button>
              <h2 className={s.modalTitle}>Portail B2B : Grossistes</h2>
              <div style={{width: 24}}></div> {/* spacer for centering */}
            </div>

            {/* Illustration wrapper */}
            <div className={s.modalHero}>
               <div className={s.modalHeroIllustration}>
                 <Image 
                   src="https://cdn.sugu.pro/p/seller-hero.png" 
                   alt="Sugu Seller Illustration" 
                   width={180} 
                   height={180} 
                   className={s.modalHeroImg}
                   style={{ height: "auto" }}
                 />
               </div>
            </div>
            

            {/* Seller Form */}
            {isSellerSubmitted ? (
               <div className={s.successBox} style={{ margin: "40px 10px" }}>
                 <div className={s.successIcon}>✓</div>
                 <h3 className={s.successTitle}>Demande envoyée !</h3>
                 <p className={s.successSub}>
                   Merci de votre intérêt. Notre équipe d&apos;intégration va vous contacter très prochainement sur WhatsApp.
                 </p>
               </div>
            ) : (
            <form className={s.sForm} onSubmit={handleSellerSubmit}>
              {sellerError && <div className={s.formErrorMessage}>{sellerError}</div>}
              <div className={s.sInputWrap}>
                <User className={s.sInputIcon} size={20} />
                <input type="text" placeholder="Nom complet" className={s.sInput} value={sellerData.fullName} onChange={e => setSellerData({...sellerData, fullName: e.target.value})} required />
              </div>
              
              <div className={s.sInputWrap}>
                <Store className={s.sInputIcon} size={20} />
                <input type="text" placeholder="Nom de la boutique / Entreprise" className={s.sInput} value={sellerData.storeName} onChange={e => setSellerData({...sellerData, storeName: e.target.value})} required />
              </div>

              <div className={s.sInputWrap}>
                <Briefcase className={s.sInputIcon} size={20} />
                <select className={s.sInput} style={{ cursor: "pointer" }} value={sellerData.companyProfile} onChange={e => setSellerData({...sellerData, companyProfile: e.target.value})} required>
                  <option value="" disabled hidden>Profil d&apos;entreprise (Obligatoire)</option>
                  <option value="fabricant">Fabricant / Usine locale</option>
                  <option value="importateur">Grand Importateur direct</option>
                  <option value="grossiste">Grossiste principal</option>
                  <option value="revendeur">Revendeur indépendant</option>
                </select>
              </div>

              <div className={s.sInputWrap}>
                <Shirt className={s.sInputIcon} size={20} />
                <select className={s.sInput} style={{ cursor: "pointer" }} value={sellerData.salesChannel} onChange={e => setSellerData({...sellerData, salesChannel: e.target.value})} required>
                  <option value="" disabled hidden>Comment vendez-vous actuellement ?</option>
                  <option value="physique">Boutique physique</option>
                  <option value="whatsapp">WhatsApp / Réseaux sociaux</option>
                  <option value="marche">Marché hebdomadaire</option>
                  <option value="plateforme">Autre plateforme en ligne</option>
                  <option value="aucun">Je ne vends pas encore en ligne</option>
                </select>
              </div>

              <div className={s.sInputWrap}>
                <Hash className={s.sInputIcon} size={20} />
                <select className={s.sInput} style={{ cursor: "pointer" }} value={sellerData.productCount} onChange={e => setSellerData({...sellerData, productCount: e.target.value})} required>
                  <option value="" disabled hidden>Capacité Logistique / Volume</option>
                  <option value="palette">Palette / Petit entrepôt</option>
                  <option value="camion">Stock massif / Semi-remorque</option>
                  <option value="conteneur">Importation par Conteneurs entiers</option>
                </select>
              </div>

              <div className={s.sInputWrap}>
                <Globe className={s.sInputIcon} size={20} />
                <select className={s.sInput} style={{ cursor: "pointer" }} value={sellerData.country} onChange={e => setSellerData({...sellerData, country: e.target.value})} required>
                  <option value="" disabled hidden>Pays</option>
                  <option value="BF">Burkina Faso 🇧🇫</option>
                  <option value="CI">Côte d'Ivoire 🇨🇮</option>
                  <option value="SN">Sénégal 🇸🇳</option>
                  <option value="ML">Mali 🇲🇱</option>
                  <option value="TG">Togo 🇹🇬</option>
                  <option value="BJ">Bénin 🇧🇯</option>
                  <option value="NE">Niger 🇳🇪</option>
                  <option value="GW">Guinée-Bissau 🇬🇼</option>
                </select>
              </div>

              <div className={s.sBtnGpsWrap}>
                <button type="button" className={s.sBtnGps} onClick={handleGetLocation}>
                  <Locate size={16} /> 
                  {sellerData.useLocation ? "Localisation trouvée ✓" : "Utiliser mon GPS (Automatique)"}
                </button>
              </div>

              <div className={s.sInputWrap}>
                <MapPin className={s.sInputIcon} size={20} />
                <input type="text" placeholder="Ville" className={s.sInput} value={sellerData.city} onChange={e => setSellerData({...sellerData, city: e.target.value})} required />
              </div>

              <div className={s.sInputWrap}>
                <Locate className={s.sInputIcon} size={20} />
                <input type="text" placeholder="Quartier" className={s.sInput} value={sellerData.neighborhood} onChange={e => setSellerData({...sellerData, neighborhood: e.target.value})} />
              </div>

              <div className={s.sInputWrap}>
                <MessageCircle className={s.sInputIcon} size={20} />
                {sellerData.country && COUNTRY_CODES[sellerData.country] && (
                   <span className={s.sPhonePrefix}>{COUNTRY_CODES[sellerData.country]}</span>
                )}
                <input type="tel" placeholder="Téléphone (WhatsApp)" className={s.sInput} value={sellerData.phone} onChange={e => setSellerData({...sellerData, phone: e.target.value})} required />
              </div>

              <div className={s.sInputWrap}>
                <Mail className={s.sInputIcon} size={20} />
                <input type="email" placeholder="E-mail (facultatif)" className={s.sInput} value={sellerData.email} onChange={e => setSellerData({...sellerData, email: e.target.value})} />
              </div>

              <div className={`${s.sInputWrap} ${s.sInputWrapTextarea}`}>
                <textarea 
                  placeholder="Décrivez votre activité en quelques mots (facultatif)"
                  className={`${s.sInput} ${s.sTextarea}`}
                  value={sellerData.description}
                  onChange={e => setSellerData({...sellerData, description: e.target.value})}
                  rows={3}
                />
              </div>

              {/* Checkboxes */}
              <div className={s.sCheckGroup}>
                <label className={s.sCheckLabel}>
                  <input type="checkbox" className={s.sCheck} checked={sellerData.hasPhotos} onChange={e => setSellerData({...sellerData, hasPhotos: e.target.checked})} />
                  <span>J&apos;ai déjà des photos de mes produits</span>
                </label>
                <label className={s.sCheckLabel}>
                  <input type="checkbox" className={s.sCheck} checked={sellerData.hasRCCM} onChange={e => setSellerData({...sellerData, hasRCCM: e.target.checked})} />
                  <span>Je possède un Registre de Commerce (RCCM) et un NIF valides</span>
                </label>
              </div>

              <p className={s.sFooterNote}>Vous serez contacté pour une qualification de compte.</p>

              <button type="submit" className={s.sSubmitBtn} disabled={isSellerLoading}>
                {isSellerLoading ? <div className={s.loader} /> : "Demander mon accès B2B"}
              </button>
            </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
