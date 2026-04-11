// ══════════════════════════════════════════════════════════════════
//  Google AdSense Configuration
//  Values are read from environment variables (VITE_* prefix).
//  Set them in .env for local dev or in your server/CI for production.
//  See .env.example for reference.
// ══════════════════════════════════════════════════════════════════

export const ADSENSE_CONFIG = {
  publisherId: import.meta.env.VITE_ADSENSE_PUBLISHER_ID ?? '',

  slots: {
    sidebarLeft: import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR_LEFT ?? '',
    sidebarRight: import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR_RIGHT ?? '',
    bottomDesktop: import.meta.env.VITE_ADSENSE_SLOT_BOTTOM_DESKTOP ?? '',
    bottomMobile: import.meta.env.VITE_ADSENSE_SLOT_BOTTOM_MOBILE ?? '',
  },
} as const
