import { DEFAULT_COVER_IMAGE } from '../constants/visualizer';
import { getTranslations } from '../i18n/translations';
import { Track } from '../types/audio';
import { fetchAudiusProfileTracks } from './audiusApi';

const AUDIO_EXT_RE = /\.(mp3|wav|flac|ogg|m4a|aac|opus)(\?.*)?$/i;
const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;
const NON_STREAM_DOC_EXT_RE =
  /\.(html?|php|asp|aspx|jsp|json|xml|rss|txt|m3u8?|pls)(\?.*)?$/i;
const RADIO_STREAM_PATH_RE =
  /(?:[-_](?:32|48|56|64|80|96|112|128|160|192|224|256|320)[-_](?:mp3|aac|aacp|ogg|opus|flac|m4a)|\/(?:stream|listen|radio|live|mp3|aac|aacp|ogg|opus)(?:\/\d*)?|\/;[^/?#]*)$/i;
const RADIO_HOST_RE = /(^|\.)(somafm\.com|musicradio\.com|streamguys\d*\.com|icecast|shoutcast|radiostream)/i;

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
  const track: Track = {
    id: `url-stream-${normalizedUrl}`,
    title: 'RadioFM',
    artist: parsedUrl.hostname,
    cover: DEFAULT_COVER_IMAGE,
    src: normalizedUrl,
    sourceName: 'RadioFM',
    mediaType: 'audio',
    isRadio: true,
  };
  return {
    tracks: [track],
    label: `RadioFM: ${parsedUrl.hostname}`,
    normalizedUrl,
  };
}

function probeAudioElementPlayable(url: string): Promise<boolean> {
  if (typeof Audio === 'undefined') return Promise.resolve(false);
  return new Promise((resolve) => {
    const probe = new Audio();
    probe.crossOrigin = 'anonymous';
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

function parseM3uPlaylist(text: string, baseUrl: string): Track[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const tracks: Track[] = [];
  let pendingTitle = '';
  let pendingArtist = '';

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
      const resolved = new URL(line, baseUrl).toString();
      tracks.push({
        id: `url-m3u-${tracks.length}-${resolved}`,
        title: pendingTitle || titleFromUrl(resolved, tracks.length),
        artist: pendingArtist || new URL(baseUrl).hostname,
        cover: DEFAULT_COVER_IMAGE,
        src: resolved,
        sourceName: `URL: ${new URL(baseUrl).hostname}`,
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
      const resolved = new URL(entry.file, baseUrl).toString();
      tracks.push({
        id: `url-pls-${tracks.length}-${resolved}`,
        title: entry.title || 'RadioFM',
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

    tracks.push({
      id: `url-rss-${tracks.length}-${rawUrl}`,
      title: itemTitle || titleFromUrl(rawUrl, tracks.length),
      artist: itemAuthor,
      cover: itemImage || DEFAULT_COVER_IMAGE,
      src: rawUrl,
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
      const resolved = new URL(entry, baseUrl).toString();
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
      const resolved = new URL(rawSrc, baseUrl).toString();
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
    const tracks: Track[] = lines.map((line, idx) => ({
      id: `url-direct-${idx}-${line}`,
      title: titleFromUrl(line, idx),
      artist: new URL(line).hostname,
      cover: DEFAULT_COVER_IMAGE,
      src: line,
      sourceName: t.urlListSourceName,
    }));
    return {
      tracks,
      label: t.urlListLabel(tracks.length),
      normalizedUrl: trimmed,
    };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
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
    const isRadioFile = !isVideo && RADIO_HOST_RE.test(parsedUrl.hostname);
    const track: Track = {
      id: `url-file-${normalizedUrl}`,
      title: isRadioFile ? 'RadioFM' : titleFromUrl(normalizedUrl, 0),
      artist: parsedUrl.hostname,
      cover: DEFAULT_COVER_IMAGE,
      src: normalizedUrl,
      sourceName: isRadioFile ? 'RadioFM' : `URL: ${parsedUrl.hostname}`,
      mediaType: isVideo ? 'video' : 'audio',
      isRadio: isRadioFile,
    };
    return {
      tracks: [track],
      label: isRadioFile ? `RadioFM: ${parsedUrl.hostname}` : track.title,
      normalizedUrl,
    };
  }

  if (isLikelyDirectAudioStreamUrl(parsedUrl)) {
    return buildRadioStreamResult(normalizedUrl, parsedUrl);
  }

  // 5. Try fetching JSON / M3U / PLS / RSS / HTML index from URL
  let res: Response;
  try {
    res = await fetch(normalizedUrl);
  } catch {
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

  if (contentType.startsWith('audio/') || contentType.startsWith('video/')) {
    void res.body?.cancel?.().catch(() => {});
    const isAudioRadio = contentType.startsWith('audio/');
    const track: Track = {
      id: `url-stream-${normalizedUrl}`,
      title: isAudioRadio ? 'RadioFM' : titleFromUrl(normalizedUrl, 0),
      artist: parsedUrl.hostname,
      cover: DEFAULT_COVER_IMAGE,
      src: normalizedUrl,
      sourceName: isAudioRadio ? 'RadioFM' : `${t.urlStreamPrefix}: ${parsedUrl.hostname}`,
      mediaType: isAudioRadio ? 'audio' : 'video',
      isRadio: isAudioRadio,
    };
    return { tracks: [track], label: isAudioRadio ? 'RadioFM' : track.title, normalizedUrl };
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
    return { tracks, label: `RadioFM: ${parsedUrl.hostname}`, normalizedUrl };
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
    return { tracks, label: `${t.playlistTitle}: ${parsedUrl.hostname}`, normalizedUrl };
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
      const resolved = new URL(href, normalizedUrl).toString();
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
