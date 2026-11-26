function decodeIcyBytes(bytes: Uint8Array): string {
  let end = bytes.length;
  while (end > 0 && bytes[end - 1] === 0) {
    end -= 1;
  }
  const trimmed = end === bytes.length ? bytes : bytes.subarray(0, end);
  if (trimmed.length === 0) return '';

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(trimmed);
  } catch {
    try {
      return new TextDecoder('windows-1251').decode(trimmed);
    } catch {
      return new TextDecoder('utf-8').decode(trimmed);
    }
  }
}

function cleanRadioTextFragment(raw: string): string {
  return raw
    .replace(/\0/g, '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitRadioStreamTitle(
  rawStreamTitle: string,
  stationName: string | null
): { title: string | null; artist: string | null } {
  const cleaned = cleanRadioTextFragment(rawStreamTitle);
  if (
    !cleaned ||
    cleaned === '-' ||
    cleaned.length < 2 ||
    /^https?:\/\//i.test(cleaned) ||
    /^(?:unknown|no title|live stream|stream|ad|advert|commercial)$/i.test(cleaned)
  ) {
    return { title: null, artist: null };
  }

  if (stationName && cleaned.toLowerCase() === stationName.toLowerCase()) {
    return { title: null, artist: null };
  }

  const sepMatch = cleaned.match(/^(.+?)\s+[-–—]\s+(.+)$/);
  if (sepMatch) {
    const rawArtist = sepMatch[1].trim();
    const rawSong = sepMatch[2].trim();
    if (
      rawArtist &&
      rawSong &&
      rawArtist !== '-' &&
      rawSong !== '-' &&
      !/^(?:unknown|advert|commercial)$/i.test(rawArtist)
    ) {
      return {
        title: rawSong.slice(0, 140),
        artist: rawArtist.slice(0, 100),
      };
    }
  }

  return {
    title: cleaned.slice(0, 140),
    artist: stationName ? stationName.slice(0, 100) : null,
  };
}

function extractStreamTitleFromIcyBlock(
  metaText: string,
  stationName: string | null
): { title: string | null; artist: string | null } {
  if (!metaText) return { title: null, artist: null };

  const fullMatch =
    metaText.match(/StreamTitle='([\s\S]*?)';(?=\s*[A-Za-z0-9_-]+=|[\s;\r\n\0]*$)/i) ||
    metaText.match(/StreamTitle='([^']*)'/i);
  if (!fullMatch || !fullMatch[1]) {
    return { title: null, artist: null };
  }

  return splitRadioStreamTitle(fullMatch[1], stationName);
}

