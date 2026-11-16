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

export const DEFAULT_AUDIUS_HANDLE = 'RitmXoid';

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

  return (
    users.find((u) => u.handle.toLowerCase() === cleanHandle.toLowerCase()) ?? users[0]
  );
}

export async function fetchAudiusProfileTracks(handle: string): Promise<{
  tracks: Track[];
  resolvedHandle: string;
}> {
  const t = getTranslations();
  const cleanHandle = handle.replace(/^@/, '').trim();
  if (!cleanHandle) {
    throw new Error(t.errEnterAudiusHandle);
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
      const rawTracks = tracksData.data ?? [];
      if (rawTracks.length === 0) {
        isTerminalUserError = true;
        throw new Error(t.errAudiusNoTracks(selectedUser.handle));
      }

      const tracks: Track[] = rawTracks.map((tr) => ({
        id: `audius-${tr.id}`,
        title: tr.title,
        artist: tr.user?.name || selectedUser.name || selectedUser.handle,
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
