import dns from 'node:dns/promises';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { Readable } from 'node:stream';
import type { ReadableStream as NodeWebReadableStream } from 'node:stream/web';
import express, { type Request, type Response } from 'express';

const PORT = Number(process.env.PORT) || 3000;
const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const MAX_REDIRECTS = 5;
const MAX_PLAYLIST_BYTES = 2 * 1024 * 1024;
const RADIO_META_CACHE_TTL_MS = 8000;
const RADIO_META_MAX_BYTES = 160 * 1024;

interface CachedRadioMeta {
  expiresAt: number;
  title: string | null;
  artist: string | null;
  stationName: string | null;
}

const radioMetaCache = new Map<string, CachedRadioMeta>();

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

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map((n) => Number.parseInt(n, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local / metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 0 && parts[2] === 0) return true; // 192.0.0.0/24
  if (a === 192 && b === 0 && parts[2] === 2) return true; // TEST-NET-1
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18.0.0/15
  if (a >= 224) return true; // multicast & reserved
  return false;
}

function isPrivateIp(ip: string): boolean {
  const normalized = ip.trim().toLowerCase();
  const zoneIdx = normalized.indexOf('%');
  const bare = zoneIdx === -1 ? normalized : normalized.slice(0, zoneIdx);

  if (net.isIPv4(bare)) {
    return isPrivateIpv4(bare);
  }
  if (!net.isIPv6(bare)) {
    return true;
  }
  if (bare === '::' || bare === '::1') return true;
  if (bare.startsWith('::ffff:')) {
    const mapped = bare.slice('::ffff:'.length);
    if (net.isIPv4(mapped)) return isPrivateIpv4(mapped);
  }
  // fc00::/7 ULA, fe80::/10 link-local, ff00::/8 multicast
  if (
    bare.startsWith('fc') ||
    bare.startsWith('fd') ||
    bare.startsWith('fe8') ||
    bare.startsWith('fe9') ||
    bare.startsWith('fea') ||
    bare.startsWith('feb') ||
    bare.startsWith('ff')
  ) {
    return true;
  }
  return false;
}

async function assertSafePublicUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Unsupported protocol');
  }
  if (parsed.username || parsed.password) {
    throw new Error('Credentials in URL are not allowed');
  }

  const host = parsed.hostname.toLowerCase();
  if (
    !host ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    throw new Error('Local hosts are not allowed');
  }

  if (net.isIP(host)) {
    if (isPrivateIp(host)) {
      throw new Error('Private IP addresses are not allowed');
    }
    return parsed;
  }

  const records = await dns.lookup(host, { all: true });
  if (records.length === 0) {
    throw new Error('Host resolution failed');
  }
  for (const rec of records) {
    if (isPrivateIp(rec.address)) {
      throw new Error('Resolved private IP is not allowed');
    }
  }
  return parsed;
}

