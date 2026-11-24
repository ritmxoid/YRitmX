import { extractShortRadioName, findDefaultFmStationByUrl } from '../constants/radioStations';
import { DEFAULT_COVER_IMAGE } from '../constants/visualizer';
import { getTranslations } from '../i18n/translations';
import { Track } from '../types/audio';
import { fetchAudiusProfileTracks } from './audiusApi';

const AUDIO_EXT_RE = /\.(mp3|wav|flac|ogg|m4a|aac|aacp|opus|mp2)(\?.*)?$/i;
const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;
const NON_STREAM_DOC_EXT_RE =
  /\.(html?|php|asp|aspx|jsp|json|xml|rss|txt|m3u8?|pls)(\?.*)?$/i;
const RADIO_STREAM_PATH_RE =
  /(?:[-_](?:32|48|56|64|80|96|112|128|160|192|224|256|320)[-_](?:mp3|aac|aacp|ogg|opus|flac|m4a)|(?:mp3|aac|aacp|ogg|opus|flac)[-_](?:32|48|56|64|80|96|112|128|160|192|224|256|320)|\/(?:stream|listen|radio|live|mp3|aac|aacp|ogg|opus|flac)(?:\/\d*)?|\/;[^/?#]*)$/i;
const RADIO_HOST_RE =
  /(^|\.)(somafm\.com|musicradio\.com|streamguys\d*\.com|181fm\.com|hostingradio\.ru|streamtheworld\.com|radiorecord\.ru|zaycev\.fm|rmfstream\.pl|smcdn\.pl|swr\.de|rfm\.fr|unitedradio\.it|bauermedia\.pt|powerapp\.com\.tr|torontocast\.com|vibesounds\.in|zhanafm\.kz|radioca\.st|zeno\.fm|radiojar\.com|radioking\.com|myradio24\.|uber\.radio|icecast|shoutcast|radiostream)/i;

function isLikelyDirectAudioStreamUrl(parsedUrl: URL): boolean {
  if (NON_STREAM_DOC_EXT_RE.test(parsedUrl.pathname)) return false;
  if (RADIO_STREAM_PATH_RE.test(parsedUrl.pathname)) return true;
  if (RADIO_HOST_RE.test(parsedUrl.hostname)) return true;
  if (parsedUrl.port && parsedUrl.port !== '80' && parsedUrl.port !== '443') return true;
  return false;
}

function buildRadioStreamResult(normalizedUrl: string, parsedUrl: URL): {
  tracks: Track[];
  label: string;
  normalizedUrl: string;
} {
  const t = getTranslations();
  const shortName = extractShortRadioName(normalizedUrl);
  const track: Track = {
    id: `url-stream-${normalizedUrl}`,
    title: shortName || t.radioFmLabel,
    artist: parsedUrl.hostname,
    cover: DEFAULT_COVER_IMAGE,
    src: normalizedUrl,
    sourceName: 'RadioFM',
    mediaType: 'audio',
    isRadio: true,
  };
  return {
    tracks: [track],
    label: shortName ? `${t.radioFmLabel}: ${shortName}` : t.radioFmLabel,
    normalizedUrl,
  };
}

function probeAudioElementPlayable(url: string): Promise<boolean> {
  if (typeof Audio === 'undefined') return Promise.resolve(false);
  return new Promise((resolve) => {
    const probe = new Audio();
    probe.preload = 'metadata';
    probe.muted = true;
    let settled = false;

    const cleanup = (result: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      probe.removeEventListener('loadedmetadata', onOk);
      probe.removeEventListener('canplay', onOk);
      probe.removeEventListener('error', onErr);
      try {
        probe.pause();
        probe.removeAttribute('src');
        probe.load();
      } catch {
        // ignore cleanup errors
      }
      resolve(result);
    };

    const onOk = () => cleanup(true);
    const onErr = () => cleanup(false);

    const timer = window.setTimeout(() => cleanup(false), 4500);
    probe.addEventListener('loadedmetadata', onOk);
    probe.addEventListener('canplay', onOk);
    probe.addEventListener('error', onErr);
    probe.src = url;
    try {
      probe.load();
    } catch {
      cleanup(false);
    }
  });
}

function titleFromUrl(url: string, fallbackIndex: number): string {
  const t = getTranslations();
  try {
    const pathname = new URL(url).pathname;
    const filename = decodeURIComponent(pathname.split('/').pop() || '');
    const cleaned = filename.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
    return cleaned || t.trackFallbackName(fallbackIndex + 1);
  } catch {
    return t.trackFallbackName(fallbackIndex + 1);
  }
}

function upgradeInsecureUrlIfNeeded(resolvedUrl: string, baseUrl?: string): string {
  try {
    const parsed = new URL(resolvedUrl);
    if (parsed.protocol !== 'http:') return resolvedUrl;
    if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
      return resolvedUrl;
    }
    const isLocalHost =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '[::1]';
    if (isLocalHost) return resolvedUrl;
    const pageIsHttps =
      typeof window !== 'undefined' && window.location?.protocol === 'https:';
    const baseIsHttps = Boolean(baseUrl && /^https:/i.test(baseUrl));
    if (pageIsHttps || baseIsHttps) {
      parsed.protocol = 'https:';
      return parsed.toString();
    }
  } catch {
    // ignore invalid URLs
  }
  return resolvedUrl;
}

function parseM3uPlaylist(text: string, baseUrl: string): Track[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const tracks: Track[] = [];
  let pendingTitle = '';
  let pendingArtist = '';
  let lastRadioTitle = '';
  let lastRadioArtist = '';
  let lastRadioPath = '';

  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith('#EXTINF:')) {
      const commaIdx = line.indexOf(',');
      if (commaIdx !== -1) {
        const meta = line.slice(commaIdx + 1).trim();
        const dashParts = meta.split(' - ');
        if (dashParts.length >= 2) {
          pendingArtist = dashParts[0].trim();
          pendingTitle = dashParts.slice(1).join(' - ').trim();
        } else {
          pendingTitle = meta;
        }
      }
      continue;
    }
    if (line.startsWith('#')) continue;

    try {
      const resolved = upgradeInsecureUrlIfNeeded(new URL(line, baseUrl).toString(), baseUrl);
      const parsedEntry = new URL(resolved);
      const isRadioEntry = isLikelyDirectAudioStreamUrl(parsedEntry);
      const sameMirrorPath = Boolean(
        isRadioEntry && lastRadioPath && parsedEntry.pathname === lastRadioPath
      );
      const entryTitle = isRadioEntry
        ? extractShortRadioName(resolved, pendingTitle) ||
          (sameMirrorPath && lastRadioTitle) ||
          'RadioFM'
        : pendingTitle || titleFromUrl(resolved, tracks.length);
      const entryArtist =
        pendingArtist ||
        (isRadioEntry && sameMirrorPath && lastRadioArtist) ||
        parsedEntry.hostname;

      if (isRadioEntry) {
        if (entryTitle && entryTitle !== 'RadioFM') lastRadioTitle = entryTitle;
        if (pendingArtist) lastRadioArtist = pendingArtist;
        lastRadioPath = parsedEntry.pathname;
      } else {
        lastRadioTitle = '';
        lastRadioArtist = '';
        lastRadioPath = '';
      }

      tracks.push({
        id: `url-m3u-${tracks.length}-${resolved}`,
        title: entryTitle,
        artist: entryArtist,
        cover: DEFAULT_COVER_IMAGE,
        src: resolved,
        sourceName: isRadioEntry ? 'RadioFM' : `URL: ${new URL(baseUrl).hostname}`,
        ...(isRadioEntry ? { mediaType: 'audio' as const, isRadio: true } : {}),
      });
    } catch {
      // skip invalid url line
    }
    pendingTitle = '';
    pendingArtist = '';
  }

  return tracks;
}

