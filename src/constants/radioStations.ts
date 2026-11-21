import { SupportedLang } from '../i18n/translations';

export interface DefaultFmStation {
  key: string;
  url: string;
  labels: Record<SupportedLang, string>;
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

export function getFmStationLabel(station: DefaultFmStation, lang: SupportedLang): string {
  return station.labels[lang] ?? station.labels.en;
}

export function findDefaultFmStationByUrl(url: string): DefaultFmStation | undefined {
  const normalized = url.trim().replace(/^http:\/\//i, 'https://');
  return DEFAULT_FM_STATIONS.find((station) => {
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
