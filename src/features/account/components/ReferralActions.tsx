"use client";

import { useState, useCallback } from "react";
import { Copy, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui";

interface ReferralActionsProps {
  referralCode: string;
  referralLink: string | null;
}

/**
 * Client-side referral action buttons — copy code and share link.
 */
function ReferralActions({ referralCode, referralLink }: ReferralActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const textToCopy = referralLink ?? referralCode;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [referralCode, referralLink]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: "Rejoignez Sugu !",
      text: `Utilisez mon code de parrainage ${referralCode} pour rejoindre Sugu et profiter d'avantages exclusifs !`,
      url: referralLink ?? `https://sugu.pro/r/${referralCode}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled share, or share not available
        if ((err as Error)?.name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    } else {
      // Fallback: copy link
      handleCopy();
    }
  }, [referralCode, referralLink, handleCopy]);

  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="md"
        className="bg-white/20 text-white border-white/30 hover:bg-white/30"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check size={14} /> Copié !
          </>
        ) : (
          <>
            <Copy size={14} /> Copier
          </>
        )}
      </Button>
      <Button
        variant="secondary"
        size="md"
        className="bg-white/20 text-white border-white/30 hover:bg-white/30"
        onClick={handleShare}
      >
        <Share2 size={14} /> Partager
      </Button>
    </div>
  );
}

export { ReferralActions };
