const SLUG = 'rhythm-pedal-tidy';
const TOKEN_KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${TOKEN_KEY}:verdict`;

export interface LicenseState {
  unlocked: boolean;
  pending: boolean;
  notice?: string;
}

function apiBase(): string {
  return location.hostname === `${SLUG}.sociobot.in` ? 'https://api.sociobot.in' : 'https://pilot-api.sociobot.in';
}

export function checkoutUrl(): string {
  return `${apiBase()}/api/v1/products/${SLUG}/checkout`;
}

export function consumeReturnLicense(): string | null {
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (!token) return localStorage.getItem(TOKEN_KEY);
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(VERDICT_KEY);
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  return token;
}

export function restoreLicense(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
}

export function removeLicense(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(VERDICT_KEY);
}

export async function licenseState(force = false): Promise<LicenseState> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return { unlocked: false, pending: false };
  const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? 'null') as { valid: boolean; checkedAt: number } | null;
  const recent = cached && Date.now() - cached.checkedAt < 86400000;
  if (recent && !force) return { unlocked: cached.valid, pending: false, notice: cached.valid ? undefined : 'License no longer active.' };
  try {
    const response = await fetch(`${apiBase()}/api/v1/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('Verification service unavailable');
    const result = await response.json() as { valid: boolean; reason: string };
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: result.valid, checkedAt: Date.now() }));
    return { unlocked: result.valid, pending: false, notice: result.valid ? undefined : 'License no longer active.' };
  } catch {
    return { unlocked: cached?.valid ?? false, pending: false, notice: cached ? 'Offline: using your last license check.' : 'License check is waiting for a connection.' };
  }
}