function parsePlsPlaylist(text: string, baseUrl: string): Track[] {
  const entries = new Map<string, { file?: string; title?: string }>();
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    const match = line.match(/^(File|Title)(\d+)\s*=\s*(.+)$/i);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const idx = match[2];
    const val = match[3].trim();
    const item = entries.get(idx) ?? {};
    if (key === 'file') item.file = val;
    else item.title = val;
    entries.set(idx, item);
  }

  const host = new URL(baseUrl).hostname;
  const tracks: Track[] = [];
  for (const [, entry] of entries) {
    if (!entry.file) continue;
    try {
      const resolved = upgradeInsecureUrlIfNeeded(new URL(entry.file, baseUrl).toString(), baseUrl);
      const shortName = extractShortRadioName(resolved, entry.title);
      tracks.push({
        id: `url-pls-${tracks.length}-${resolved}`,
        title: shortName || 'RadioFM',
        artist: host,
        cover: DEFAULT_COVER_IMAGE,
        src: resolved,
        sourceName: 'RadioFM',
        mediaType: 'audio',
        isRadio: true,
      });
    } catch {
      // skip invalid url entry
    }
  }
  return tracks;
}

function parseRssFeed(xmlText: string, baseUrl: string): Track[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const channelTitle =
    doc.querySelector('channel > title')?.textContent?.trim() || new URL(baseUrl).hostname;
  const channelImage =
    doc.querySelector('channel > image > url')?.textContent?.trim() ||
    doc.querySelector('itunes\\:image')?.getAttribute('href') ||
    DEFAULT_COVER_IMAGE;

  const items = Array.from(doc.querySelectorAll('item'));
  const tracks: Track[] = [];

  for (const item of items) {
    const enclosure = item.querySelector('enclosure[url]');
    const rawUrl = enclosure?.getAttribute('url');
    if (!rawUrl) continue;
    const itemTitle = item.querySelector('title')?.textContent?.trim();
    const itemAuthor =
      item.querySelector('itunes\\:author, author')?.textContent?.trim() || channelTitle;
    const itemImage =
      item.querySelector('itunes\\:image')?.getAttribute('href') || channelImage;

    const safeUrl = upgradeInsecureUrlIfNeeded(new URL(rawUrl, baseUrl).toString(), baseUrl);

    tracks.push({
      id: `url-rss-${tracks.length}-${safeUrl}`,
      title: itemTitle || titleFromUrl(safeUrl, tracks.length),
      artist: itemAuthor,
      cover: itemImage || DEFAULT_COVER_IMAGE,
      src: safeUrl,
      sourceName: `RSS: ${channelTitle}`,
    });
  }

  return tracks;
}

