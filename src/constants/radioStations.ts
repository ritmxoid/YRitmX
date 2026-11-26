import { getInitialLanguage, SupportedLang } from '../i18n/translations';

export interface DefaultFmStation {
  key: string;
  url: string;
  labels: Partial<Record<SupportedLang, string>> & { en: string };
}

export const DEFAULT_FM_STATIONS: DefaultFmStation[] = [
  {
    key: 'pop',
    url: 'https://listen.181fm.com/181-power_128k.mp3',
    labels: {
      ru: 'Поп',
      en: 'Pop',
      uk: 'Поп',
      es: 'Pop',
      fr: 'Pop',
      de: 'Pop',
      it: 'Pop',
      pt: 'Pop',
      zh: '流行',
      ja: 'ポップ',
      ko: '팝',
      tr: 'Pop',
      pl: 'Pop',
      ar: 'بوب',
      hi: 'पॉप',
      uz: 'Pop',
      kk: 'Поп',
    },
  },
  {
    key: 'country',
    url: 'https://listen.181fm.com/181-kickincountry_128k.mp3',
    labels: {
      ru: 'Кантри',
      en: 'Country',
      uk: 'Кантрі',
      es: 'Country',
      fr: 'Country',
      de: 'Country',
      it: 'Country',
      pt: 'Country',
      zh: '乡村',
      ja: 'カントリー',
      ko: '컨트리',
      tr: 'Country',
      pl: 'Country',
      ar: 'كانتري',
      hi: 'कंट्री',
      uz: 'Kantri',
      kk: 'Кантри',
    },
  },
  {
    key: 'dance',
    url: 'https://listen.181fm.com/181-energy98_128k.mp3',
    labels: {
      ru: 'Танцевальная',
      en: 'Dance',
      uk: 'Танцювальна',
      es: 'Dance',
      fr: 'Dance',
      de: 'Dance',
      it: 'Dance',
      pt: 'Dance',
      zh: '舞曲',
      ja: 'ダンス',
      ko: '댄스',
      tr: 'Dans',
      pl: 'Dance',
      ar: 'دانس',
      hi: 'डांस',
      uz: 'Raqs',
      kk: 'Би',
    },
  },
  {
    key: 'electronic',
    url: 'https://ice1.somafm.com/poptron-128-mp3',
    labels: {
      ru: 'Электронная',
      en: 'Electronic',
      uk: 'Електронна',
      es: 'Electrónica',
      fr: 'Électronique',
      de: 'Elektronisch',
      it: 'Elettronica',
      pt: 'Eletrônica',
      zh: '电子',
      ja: 'エレクトロニック',
      ko: '일렉트로닉',
      tr: 'Elektronik',
      pl: 'Elektroniczna',
      ar: 'إلكترونيك',
      hi: 'इलेक्ट्रॉनिक',
      uz: 'Elektron',
      kk: 'Электрондық',
    },
  },
  {
    key: 'classical',
    url: 'https://listen.181fm.com/181-classical_128k.mp3',
    labels: {
      ru: 'Классическая',
      en: 'Classical',
      uk: 'Класична',
      es: 'Clásica',
      fr: 'Classique',
      de: 'Klassik',
      it: 'Classica',
      pt: 'Clássica',
      zh: '古典',
      ja: 'クラシック',
      ko: '클래식',
      tr: 'Klasik',
      pl: 'Klasyczna',
      ar: 'كلاسيكي',
      hi: 'शास्त्रीय',
      uz: 'Klassik',
      kk: 'Классикалық',
    },
  },
  {
    key: 'indie',
    url: 'https://ice2.somafm.com/groovesalad-128-mp3',
    labels: {
      ru: 'Инди',
      en: 'Indie',
      uk: 'Інді',
      es: 'Indie',
      fr: 'Indie',
      de: 'Indie',
      it: 'Indie',
      pt: 'Indie',
      zh: '独立',
      ja: 'インディー',
      ko: '인디',
      tr: 'Indie',
      pl: 'Indie',
      ar: 'إندي',
      hi: 'इंडी',
      uz: 'Indi',
      kk: 'Инди',
    },
  },
  {
    key: 'work-bg',
    url: 'https://ice2.somafm.com/beatblender-128-mp3',
    labels: {
      ru: 'Для фона и работы',
      en: 'Focus & Chill',
      uk: 'Для фону та роботи',
      es: 'Para fondo y trabajo',
      fr: 'Ambiance & Travail',
      de: 'Fokus & Arbeit',
      it: 'Sfondo e lavoro',
      pt: 'Foco e trabalho',
      zh: '背景与工作',
      ja: '作業用BGM',
      ko: '배경 및 집중',
      tr: 'Odak ve Çalışma',
      pl: 'Tło i praca',
      ar: 'للعمل والتركيز',
      hi: 'काम और फोकस',
      uz: 'Fon va ish uchun',
      kk: 'Фон және жұмыс',
    },
  },
  {
    key: 'meditative',
    url: 'https://ice2.somafm.com/dronezone-128-mp3',
    labels: {
      ru: 'Медитативная релакс',
      en: 'Meditative Relax',
      uk: 'Медитативний релакс',
      es: 'Relajación meditativa',
      fr: 'Relaxation méditative',
      de: 'Meditation & Relax',
      it: 'Relax meditativo',
      pt: 'Relaxamento meditativo',
      zh: '冥想放松',
      ja: '瞑想リラックス',
      ko: '명상 릴랙스',
      tr: 'Meditasyon ve Rahatlama',
      pl: 'Medytacja i relaks',
      ar: 'استرخاء وتأمل',
      hi: 'ध्यान और विश्राम',
      uz: 'Meditativ relaks',
      kk: 'Медитациялық релакс',
    },
  },
  {
    key: 'soft-rock',
    url: 'https://listen.181fm.com/181-mellow_128k.mp3',
    labels: {
      ru: 'Лёгкий рок',
      en: 'Soft Rock',
      uk: 'Легкий рок',
      es: 'Rock suave',
      fr: 'Soft Rock',
      de: 'Soft Rock',
      it: 'Soft Rock',
      pt: 'Soft Rock',
      zh: '轻摇滚',
      ja: 'ソフトロック',
      ko: '소프트 록',
      tr: 'Hafif Rock',
      pl: 'Łagodny rock',
      ar: 'سوفت روك',
      hi: 'सॉफ्ट रॉक',
      uz: 'Yengil rok',
      kk: 'Жеңіл рок',
    },
  },
  {
    key: 'jazz',
    url: 'https://listen.181fm.com/181-jazzmix_128k.mp3',
    labels: {
      ru: 'Джаз',
      en: 'Jazz',
      uk: 'Джаз',
      es: 'Jazz',
      fr: 'Jazz',
      de: 'Jazz',
      it: 'Jazz',
      pt: 'Jazz',
      zh: '爵士',
      ja: 'ジャズ',
      ko: '재즈',
      tr: 'Caz',
      pl: 'Jazz',
      ar: 'جاز',
      hi: 'जैज़',
      uz: 'Jaz',
      kk: 'Джаз',
    },
  },
];

