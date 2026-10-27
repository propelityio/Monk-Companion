export type GuestProfile = {
  name: string;
  email: string;
  intention: string;
};

const KEY = "monk-companion-profile";

export function loadProfile(): GuestProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestProfile;
    if (!parsed.name || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveProfile(profile: GuestProfile) {
  localStorage.setItem(KEY, JSON.stringify(profile));
}

export function clearProfile() {
  localStorage.removeItem(KEY);
}