interface RawJsonTrack {
  title?: string;
  name?: string;
  artist?: string;
  author?: string;
  url?: string;
  src?: string;
  stream?: string;
  file?: string;
  cover?: string;
  artwork?: string;
  image?: string;
}

function parseJsonPlaylist(data: unknown, baseUrl: string): Track[] {
  let list: unknown[] = [];
  if (Array.isArray(data)) {
    list = data;
  } else if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.tracks)) list = obj.tracks;
    else if (Array.isArray(obj.data)) list = obj.data;
    else if (Array.isArray(obj.items)) list = obj.items;
    else if (Array.isArray(obj.songs)) list = obj.songs;
  }

  const host = new URL(baseUrl).hostname;
  const tracks: Track[] = [];

  for (const entry of list) {
    if (typeof entry === 'string') {
      const resolved = upgradeInsecureUrlIfNeeded(new URL(entry, baseUrl).toString(), baseUrl);
      tracks.push({
        id: `url-json-${tracks.length}-${resolved}`,
        title: titleFromUrl(resolved, tracks.length),
        artist: host,
        cover: DEFAULT_COVER_IMAGE,
        src: resolved,
        sourceName: `JSON: ${host}`,
      });
    } else if (entry && typeof entry === 'object') {
      const item = entry as RawJsonTrack;
      const rawSrc = item.src || item.url || item.stream || item.file;
      if (!rawSrc || typeof rawSrc !== 'string') continue;
      const resolved = upgradeInsecureUrlIfNeeded(new URL(rawSrc, baseUrl).toString(), baseUrl);
      tracks.push({
        id: `url-json-${tracks.length}-${resolved}`,
        title: item.title || item.name || titleFromUrl(resolved, tracks.length),
        artist: item.artist || item.author || host,
        cover: item.cover || item.artwork || item.image || DEFAULT_COVER_IMAGE,
        src: resolved,
        sourceName: `JSON: ${host}`,
      });
    }
  }

  return tracks;
}