async function fetchWithSafeRedirects(
  rawUrl: string,
  init: RequestInit & { signal?: AbortSignal }
): Promise<{ response: globalThis.Response; finalUrl: string }> {
  let currentUrl = (await assertSafePublicUrl(rawUrl)).toString();

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(currentUrl, {
      ...init,
      redirect: 'manual',
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      void res.body?.cancel?.().catch(() => {});
      if (!location) {
        throw new Error(`Redirect (${res.status}) missing Location header`);
      }
      const nextUrl = new URL(location, currentUrl).toString();
      currentUrl = (await assertSafePublicUrl(nextUrl)).toString();
      continue;
    }

    return { response: res, finalUrl: currentUrl };
  }

  throw new Error('Too many redirects');
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  const httpServer = http.createServer(app);

  // Same-origin playlist text proxy (for M3U / PLS / RSS / JSON blocked by CORS)
  app.get('/api/playlist-proxy', async (req: Request, res: Response) => {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
    if (!rawUrl) {
      res.status(400).json({ error: 'Missing url parameter' });
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    req.on('close', () => {
      controller.abort();
    });

    try {
      const { response: upstream } = await fetchWithSafeRedirects(rawUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': CHROME_UA,
          Accept: 'audio/x-mpegurl, application/vnd.apple.mpegurl, audio/x-scpls, application/json, application/rss+xml, application/xml, text/plain, */*',
        },
      });

      if (!upstream.ok) {
        void upstream.body?.cancel?.().catch(() => {});
        res.status(upstream.status).json({ error: `Upstream HTTP ${upstream.status}` });
        return;
      }

      const contentType = upstream.headers.get('content-type') || 'text/plain; charset=utf-8';
      const lowerType = contentType.toLowerCase();
      const isPlaylistMime =
        lowerType.includes('mpegurl') ||
        lowerType.includes('scpls') ||
        lowerType.includes('playlist');
      if (
        !isPlaylistMime &&
        (lowerType.startsWith('audio/') || lowerType.startsWith('video/'))
      ) {
        void upstream.body?.cancel?.().catch(() => {});
        res.setHeader('X-YRitmX-Proxy', '1');
        res.setHeader('X-YRitmX-Stream-Type', lowerType);
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json({ streamContentType: lowerType });
        return;
      }
      const reader = upstream.body?.getReader();
      if (!reader) {
        const text = await upstream.text();
        res.setHeader('Content-Type', contentType);
        res.setHeader('X-YRitmX-Proxy', '1');
        res.setHeader('Cache-Control', 'no-store');
        res.send(text.slice(0, MAX_PLAYLIST_BYTES));
        return;
      }

      const chunks: Uint8Array[] = [];
      let totalBytes = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.byteLength;
          if (totalBytes > MAX_PLAYLIST_BYTES) {
            void reader.cancel().catch(() => {});
            res.status(413).json({ error: 'Playlist payload too large' });
            return;
          }
          chunks.push(value);
        }
      }

      const buffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', contentType);
      res.setHeader('X-YRitmX-Proxy', '1');
      res.setHeader('Cache-Control', 'no-store');
      res.send(buffer);
    } catch (err) {
      if (!res.headersSent) {
        const message = err instanceof Error ? err.message : 'Proxy fetch failed';
        const status =
          message.includes('Invalid') ||
          message.includes('not allowed') ||
          message.includes('Unsupported')
            ? 400
            : 502;
        res.status(status).json({ error: message });
      }
    } finally {
      clearTimeout(timeoutId);
    }
  });

  // Same-origin radio Now Playing metadata extractor (reads ICY StreamTitle safely on server)
  app.get('/api/radio-metadata', async (req: Request, res: Response) => {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
    if (!rawUrl || rawUrl.length > 2048) {
      res.status(400).json({ error: 'Invalid url parameter' });
      return;
    }

    const now = Date.now();
    const cached = radioMetaCache.get(rawUrl);
    if (cached && cached.expiresAt > now) {
      res.setHeader('Cache-Control', 'no-store');
      res.json({
        title: cached.title,
        artist: cached.artist,
        stationName: cached.stationName,
      });
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    res.on('close', () => {
      if (!res.writableEnded) {
        controller.abort();
      }
    });

    const writeCache = (entry: Omit<CachedRadioMeta, 'expiresAt'>) => {
      if (radioMetaCache.size >= 150) {
        const firstKey = radioMetaCache.keys().next().value;
        if (firstKey) radioMetaCache.delete(firstKey);
      }
      radioMetaCache.set(rawUrl, {
        ...entry,
        expiresAt: Date.now() + RADIO_META_CACHE_TTL_MS,
      });
    };

    try {
      const { response: upstream } = await fetchWithSafeRedirects(rawUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': CHROME_UA,
          'Icy-MetaData': '1',
          Accept: '*/*',
        },
      });

      const rawStationName = upstream.headers.get('icy-name');
      const stationName = rawStationName ? cleanRadioTextFragment(rawStationName) || null : null;

      if (!upstream.ok || !upstream.body) {
        void upstream.body?.cancel?.().catch(() => {});
        res.setHeader('Cache-Control', 'no-store');
        res.json({ title: null, artist: null, stationName });
        return;
      }

      const contentType = (upstream.headers.get('content-type') || '').toLowerCase();
      const metaintRaw = upstream.headers.get('icy-metaint');
      const metaint = metaintRaw ? Number.parseInt(metaintRaw, 10) : 0;

      // Case 1: HLS playlist metadata (#EXTINF title)
      if (!metaint && contentType.includes('mpegurl')) {
        const reader = upstream.body.getReader();
        let bytesRead = 0;
        const chunks: Uint8Array[] = [];
        try {
          while (bytesRead < 32768) {
            const { done, value } = await reader.read();
            if (done || !value) break;
            chunks.push(value);
            bytesRead += value.byteLength;
          }
        } finally {
          void reader.cancel().catch(() => {});
        }
        const text = decodeIcyBytes(Buffer.concat(chunks));
        let title: string | null = null;
        let artist: string | null = null;
        for (const line of text.split(/\r?\n/)) {
          if (!line.startsWith('#EXTINF:')) continue;
          const commaIdx = line.indexOf(',');
          if (commaIdx === -1) continue;
          const candidate = line.slice(commaIdx + 1).trim();
          if (candidate && !/^no title$/i.test(candidate)) {
            const parsed = splitRadioStreamTitle(candidate, stationName);
            if (parsed.title) {
              title = parsed.title;
              artist = parsed.artist;
              break;
            }
          }
        }
        writeCache({ title, artist, stationName });
        res.setHeader('Cache-Control', 'no-store');
        res.json({ title, artist, stationName });
        return;
      }

      // Case 2: Standard ICY stream without icy-metaint header
      if (!Number.isFinite(metaint) || metaint <= 0 || metaint > 262144) {
        void upstream.body.cancel().catch(() => {});
        writeCache({ title: null, artist: null, stationName });
        res.setHeader('Cache-Control', 'no-store');
        res.json({ title: null, artist: null, stationName });
        return;
      }

      // Case 3: Read ICY audio+metadata frame (up to 2 blocks when interval is small)
      const reader = upstream.body.getReader();
      let buffer: Uint8Array<ArrayBufferLike> = new Uint8Array(0);
      let totalRead = 0;
      let blocksChecked = 0;
      const maxBlocks = metaint <= 32768 ? 2 : 1;
      let parsedTitle: string | null = null;
      let parsedArtist: string | null = null;

      try {
        while (blocksChecked < maxBlocks && totalRead < RADIO_META_MAX_BYTES) {
          // Ensure we have metaint audio bytes + 1 length byte
          while (buffer.length <= metaint) {
            if (totalRead >= RADIO_META_MAX_BYTES) break;
            const { done, value } = await reader.read();
            if (done || !value) break;
            totalRead += value.byteLength;
            buffer = concatUint8Arrays(buffer, value);
          }

          if (buffer.length <= metaint) break;

          const metaLen = buffer[metaint] * 16;
          const blockEnd = metaint + 1 + metaLen;

          while (buffer.length < blockEnd) {
            if (totalRead >= RADIO_META_MAX_BYTES) break;
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
              parsedTitle = extracted.title;
              parsedArtist = extracted.artist;
              break;
            }
          }

          blocksChecked += 1;
          buffer = buffer.subarray(blockEnd);
        }
      } finally {
        void reader.cancel().catch(() => {});
      }

      writeCache({ title: parsedTitle, artist: parsedArtist, stationName });
      res.setHeader('Cache-Control', 'no-store');
      res.json({ title: parsedTitle, artist: parsedArtist, stationName });
    } catch {
      if (!res.headersSent) {
        res.setHeader('Cache-Control', 'no-store');
        res.json({ title: null, artist: null, stationName: null });
      }
    } finally {
      clearTimeout(timeoutId);
    }
  });

  // Same-origin radio / audio stream proxy (enables HTTP->HTTPS bridging, CORS & WebAudio EQ)
  app.get('/api/radio-proxy', async (req: Request, res: Response) => {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
    if (!rawUrl) {
      res.status(400).json({ error: 'Missing url parameter' });
      return;
    }

    const controller = new AbortController();
    let clientClosed = false;
    req.on('close', () => {
      clientClosed = true;
      controller.abort();
    });

    const connectTimeout = setTimeout(() => {
      if (!res.headersSent) {
        controller.abort();
      }
    }, 15000);

    try {
      const headers: Record<string, string> = {
        'User-Agent': CHROME_UA,
        Accept: '*/*',
      };
      if (typeof req.headers.range === 'string' && /^bytes=\d*-\d*$/i.test(req.headers.range)) {
        headers.Range = req.headers.range;
      }

      const { response: upstream } = await fetchWithSafeRedirects(rawUrl, {
        signal: controller.signal,
        headers,
      });

      clearTimeout(connectTimeout);

      if (!upstream.ok || !upstream.body) {
        void upstream.body?.cancel?.().catch(() => {});
        if (!res.headersSent) {
          res.status(upstream.status || 502).end();
        }
        return;
      }

      const upstreamType = (upstream.headers.get('content-type') || '').toLowerCase();
      if (upstreamType.includes('text/html')) {
        void upstream.body.cancel().catch(() => {});
        if (!res.headersSent) {
          res.status(502).json({ error: 'Upstream returned HTML instead of audio stream' });
        }
        return;
      }

      res.status(upstream.status);
      res.setHeader('Content-Type', upstreamType || 'audio/mpeg');
      res.setHeader('Cache-Control', 'no-store, no-cache');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('X-YRitmX-Proxy', '1');

      const passthroughHeaders = ['content-length', 'content-range', 'accept-ranges'];
      for (const h of passthroughHeaders) {
        const val = upstream.headers.get(h);
        if (val) res.setHeader(h, val);
      }

      const nodeStream = Readable.fromWeb(upstream.body as unknown as NodeWebReadableStream);
      nodeStream.on('error', () => {
        if (!res.writableEnded) {
          res.end();
        }
      });
      res.on('close', () => {
        nodeStream.destroy();
      });

      if (!clientClosed) {
        nodeStream.pipe(res);
      } else {
        nodeStream.destroy();
      }
    } catch {
      clearTimeout(connectTimeout);
      if (!res.headersSent && !clientClosed) {
        res.status(502).end();
      }
    }
  });

  const distDir = path.resolve(process.cwd(), 'dist');
  const distIndex = path.join(distDir, 'index.html');
  const useProdStatic =
    process.env.YRITMX_DEV !== '1' &&
    (process.env.NODE_ENV === 'production' || fs.existsSync(distIndex));

  if (useProdStatic) {
    app.use(express.static(distDir));
    app.get(/.*/, (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(distIndex);
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        ws: { server: httpServer },
        hmr: process.env.DISABLE_HMR === 'true' ? false : true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`YRitmX server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