function concatUint8Arrays(a: Uint8Array, b: Uint8Array): Uint8Array {
  if (a.length === 0) return b;
  if (b.length === 0) return a;
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function extractSomaFmChannel(targetUrl: string): string | null {
  try {
    const parsed = new URL(targetUrl);
    if (!/(^|\.)somafm\.com$/i.test(parsed.hostname)) return null;
    const seg = parsed.pathname.split('/').filter(Boolean)[0];
    if (!seg) return null;
    const channel = seg.split('-')[0]?.trim().toLowerCase();
    return channel && /^[a-z0-9]+$/i.test(channel) ? channel : null;
  } catch {
    return null;
  }
}

async function fetchSomaFmNowPlaying(
  channel: string,
  signal?: AbortSignal
): Promise<{ title: string | null; artist: string | null }> {
  try {
    const res = await fetch(`https://somafm.com/songs/${channel}.json`, {
      signal,
      cache: 'no-store',
    });
    if (!res.ok) return { title: null, artist: null };
    const data = (await res.json()) as {
      songs?: Array<{ title?: unknown; artist?: unknown }>;
    };
    const first = Array.isArray(data?.songs) ? data.songs[0] : undefined;
    const rawTitle = typeof first?.title === 'string' ? cleanRadioTextFragment(first.title) : '';
    const rawArtist = typeof first?.artist === 'string' ? cleanRadioTextFragment(first.artist) : '';
    if (!rawTitle) return { title: null, artist: null };
    return {
      title: rawTitle.slice(0, 140),
      artist: rawArtist ? rawArtist.slice(0, 100) : null,
    };
  } catch {
    return { title: null, artist: null };
  }
}

async function fetchDirectBrowserIcyNowPlaying(
  targetUrl: string,
  signal?: AbortSignal
): Promise<{ title: string | null; artist: string | null }> {
  const timeoutCtrl = new AbortController();
  const timeoutId = window.setTimeout(() => timeoutCtrl.abort(), 6000);
  const onParentAbort = () => timeoutCtrl.abort();
  signal?.addEventListener('abort', onParentAbort, { once: true });

  try {
    const res = await fetch(targetUrl, {
      signal: timeoutCtrl.signal,
      headers: {
        'Icy-MetaData': '1',
      },
      cache: 'no-store',
    });
    if (!res.ok || !res.body) {
      void res.body?.cancel?.().catch(() => {});
      return { title: null, artist: null };
    }

    const rawStationName = res.headers.get('icy-name');
    const stationName = rawStationName ? cleanRadioTextFragment(rawStationName) || null : null;
    const metaintRaw = res.headers.get('icy-metaint');
    const metaint = metaintRaw ? Number.parseInt(metaintRaw, 10) : 0;

    if (!Number.isFinite(metaint) || metaint <= 0 || metaint > 262144) {
      void res.body.cancel().catch(() => {});
      return { title: null, artist: null };
    }

    const reader = res.body.getReader();
    let buffer: Uint8Array = new Uint8Array(0);
    let totalRead = 0;
    let blocksChecked = 0;
    const maxBytes = 192 * 1024;
    const maxBlocks = metaint <= 32768 ? 3 : 1;

    try {
      while (blocksChecked < maxBlocks && totalRead < maxBytes) {
        while (buffer.length <= metaint) {
          if (totalRead >= maxBytes) break;
          const { done, value } = await reader.read();
          if (done || !value) break;
          totalRead += value.byteLength;
          buffer = concatUint8Arrays(buffer, value);
        }

        if (buffer.length <= metaint) break;

        const metaLen = buffer[metaint] * 16;
        const blockEnd = metaint + 1 + metaLen;

        while (buffer.length < blockEnd) {
          if (totalRead >= maxBytes) break;
          const { done, value } = await reader.read();
          if (done || !value) break;
          totalRead += value.byteLength;
          buffer = concatUint8Arrays(buffer, value);
        }

        if (buffer.length < blockEnd) break;

        if (metaLen > 0) {
          const metaSlice = buffer.subarray(metaint + 1, blockEnd);
          const metaText = decodeIcyBytes(metaSlice);
          const extracted = extractStreamTitleFromIcyBlock(metaText, stationName);
          if (extracted.title) {
            return extracted;
          }
        }

        blocksChecked += 1;
        buffer = buffer.subarray(blockEnd);
      }
    } finally {
      void reader.cancel().catch(() => {});
    }

    return { title: null, artist: null };
  } catch {
    return { title: null, artist: null };
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onParentAbort);
  }
}

export async function fetchRadioNowPlaying(
  targetUrl: string,
  signal?: AbortSignal
): Promise<{ title: string | null; artist: string | null; reachable: boolean }> {
  const somaChannel = extractSomaFmChannel(targetUrl);

  // 1) Try same-origin Node server extractor first
  try {
    const res = await fetch(
      `/api/radio-metadata?url=${encodeURIComponent(targetUrl)}`,
      { signal, cache: 'no-store' }
    );
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (res.ok && contentType.includes('application/json')) {
      const data = (await res.json()) as {
        title?: unknown;
        artist?: unknown;
      };
      const title = typeof data.title === 'string' ? data.title.trim() : '';
      const artist = typeof data.artist === 'string' ? data.artist.trim() : '';
      if (title) {
        return { title, artist: artist || null, reachable: true };
      }
      if (somaChannel) {
        const soma = await fetchSomaFmNowPlaying(somaChannel, signal);
        if (soma.title) {
          return { ...soma, reachable: true };
        }
      }
      return { title: null, artist: null, reachable: true };
    }
  } catch (err) {
    if ((err as { name?: string } | null)?.name === 'AbortError') {
      return { title: null, artist: null, reachable: false };
    }
    // Fall through to client-side fallbacks when /api/radio-metadata is absent (e.g. static hosting)
  }

  if (signal?.aborted) {
    return { title: null, artist: null, reachable: false };
  }

  // 2) Static-hosting fallback: SomaFM public CORS JSON API
  if (somaChannel) {
    const soma = await fetchSomaFmNowPlaying(somaChannel, signal);
    if (soma.title) {
      return { ...soma, reachable: true };
    }
  }

  // 3) Static-hosting fallback: direct CORS ICY StreamTitle read
  const directIcy = await fetchDirectBrowserIcyNowPlaying(targetUrl, signal);
  if (directIcy.title) {
    return { ...directIcy, reachable: true };
  }

  return { title: null, artist: null, reachable: false };
}