async function fetchGitHubAudioRepo(parsedUrl: URL): Promise<{ tracks: Track[]; label: string }> {
  const t = getTranslations();
  const parts = parsedUrl.pathname.split('/').filter(Boolean);
  if (parts.length < 2) {
    throw new Error(t.errGitHubUrlFormat);
  }
  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/, '');
  let branch = '';
  let subPath = '';

  if (parts[2] === 'tree' && parts.length >= 4) {
    branch = parts[3];
    subPath = parts.slice(4).join('/');
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${subPath}${
    branch ? `?ref=${encodeURIComponent(branch)}` : ''
  }`;

  const res = await fetch(apiUrl);
  if (!res.ok) {
    throw new Error(t.errGitHubOpen(res.status));
  }
  const entries = (await res.json()) as Array<{
    name: string;
    type: string;
    download_url: string | null;
    path: string;
  }>;

  if (!Array.isArray(entries)) {
    throw new Error(t.errGitHubNotFolder);
  }

  const tracks: Track[] = [];
  let coverUrl = DEFAULT_COVER_IMAGE;

  const coverFile = entries.find(
    (e) => e.type === 'file' && /^(cover|folder|front|artwork)\.(jpg|jpeg|png|webp)$/i.test(e.name)
  );
  if (coverFile?.download_url) {
    coverUrl = coverFile.download_url;
  }

  for (const item of entries) {
    if (item.type === 'file' && item.download_url && AUDIO_EXT_RE.test(item.name)) {
      tracks.push({
        id: `gh-${owner}-${repo}-${item.path}`,
        title: item.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '),
        artist: `${owner}/${repo}`,
        cover: coverUrl,
        src: item.download_url,
        sourceName: `GitHub: ${owner}/${repo}`,
      });
    }
  }

  if (tracks.length === 0) {
    throw new Error(t.errGitHubNoAudio(`${owner}/${repo}${subPath ? '/' + subPath : ''}`));
  }

  return {
    tracks,
    label: subPath ? `GitHub: ${owner}/${repo}/${subPath}` : `GitHub: ${owner}/${repo}`,
  };
}

async function fetchInternetArchiveCollection(identifier: string): Promise<{ tracks: Track[]; label: string }> {
  const t = getTranslations();
  const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}`);
  if (!res.ok) {
    throw new Error(t.errArchiveLoad(res.status));
  }
  const data = (await res.json()) as {
    metadata?: { title?: string; creator?: string };
    files?: Array<{ name: string; title?: string; artist?: string; length?: string }>;
  };

  const files = data.files ?? [];
  const audioFiles = files.filter((f) => AUDIO_EXT_RE.test(f.name));
  if (audioFiles.length === 0) {
    throw new Error(t.errArchiveNoAudio);
  }

  const albumTitle = data.metadata?.title || identifier;
  const albumCreator = data.metadata?.creator || 'Internet Archive';
  const coverEntry = files.find((f) => /\.(jpg|jpeg|png)$/i.test(f.name));
  const coverUrl = coverEntry
    ? `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(coverEntry.name)}`
    : DEFAULT_COVER_IMAGE;

  const tracks: Track[] = audioFiles.map((f, idx) => ({
    id: `ia-${identifier}-${idx}-${f.name}`,
    title: f.title || f.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '),
    artist: f.artist || albumCreator,
    cover: coverUrl,
    src: `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(f.name)}`,
    sourceName: `Archive.org: ${albumTitle}`,
  }));

  return { tracks, label: `Archive: ${albumTitle}` };
}

