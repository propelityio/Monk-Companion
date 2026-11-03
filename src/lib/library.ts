// The Library: collections of recorded talks, played inside Monk Companion.
// Each is a YouTube playlist embedded in privacy-enhanced mode. Titles are the
// collections' own (teacher names are never shown); descriptions are ours.

export type Collection = {
  id: string;
  playlist: string; // YouTube playlist ID
  title: string;
  language: "en" | "es" | "pt";
  kind: "meditations" | "classes" | "retreat";
  videos?: number;
  about: string; // short, in English
};

export const COLLECTIONS: Collection[] = [
  {
    id: "lam-rim-year",
    playlist: "PLFGIIvTlnnpSg0gfgoHkn2fmLGsmM7fa4",
    title: "Lam Rim Year",
    language: "en",
    kind: "meditations",
    videos: 52,
    about: "A year of guided meditations through the graduated path to awakening, one step at a time.",
  },
  {
    id: "inner-wisdom",
    playlist: "PLFGIIvTlnnpQhnNuPcamrN92gBPocLJet",
    title: "Inner Wisdom for Daily Life",
    language: "en",
    kind: "classes",
    videos: 32,
    about: "Informal talks on how Buddhist ideas can help with everyday life.",
  },
  {
    id: "weekday-2026",
    playlist: "PLPZlkn5lIEj0",
    title: "Weekday 2026 Classes",
    language: "en",
    kind: "classes",
    videos: 79,
    about: "Weekday classes, including Buddhist Tips for a Happy Life and Heart Advice for a Happy Life.",
  },
  {
    id: "saturday-2026",
    playlist: "PLW5k7-cR_1YI",
    title: "Saturday 2026 Classes",
    language: "en",
    kind: "classes",
    videos: 24,
    about: "Saturday classes from 2026.",
  },
  {
    id: "sunday-2026",
    playlist: "PLAgLBSF1qgOg",
    title: "Sunday 2026 Classes",
    language: "en",
    kind: "classes",
    about: "Sunday classes from 2026.",
  },
  {
    id: "earlier-classes",
    playlist: "PLRfl798L3RPchMhGNg50H-HMLN0kp2jYn",
    title: "Earlier classes",
    language: "en",
    kind: "classes",
    about: "Classes from earlier years.",
  },
  {
    id: "lam-rim-ano",
    playlist: "PLFGIIvTlnnpSEZdvnemfAP_wFrNhZRcip",
    title: "El Lam Rim en 1 año",
    language: "es",
    kind: "meditations",
    videos: 42,
    about: "Guided Lam Rim meditations in Spanish, through the graduated path.",
  },
  {
    id: "camino-budista",
    playlist: "PLFGIIvTlnnpQ9SrvQ2DoUDn3eZo2qKzYy",
    title: "Estudio del camino budista para cultivar una felicidad duradera",
    language: "es",
    kind: "classes",
    videos: 66,
    about: "A systematic study of the Buddhist path, toward a lasting happiness grounded in understanding the mind.",
  },
  {
    id: "retiro-colombia-2026",
    playlist: "PLGF8ggsDbx5A",
    title: "Retiro en Colombia, junio 2026",
    language: "es",
    kind: "retreat",
    videos: 7,
    about: "Teachings from a retreat in Colombia, June 2026.",
  },
  {
    id: "retiro-bilbao-2026",
    playlist: "PLNP_m91MgYmc",
    title: "Retiro en Bilbao, septiembre 2026",
    language: "es",
    kind: "retreat",
    videos: 11,
    about: "Teachings from a retreat in Bilbao, September 2026.",
  },
  {
    id: "clareza-mental",
    playlist: "PLFGIIvTlnnpQB6Ex2KYLj15ZCpEBswQTk",
    title: "Clareza mental, equilíbrio emocional, compaixão e sabedoria",
    language: "pt",
    kind: "retreat",
    videos: 5,
    about: "A retreat in Portuguese on mental clarity, emotional balance, compassion and wisdom.",
  },
];

/** Privacy-enhanced embed URL for a playlist (no YouTube cookies until played). */
export function playlistEmbed(playlist: string): string {
  return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(playlist)}&rel=0&modestbranding=1`;
}