// Two free, verified national music stations per supported language (placed FIRST before the 10 genre stations)
export const NATIONAL_FM_BY_LANG: Record<SupportedLang, DefaultFmStation[]> = {
  en: [
    {
      key: 'nat-en-capital',
      url: 'https://media-ice.musicradio.com/CapitalMP3',
      labels: { en: 'Capital UK', ru: 'Capital UK' },
    },
    {
      key: 'nat-en-heartdance',
      url: 'https://media-ssl.musicradio.com/HeartDanceMP3',
      labels: { en: 'Heart Dance UK', ru: 'Heart Dance UK' },
    },
  ],
  ru: [
    {
      key: 'nat-ru-record',
      url: 'https://radiorecord.hostingradio.ru/russianhits96.aacp',
      labels: {
        ru: 'Русские хиты (Record)',
        uk: 'Російські хіти (Record)',
        kk: 'Орыс хиттері (Record)',
        en: 'Russian Hits (Record)',
      },
    },
    {
      key: 'nat-ru-record-gold',
      url: 'https://radiorecord.hostingradio.ru/russiangold96.aacp',
      labels: {
        ru: 'Русское золото (Record)',
        uk: 'Російське золото (Record)',
        kk: 'Орыс алтыны (Record)',
        en: 'Russian Gold (Record)',
      },
    },
    {
      key: 'nat-ru-newradio',
      url: 'https://icecast-newradio.cdnvideo.ru/newradio3',
      labels: {
        ru: 'Новое Радио',
        uk: 'Нове Радіо',
        kk: 'Новое Радио',
        en: 'Novoe Radio',
      },
    },
  ],
  uk: [
    {
      key: 'nat-uk-kissfm',
      url: 'https://online.kissfm.ua/KissFM_Ukr',
      labels: { uk: 'Kiss FM Україна', ru: 'Kiss FM Украина', en: 'Kiss FM Ukraine' },
    },
    {
      key: 'nat-uk-hitfm',
      url: 'https://online.hitfm.ua/HitFM_HD',
      labels: { uk: 'Хіт FM (Україна)', ru: 'Хит FM (Украина)', en: 'Hit FM Ukraine' },
    },
  ],
  de: [
    {
      key: 'nat-de-swr3',
      url: 'https://liveradio.swr.de/sw282p3/swr3/play.mp3',
      labels: { de: 'SWR3 Pop', en: 'SWR3 Germany', ru: 'SWR3 Германия' },
    },
    {
      key: 'nat-de-1live',
      url: 'https://wdr-1live-live.icecastssl.wdr.de/wdr/1live/live/mp3/128/stream.mp3',
      labels: { de: '1LIVE (WDR)', en: '1LIVE Germany', ru: '1LIVE Германия' },
    },
  ],
  fr: [
    {
      key: 'nat-fr-rfm',
      url: 'https://stream.rfm.fr/rfm.mp3',
      labels: { fr: 'RFM France', en: 'RFM France', ru: 'RFM Франция' },
    },
    {
      key: 'nat-fr-fip',
      url: 'https://icecast.radiofrance.fr/fip-midfi.mp3?id=radiofrance',
      labels: { fr: 'FIP (Radio France)', en: 'FIP Radio France', ru: 'FIP Франция' },
    },
  ],
  es: [
    {
      key: 'nat-es-los40',
      url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_CLASSIC.mp3',
      labels: { es: 'LOS40 Classic', en: 'LOS40 Classic Spain', ru: 'LOS40 Classic' },
    },
    {
      key: 'nat-es-rac105',
      url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RAC105.mp3',
      labels: { es: 'RAC105', en: 'RAC105 Spain', ru: 'RAC105 Испания' },
    },
  ],
  it: [
    {
      key: 'nat-it-radio105',
      url: 'https://icy.unitedradio.it/Radio105.mp3',
      labels: { it: 'Radio 105', en: 'Radio 105 Italy', ru: 'Radio 105 Италия' },
    },
    {
      key: 'nat-it-virgin',
      url: 'https://icy.unitedradio.it/Virgin.mp3',
      labels: { it: 'Virgin Radio Italia', en: 'Virgin Radio Italy', ru: 'Virgin Radio Италия' },
    },
  ],
  pt: [
    {
      key: 'nat-pt-comercial',
      url: 'https://stream-icy.bauermedia.pt/comercial.mp3',
      labels: { pt: 'Rádio Comercial', en: 'Rádio Comercial', ru: 'Rádio Comercial' },
    },
    {
      key: 'nat-pt-rfm',
      url: 'https://23603.live.streamtheworld.com/RFMAAC.aac',
      labels: { pt: 'RFM Portugal', en: 'RFM Portugal', ru: 'RFM Португалия' },
    },
  ],
  pl: [
    {
      key: 'nat-pl-rmf',
      url: 'https://rs9-krk2.rmfstream.pl/rmf_fm',
      labels: { pl: 'RMF FM', en: 'RMF FM Poland', ru: 'RMF FM Польша' },
    },
    {
      key: 'nat-pl-eska',
      url: 'https://waw.ic.smcdn.pl/6130-1.mp3',
      labels: { pl: 'Radio ESKA', en: 'Radio ESKA Poland', ru: 'Radio ESKA Польша' },
    },
  ],
  tr: [
    {
      key: 'nat-tr-powerturk',
      url: 'https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio',
      labels: { tr: 'PowerTürk', en: 'PowerTürk', ru: 'PowerTürk' },
    },
    {
      key: 'nat-tr-superfm',
      url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SUPER_FM.mp3',
      labels: { tr: 'Süper FM', en: 'Süper FM Turkey', ru: 'Süper FM Турция' },
    },
  ],
  uz: [
    {
      key: 'nat-uz-ozbegim',
      url: 'https://fm101.uz:9943/fm101_low.aac',
      labels: { uz: "O'zbegim Taronasi", en: "O'zbegim Taronasi", ru: "O'zbegim Taronasi" },
    },
    {
      key: 'nat-uz-mars',
      url: 'https://marsfm.uz/stream.php',
      labels: { uz: 'Mars FM (UZ)', en: 'Mars FM Uzbekistan', ru: 'Mars FM Узбекистан' },
    },
  ],
  kk: [
    {
      key: 'nat-kk-beufm',
      url: 'https://stream.beufm.kz/beufm',
      labels: { kk: 'BEU FM (Қазақстан)', en: 'BEU FM Kazakhstan', ru: 'BEU FM Казахстан' },
    },
    {
      key: 'nat-kk-vasheradio',
      url: 'https://live.zhanafm.kz:8443/vasheradio',
      labels: { kk: 'Ваше Радио (KZ)', en: 'Vashe Radio KZ', ru: 'Ваше Радио (KZ)' },
    },
  ],
  zh: [
    {
      key: 'nat-zh-iradio',
      url: 'https://n03.rcs.revma.com/ndk05tyy2tzuv',
      labels: { zh: '中廣音樂網 i Radio', en: 'i Radio Mandopop', ru: 'i Radio (Китай)' },
    },
    {
      key: 'nat-zh-asiafm',
      url: 'https://n13.rcs.revma.com/xpgtqc74hv8uv',
      labels: { zh: 'AsiaFM 亞洲電台', en: 'AsiaFM Pop', ru: 'AsiaFM (Китай)' },
    },
  ],
  ja: [
    {
      key: 'nat-ja-jpop',
      url: 'https://quincy.torontocast.com:2070/stream.mp3',
      labels: { ja: 'J-Pop Sakura', en: 'J-Pop Sakura', ru: 'J-Pop Sakura (Япония)' },
    },
    {
      key: 'nat-ja-citypop',
      url: 'https://play.streamafrica.net/japancitypop',
      labels: { ja: 'Japan City Pop', en: 'Japan City Pop', ru: 'Japan City Pop' },
    },
  ],
  ko: [
    {
      key: 'nat-ko-listenmoe',
      url: 'https://listen.moe/kpop/fallback',
      labels: { ko: 'LISTEN.moe K-Pop', en: 'LISTEN.moe K-Pop', ru: 'LISTEN.moe K-Pop' },
    },
    {
      key: 'nat-ko-bigb',
      url: 'https://antares.dribbcast.com/proxy/kpop?mp=/s',
      labels: { ko: 'Big B Radio K-Pop', en: 'Big B K-Pop', ru: 'Big B K-Pop' },
    },
  ],
  ar: [
    {
      key: 'nat-ar-hits882',
      url: 'https://radiohits882.radioca.st/;',
      labels: { ar: 'راديو هيتس 88.2', en: 'Radio Hits 88.2', ru: 'Radio Hits 88.2' },
    },
    {
      key: 'nat-ar-sumer',
      url: 'https://l3.itworkscdn.net/itwaudio/9012/stream',
      labels: { ar: 'سومر إف إم', en: 'Sumer FM Arabic', ru: 'Sumer FM (Араб.)' },
    },
  ],
  hi: [
    {
      key: 'nat-hi-bollywood',
      url: 'https://drive.uber.radio/uber/bollywood2010s/icecast.audio',
      labels: { hi: 'बॉलीवुड हिट्स', en: 'Bollywood Hits', ru: 'Болливуд Хиты' },
    },
    {
      key: 'nat-hi-hindigold',
      url: 'https://azuracast.vibesounds.in:8010/radio.mp3',
      labels: { hi: 'हिंदी गोल्ड रेडियो', en: 'Hindi Gold Radio', ru: 'Hindi Gold Radio' },
    },
  ],
};