export async function loadTracksFromUrlSource(rawInput: string): Promise<{
  tracks: Track[];
  label: string;
  normalizedUrl: string;
}> {
  const t = getTranslations();
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error(t.errEnterUrl);
  }

  // Support multi-line direct MP3 URLs pasted at once
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length > 1 && lines.every((l) => /^https?:\/\//i.test(l))) {
    const tracks: Track[] = lines.map((line, idx) => {
      const safeLine = upgradeInsecureUrlIfNeeded(line);
      const parsedLine = new URL(safeLine);
      const isRadioLine = isLikelyDirectAudioStreamUrl(parsedLine);
      return {
        id: `url-direct-${idx}-${safeLine}`,
        title: isRadioLine ? (extractShortRadioName(safeLine) || t.radioFmLabel) : titleFromUrl(safeLine, idx),
        artist: parsedLine.hostname,
        cover: DEFAULT_COVER_IMAGE,
        src: safeLine,
        sourceName: isRadioLine ? 'RadioFM' : t.urlListSourceName,
        ...(isRadioLine ? { mediaType: 'audio' as const, isRadio: true } : {}),
      };
    });
    return {
      tracks,
      label: t.urlListLabel(tracks.length),
      normalizedUrl: trimmed,
    };
  }

  let parsedUrl: URL;
  try {
    const rawWithProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    parsedUrl = new URL(rawWithProto);
  } catch {
    throw new Error(t.errInvalidUrl);
  }

  const normalizedUrl = parsedUrl.toString();

  // 1. Audius profile URL (e.g. https://audius.co/RitmXoid)
  if (parsedUrl.hostname === 'audius.co' || parsedUrl.hostname.endsWith('.audius.co')) {
    const seg = parsedUrl.pathname.split('/').filter(Boolean)[0];
    if (!seg) throw new Error(t.errAudiusUrlExample);
    const { tracks, resolvedHandle } = await fetchAudiusProfileTracks(seg);
    return {
      tracks,
      label: `Audius: @${resolvedHandle}`,
      normalizedUrl,
    };
  }

  // 2. GitHub Repository / Folder URL
  if (parsedUrl.hostname === 'github.com') {
    const { tracks, label } = await fetchGitHubAudioRepo(parsedUrl);
    return { tracks, label, normalizedUrl };
  }

  // 3. Internet Archive URL
  if (parsedUrl.hostname.includes('archive.org')) {
    const parts = parsedUrl.pathname.split('/').filter(Boolean);
    const detailsIdx = parts.findIndex((p) => p === 'details' || p === 'download');
    const identifier = detailsIdx !== -1 ? parts[detailsIdx + 1] : parts[0];
    if (identifier) {
      const { tracks, label } = await fetchInternetArchiveCollection(identifier);
      return { tracks, label, normalizedUrl };
    }
  }

  // 4. Direct audio, video, or Icecast/Shoutcast radio stream URL
  if (AUDIO_EXT_RE.test(parsedUrl.pathname) || VIDEO_EXT_RE.test(parsedUrl.pathname)) {
    const isVideo = VIDEO_EXT_RE.test(parsedUrl.pathname);
    const isRadioFile =
      !isVideo &&
      (Boolean(findDefaultFmStationByUrl(normalizedUrl)) || RADIO_HOST_RE.test(parsedUrl.hostname));
    const radioShort = isRadioFile ? extractShortRadioName(normalizedUrl) : '';
    const track: Track = {
      id: `url-file-${normalizedUrl}`,
      title: isRadioFile ? (radioShort || t.radioFmLabel) : titleFromUrl(normalizedUrl, 0),
      artist: parsedUrl.hostname,
      cover: DEFAULT_COVER_IMAGE,
      src: normalizedUrl,
      sourceName: isRadioFile ? 'RadioFM' : `URL: ${parsedUrl.hostname}`,
      mediaType: isVideo ? 'video' : 'audio',
      isRadio: isRadioFile,
    };
    return {
      tracks: [track],
      label: isRadioFile ? (radioShort ? `${t.radioFmLabel}: ${radioShort}` : t.radioFmLabel) : track.title,
      normalizedUrl,
    };
  }

  if (isLikelyDirectAudioStreamUrl(parsedUrl)) {
    return buildRadioStreamResult(normalizedUrl, parsedUrl);
  }

  // 5. Try fetching JSON / M3U / PLS / RSS / HTML index from URL (with server proxy fallback)
  const tryProxyFetch = async (): Promise<
    | { kind: 'response'; response: Response }
    | { kind: 'stream'; streamType: string }
    | null
  > => {
    try {
      const proxyRes = await fetch(
        `/api/playlist-proxy?url=${encodeURIComponent(normalizedUrl)}`
      );
      if (proxyRes.headers.get('X-YRitmX-Proxy') !== '1') {
        return null;
      }
      const streamType = proxyRes.headers.get('X-YRitmX-Stream-Type');
      if (streamType) {
        return { kind: 'stream', streamType };
      }
      return { kind: 'response', response: proxyRes };
    } catch {
      return null;
    }
  };

  let res: Response | null = null;
  let directFetchFailed = false;
  try {
    res = await fetch(normalizedUrl);
  } catch {
    directFetchFailed = true;
  }

  if (directFetchFailed || (res && !res.ok)) {
    const proxied = await tryProxyFetch();
    if (proxied?.kind === 'stream') {
      const isAudioRadio = proxied.streamType.startsWith('audio/');
      if (isAudioRadio) {
        return buildRadioStreamResult(normalizedUrl, parsedUrl);
      }
      const track: Track = {
        id: `url-stream-${normalizedUrl}`,
        title: titleFromUrl(normalizedUrl, 0),
        artist: parsedUrl.hostname,
        cover: DEFAULT_COVER_IMAGE,
        src: normalizedUrl,
        sourceName: `${t.urlStreamPrefix}: ${parsedUrl.hostname}`,
        mediaType: 'video',
      };
      return { tracks: [track], label: track.title, normalizedUrl };
    }
    if (proxied?.kind === 'response' && proxied.response.ok) {
      res = proxied.response;
      directFetchFailed = false;
    }
  }

  if (directFetchFailed || !res) {
    if (!NON_STREAM_DOC_EXT_RE.test(parsedUrl.pathname)) {
      const playable = await probeAudioElementPlayable(normalizedUrl);
      if (playable) {
        return buildRadioStreamResult(normalizedUrl, parsedUrl);
      }
    }
    throw new Error(t.errCorsBlocked);
  }

  if (!res.ok) {
    if (
      (res.status === 403 || res.status === 405) &&
      !NON_STREAM_DOC_EXT_RE.test(parsedUrl.pathname)
    ) {
      const playable = await probeAudioElementPlayable(normalizedUrl);
      if (playable) {
        return buildRadioStreamResult(normalizedUrl, parsedUrl);
      }
    }
    throw new Error(t.errSourceStatus(res.status));
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  const isPlaylistDoc =
    NON_STREAM_DOC_EXT_RE.test(parsedUrl.pathname) ||
    contentType.includes('mpegurl') ||
    contentType.includes('scpls') ||
    contentType.includes('playlist');

  if (!isPlaylistDoc && (contentType.startsWith('audio/') || contentType.startsWith('video/'))) {
    void res.body?.cancel?.().catch(() => {});
    const isAudioRadio = contentType.startsWith('audio/');
    const radioShort = isAudioRadio ? extractShortRadioName(normalizedUrl) : '';
    const track: Track = {
      id: `url-stream-${normalizedUrl}`,
      title: isAudioRadio ? (radioShort || t.radioFmLabel) : titleFromUrl(normalizedUrl, 0),
      artist: parsedUrl.hostname,
      cover: DEFAULT_COVER_IMAGE,
      src: normalizedUrl,
      sourceName: isAudioRadio ? 'RadioFM' : `${t.urlStreamPrefix}: ${parsedUrl.hostname}`,
      mediaType: isAudioRadio ? 'audio' : 'video',
      isRadio: isAudioRadio,
    };
    return {
      tracks: [track],
      label: isAudioRadio
        ? (radioShort ? `${t.radioFmLabel}: ${radioShort}` : t.radioFmLabel)
        : track.title,
      normalizedUrl,
    };
  }

  const bodyText = await res.text();

  if (contentType.includes('json') || bodyText.trim().startsWith('{') || bodyText.trim().startsWith('[')) {
    const json = JSON.parse(bodyText) as unknown;
    const tracks = parseJsonPlaylist(json, normalizedUrl);
    if (tracks.length === 0) {
      throw new Error(t.errJsonNoTracks);
    }
    return { tracks, label: `JSON: ${parsedUrl.hostname}`, normalizedUrl };
  }

  if (
    parsedUrl.pathname.toLowerCase().endsWith('.pls') ||
    contentType.includes('x-scpls') ||
    /^\[playlist\]/im.test(bodyText.trim())
  ) {
    const tracks = parsePlsPlaylist(bodyText, normalizedUrl);
    if (tracks.length === 0) {
      throw new Error(t.errM3uNoTracks);
    }
    const shortPls = extractShortRadioName(normalizedUrl, tracks[0]?.title);
    return {
      tracks,
      label: shortPls ? `${t.radioFmLabel}: ${shortPls}` : t.radioFmLabel,
      normalizedUrl,
    };
  }

  if (
    parsedUrl.pathname.endsWith('.m3u') ||
    parsedUrl.pathname.endsWith('.m3u8') ||
    bodyText.includes('#EXTM3U')
  ) {
    const tracks = parseM3uPlaylist(bodyText, normalizedUrl);
    if (tracks.length === 0) {
      throw new Error(t.errM3uNoTracks);
    }
    const allRadio = tracks.every((tr) => tr.isRadio);
    const shortM3u = allRadio ? extractShortRadioName(normalizedUrl, tracks[0]?.title) : '';
    const radioLabel = allRadio
      ? (shortM3u ? `${t.radioFmLabel}: ${shortM3u}` : t.radioFmLabel)
      : `${t.playlistTitle}: ${parsedUrl.hostname}`;
    return { tracks, label: radioLabel, normalizedUrl };
  }

  if (contentType.includes('xml') || bodyText.includes('<rss') || bodyText.includes('<enclosure')) {
    const tracks = parseRssFeed(bodyText, normalizedUrl);
    if (tracks.length === 0) {
      throw new Error(t.errRssNoTracks);
    }
    return { tracks, label: tracks[0].sourceName, normalizedUrl };
  }

  // Fallback: extract audio href links from HTML directory listing
  const doc = new DOMParser().parseFromString(bodyText, 'text/html');
  const links = Array.from(doc.querySelectorAll('a[href]'))
    .map((a) => a.getAttribute('href') || '')
    .filter((href) => AUDIO_EXT_RE.test(href));

  if (links.length > 0) {
    const tracks: Track[] = links.map((href, idx) => {
      const resolved = upgradeInsecureUrlIfNeeded(
        new URL(href, normalizedUrl).toString(),
        normalizedUrl
      );
      return {
        id: `url-dir-${idx}-${resolved}`,
        title: titleFromUrl(resolved, idx),
        artist: parsedUrl.hostname,
        cover: DEFAULT_COVER_IMAGE,
        src: resolved,
        sourceName: `${t.urlDirPrefix}: ${parsedUrl.hostname}`,
      };
    });
    return { tracks, label: `${t.urlDirPrefix}: ${parsedUrl.hostname}`, normalizedUrl };
  }

  throw new Error(t.errUrlNoAudio);
}
