"use client";

import { useBranding } from "@/components/BrandingProvider";

/**
 * Global announcement bar rendered at the top of pages.
 * Only visible when enabled via admin branding settings.
 * Never crashes if data is missing.
 */
export default function AnnouncementBar() {
  const { announcement, colors } = useBranding();

  if (!announcement?.enabled || !announcement.text) {
    return null;
  }

  const bgColor = colors?.primary ?? "#F15412";

  return (
    <div
      className="flex items-center justify-center gap-2 py-2 px-4 text-xs sm:text-sm font-medium text-white"
      style={{ backgroundColor: bgColor }}
    >
      <span>{announcement.text}</span>
      {announcement.link && (
        <a
          href={announcement.link}
          className="underline text-white/80 hover:text-white transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          En savoir plus →
        </a>
      )}
    </div>
  );
}