export const ALL_NATIONAL_FM_STATIONS: DefaultFmStation[] = Object.values(NATIONAL_FM_BY_LANG).flat();

export const ALL_DEFAULT_FM_STATIONS: DefaultFmStation[] = [
  ...ALL_NATIONAL_FM_STATIONS,
  ...DEFAULT_FM_STATIONS,
];

const NATIONAL_URL_TO_LANG = new Map<string, SupportedLang>();
(Object.entries(NATIONAL_FM_BY_LANG) as Array<[SupportedLang, DefaultFmStation[]]>).forEach(
  ([langCode, list]) => {
    list.forEach((st) => {
      NATIONAL_URL_TO_LANG.set(st.url.trim(), langCode);
    });
  }
);

export function getDefaultFmStationsForLang(lang?: SupportedLang): DefaultFmStation[] {
  const active = lang ?? getInitialLanguage();
  const national = NATIONAL_FM_BY_LANG[active] ?? NATIONAL_FM_BY_LANG.en;
  return [...national, ...DEFAULT_FM_STATIONS];
}

export function isNationalFmUrlForOtherLang(url: string, activeLang: SupportedLang): boolean {
  const owner = NATIONAL_URL_TO_LANG.get(url.trim());
  return Boolean(owner && owner !== activeLang);
}

