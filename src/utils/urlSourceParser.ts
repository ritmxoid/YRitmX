import { DEFAULT_COVER_IMAGE } from '../constants/visualizer';
import { getTranslations } from '../i18n/translations';
import { Track } from '../types/audio';
import { fetchAudiusProfileTracks } from './audiusApi';

const AUDIO_EXT_RE = /\.(mp3|wav|flac|ogg|m4a|aac|opus)(\?.*)?$/i;

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

  // 4. Direct audio file URL
  if (AUDIO_EXT_RE.test(parsedUrl.pathname)) {
    const track: Track = {
      id: `url-file-${normalizedUrl}`,
      title: titleFromUrl(normalizedUrl, 0),
      artist: parsedUrl.hostname,
      cover: DEFAULT_COVER_IMAGE,
      src: normalizedUrl,
      sourceName: `URL: ${parsedUrl.hostname}`,
    };
    return {
      tracks: [track],
      label: track.title,
      normalizedUrl,
    };
  }

  // 5. Try fetching JSON / M3U / RSS / HTML index from URL
  let res: Response;
  try {
    res = await fetch(normalizedUrl);
  } catch {
    throw new Error(t.errCorsBlocked);
  }

  if (!res.ok) {
    throw new Error(t.errSourceStatus(res.status));
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();

  if (contentType.startsWith('audio/')) {
    const track: Track = {
      id: `url-stream-${normalizedUrl}`,
      title: titleFromUrl(normalizedUrl, 0),
      artist: parsedUrl.hostname,
      cover: DEFAULT_COVER_IMAGE,
      src: normalizedUrl,
      sourceName: `${t.urlStreamPrefix}: ${parsedUrl.hostname}`,
    };
    return { tracks: [track], label: track.title, normalizedUrl };
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
