import { DEFAULT_COVER_IMAGE } from '../constants/visualizer';
import { getTranslations } from '../i18n/translations';
import { Track } from '../types/audio';

interface AudiusUser {
  id: string;
  handle: string;
  name: string;
}

interface AudiusTrack {
  id: string;
  title: string;
  duration?: number;
  is_delete?: boolean;
  is_available?: boolean;
  is_streamable?: boolean;
  artwork?: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
  } | null;
  user?: {
    name?: string;
    handle?: string;
  };
}

interface AudiusRepostEntry {
  item_type?: string;
  item?: AudiusTrack & {
    tracks?: AudiusTrack[];
  };
}

export const DEFAULT_AUDIUS_HANDLE = 'RitmXoid';
export const INTERNATIONAL_AUDIUS_HANDLE = 'estelladawnmusic';

const RITMXOID_DEFAULT_LANG_CODES = new Set([
  'ru', // Russian
  'uk', // Ukrainian
  'ua', // legacy Ukrainian alias
  'kk', // Kazakh
  'kz', // Kazakh alias
  'uz', // Uzbek
  'tg', // Tajik
  'ky', // Kyrgyz
  'kg', // Kyrgyz alias
  'tk', // Turkmen
  'tm', // Turkmen alias
  'bg', // Bulgarian
  'hu', // Hungarian
  'mo', // Moldovan (legacy ISO 639-1)
  'lt', // Lithuanian
  'ka', // Georgian
  'ge', // Georgian alias
  'hy', // Armenian
  'am', // Armenian alias
  'tr', // Turkish
  'az', // Azerbaijani
  'cs', // Czech
  'cz', // Czech alias
  'sk', // Slovak
  'pl', // Polish
  'ro', // Romanian (including ro-MD Moldovan)
]);

export function isRitmxoidDefaultBrowserLang(): boolean {
  if (typeof navigator === 'undefined') return true;
  const primaryRaw =
    (navigator.languages && navigator.languages.length > 0
      ? navigator.languages[0]
      : navigator.language) || '';
  const base = primaryRaw.toLowerCase().trim().split(/[-_]/)[0] || '';
  return RITMXOID_DEFAULT_LANG_CODES.has(base);
}

export function getDefaultAudiusHandleForBrowser(): string {
  return isRitmxoidDefaultBrowserLang()
    ? DEFAULT_AUDIUS_HANDLE
    : INTERNATIONAL_AUDIUS_HANDLE;
}

export function extractAudiusHandle(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) return '';

  const looksLikeUrl =
    /^https?:\/\//i.test(trimmed) || /^(?:www\.)?audius\.co\//i.test(trimmed);
  if (looksLikeUrl) {
    try {
      const parsed = new URL(
        /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
      );
      if (
        parsed.hostname === 'audius.co' ||
        parsed.hostname.endsWith('.audius.co')
      ) {
        const seg = parsed.pathname.split('/').filter(Boolean)[0] ?? '';
        return decodeURIComponent(seg).replace(/^@/, '').trim();
      }
      return '';
    } catch {
      return '';
    }
  }

  return trimmed.replace(/^@/, '').trim();
}