export function getFmStationLabel(station: DefaultFmStation, lang: SupportedLang): string {
  return station.labels[lang] ?? station.labels.en;
}

export function findDefaultFmStationByUrl(url: string): DefaultFmStation | undefined {
  const normalized = url.trim().replace(/^http:\/\//i, 'https://');
  return ALL_DEFAULT_FM_STATIONS.find((station) => {
    if (station.url === url || station.url === normalized) return true;
    // Also match legacy bare mountpoints if previously saved
    if (
      station.key === 'indie' &&
      /^https?:\/\/ice\d*\.somafm\.com\/groovesalad(?:-128-mp3)?$/i.test(url.trim())
    ) {
      return true;
    }
    if (
      station.key === 'meditative' &&
      /^https?:\/\/ice\d*\.somafm\.com\/dronezone(?:-128-mp3)?$/i.test(url.trim())
    ) {
      return true;
    }
    return false;
  });
}

const GENERIC_RADIO_TOKENS = new Set([
  'radio',
  'radiofm',
  'stream',
  'streams',
  'listen',
  'live',
  'audio',
  'music',
  'mp3',
  'aac',
  'aacp',
  'ogg',
  'opus',
  'flac',
  'm3u',
  'm3u8',
  'pls',
  'icecast',
  'shoutcast',
  'main',
  'default',
  'play',
  'channel',
]);

const GENERIC_HOST_PREFIXES =
  /^(www|ice\d*|media(?:-ice)?|listen|stream\d*|streams|live|audio|radio\d*|pub\d*|edge\d*|cdn\d*|abs|s\d+)$/i;

const GENERIC_HOST_ROOTS = new Set([
  'hostingradio',
  'streamguys',
  'streamguys1',
  'streamguys2',
  'radiojar',
  'zeno',
  'myradio24',
  'cdnvideo',
  'dline-media',
  'musicradio',
  'icecast',
  'shoutcast',
  'radioking',
]);

function toReadableStationTitle(raw: string): string {
  const spaced = raw
    .replace(/[_+]+/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!spaced) return '';
  return spaced
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function cleanRadioMetaTitle(metaTitle: string): string {
  const trimmed = metaTitle
    .replace(/^(?:RadioFM|РадиоФМ|РадіоФМ)\s*[:-]\s*/i, '')
    .replace(/\s*\(#\d+\)\s*/g, ' ')
    .replace(/\s*[-–|]\s*\d{2,3}\s*k(?:bps)?(?:\s*(?:mp3|aacp?|ogg|opus))?\s*$/i, '')
    .replace(/\s*[\[(]\s*(?:\d{2,3}\s*k(?:bps)?|mp3|aacp?|ogg|opus|flac|hq|live)\s*[\])]\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!trimmed || /^(?:radio\s*fm|радио\s*фм|радіо\s*фм)$/i.test(trimmed)) {
    return '';
  }

  if (trimmed.length <= 26) return trimmed;
  const cut = trimmed.slice(0, 26);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace >= 12 ? cut.slice(0, lastSpace) : cut).trim();
}

export function extractShortRadioName(rawUrl: string, metaTitle?: string): string {
  const matched = rawUrl ? findDefaultFmStationByUrl(rawUrl) : undefined;
  if (matched) {
    return getFmStationLabel(matched, getInitialLanguage());
  }

  if (metaTitle) {
    const cleanedMeta = cleanRadioMetaTitle(metaTitle);
    if (cleanedMeta) return cleanedMeta;
  }

  let parsed: URL | null = null;
  try {
    if (rawUrl) parsed = new URL(rawUrl);
  } catch {
    parsed = null;
  }

  let hostShort = '';
  if (parsed) {
    const hostParts = parsed.hostname.toLowerCase().split('.').filter(Boolean);
    const meaningfulHostParts = hostParts.filter((part, idx) => {
      if (idx === hostParts.length - 1 && part.length <= 4) return false; // TLD
      if (GENERIC_HOST_PREFIXES.test(part)) return false;
      if (GENERIC_HOST_ROOTS.has(part)) return false;
      return true;
    });
    const hostCandidate = meaningfulHostParts[0] || hostParts[0] || '';
    if (hostCandidate && !GENERIC_HOST_PREFIXES.test(hostCandidate)) {
      hostShort = toReadableStationTitle(hostCandidate);
    }

    const pathSegments = parsed.pathname.split('/').filter(Boolean);
    const lastSeg = pathSegments[pathSegments.length - 1] || '';
    const cleanedPath = decodeURIComponent(lastSeg)
      .replace(/\.(mp3|aac|aacp|ogg|opus|flac|wav|m4a|m3u8?|pls)$/i, '')
      .replace(/^\d{2,4}[-_]+/, '') // strip leading station numeric prefixes like 181-
      .replace(/[-_]?(?:32|48|56|64|80|96|112|128|160|192|224|256|320)k?(?:[-_]?(?:mp3|aacp?|ogg|opus|flac))?$/i, '')
      .replace(/(?:mp3|aacp?|ogg|opus|flac)$/i, '')
      .replace(/^[-_]+|[-_]+$/g, '')
      .trim();

    if (
      cleanedPath &&
      !/^\d+$/.test(cleanedPath) &&
      !GENERIC_RADIO_TOKENS.has(cleanedPath.toLowerCase())
    ) {
      const pathTitle = toReadableStationTitle(cleanedPath);
      if (pathTitle) {
        if (
          pathTitle.length <= 3 &&
          hostShort &&
          hostShort.toLowerCase() !== pathTitle.toLowerCase()
        ) {
          return `${hostShort} ${pathTitle}`.slice(0, 26);
        }
        return pathTitle.slice(0, 26);
      }
    }

    if (hostShort) {
      return hostShort.slice(0, 26);
    }

    return parsed.hostname.replace(/^www\./i, '').slice(0, 26);
  }

  return '';
}