async function resolveAudiusUser(host: string, cleanHandle: string): Promise<AudiusUser | null> {
  const t = getTranslations();
  try {
    const handleRes = await fetch(
      `${host}/v1/users/handle/${encodeURIComponent(cleanHandle)}`
    );
    if (handleRes.ok) {
      const handleData = (await handleRes.json()) as { data?: AudiusUser };
      if (handleData.data?.id) {
        return handleData.data;
      }
    }
  } catch {
    // Fallback to search below
  }

  const searchRes = await fetch(
    `${host}/v1/users/search?query=${encodeURIComponent(cleanHandle)}`
  );
  if (!searchRes.ok) {
    throw new Error(t.errAudiusUnresponsive);
  }
  const searchData = (await searchRes.json()) as { data?: AudiusUser[] };
  const users = searchData.data ?? [];
  if (users.length === 0) return null;

  const lower = cleanHandle.toLowerCase();
  return (
    users.find((u) => u.handle.toLowerCase() === lower) ??
    users.find((u) => u.name.toLowerCase() === lower) ??
    users.find((u) => !/^https?:\/\//i.test(u.name.trim())) ??
    users[0]
  );
}

function collectTracksFromReposts(entries: AudiusRepostEntry[]): AudiusTrack[] {
  const seenIds = new Set<string>();
  const collected: AudiusTrack[] = [];

  const pushTrack = (tr: AudiusTrack | undefined) => {
    if (
      !tr ||
      !tr.id ||
      !tr.title ||
      tr.is_delete === true ||
      tr.is_available === false ||
      tr.is_streamable === false ||
      seenIds.has(tr.id)
    ) {
      return;
    }
    seenIds.add(tr.id);
    collected.push(tr);
  };

  for (const entry of entries) {
    if (!entry?.item) continue;
    if (entry.item_type === 'track') {
      pushTrack(entry.item);
    } else if (entry.item_type === 'playlist' && Array.isArray(entry.item.tracks)) {
      for (const plTrack of entry.item.tracks) {
        pushTrack(plTrack);
      }
    }
  }
  return collected;
}

export async function fetchAudiusProfileTracks(handle: string): Promise<{
  tracks: Track[];
  resolvedHandle: string;
}> {
  const t = getTranslations();
  const cleanHandle = extractAudiusHandle(handle);
  if (!cleanHandle) {
    throw new Error(
      /^https?:\/\//i.test(handle.trim()) ? t.errAudiusUrlExample : t.errEnterAudiusHandle
    );
  }

  const resolveRes = await fetch('https://api.audius.co');
  if (!resolveRes.ok) {
    throw new Error(t.errAudiusListFailed);
  }
  const resolveData = (await resolveRes.json()) as { data?: string[] };
  const hosts = resolveData.data ?? [];
  if (hosts.length === 0) {
    throw new Error(t.errNoAudiusHosts);
  }

  let lastError: Error | null = null;
  let isTerminalUserError = false;

  for (const host of hosts.slice(0, 4)) {
    try {
      const selectedUser = await resolveAudiusUser(host, cleanHandle);
      if (!selectedUser) {
        isTerminalUserError = true;
        throw new Error(t.errAudiusNotFound(cleanHandle));
      }

      const tracksRes = await fetch(
        `${host}/v1/users/${selectedUser.id}/tracks?limit=100`
      );
      if (!tracksRes.ok) continue;

      const tracksData = (await tracksRes.json()) as { data?: AudiusTrack[] };
      let rawTracks = (tracksData.data ?? []).filter(
        (tr) => tr.id && tr.title && tr.is_delete !== true && tr.is_available !== false
      );

      // Curator/listener profiles (such as @nowellasarah) publish music via Reposts rather than uploads
      if (rawTracks.length === 0) {
        try {
          const repostsRes = await fetch(
            `${host}/v1/users/${selectedUser.id}/reposts?limit=100`
          );
          if (repostsRes.ok) {
            const repostsData = (await repostsRes.json()) as { data?: AudiusRepostEntry[] };
            rawTracks = collectTracksFromReposts(repostsData.data ?? []);
          }
        } catch {
          // Ignore repost fetch error and throw no-tracks below if empty
        }
      }

      if (rawTracks.length === 0) {
        isTerminalUserError = true;
        throw new Error(t.errAudiusNoTracks(selectedUser.handle));
      }

      const tracks: Track[] = rawTracks.map((tr) => ({
        id: `audius-${tr.id}`,
        title: tr.title,
        artist: tr.user?.name || tr.user?.handle || selectedUser.name || selectedUser.handle,
        cover:
          tr.artwork?.['480x480'] ||
          tr.artwork?.['150x150'] ||
          tr.artwork?.['1000x1000'] ||
          DEFAULT_COVER_IMAGE,
        src: `${host}/v1/tracks/${tr.id}/stream`,
        sourceName: `Audius: @${selectedUser.handle}`,
        durationHint: tr.duration,
      }));

      return { tracks, resolvedHandle: selectedUser.handle };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(t.errAudiusGeneric);
      if (isTerminalUserError) {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error(t.errAudiusConnect);
}
