import defaultCoverImg from '../assets/images/default_album_cover_1794804180441.jpg';
import demoCosmicImg from '../assets/images/demo_cosmic_cover_1794804181390.jpg';
import demoSynthwaveImg from '../assets/images/demo_synthwave_cover_1794804180575.jpg';
import { EqPreset, PaletteConfig, VizModeConfig } from '../types/audio';

export const DEFAULT_COVER_IMAGE = defaultCoverImg;
export const DEMO_SYNTHWAVE_COVER = demoSynthwaveImg;
export const DEMO_COSMIC_COVER = demoCosmicImg;

export const VIZ_MODES: VizModeConfig[] = [
  { id: 0, label: '1. Живая Аура (Бас)' },
  { id: 1, label: '2. Спектральные Волны' },
  { id: 2, label: '3. Частицы Ритма' },
  { id: 3, label: '4. Калейдоскоп' },
  { id: 4, label: '5. Меш-Градиент' },
  { id: 5, label: '6. Спектр-Бары' },
  { id: 6, label: '7. Круговой Эквалайзер' },
  { id: 7, label: '8. Осциллограф' },
  { id: 8, label: '9. Неоновый Ореол Обложки' },
  { id: 9, label: '10. Пульсирующая Орбита' },
  { id: 10, label: '11. Искрящийся Огонь' },
  { id: 11, label: '12. Глубокий Космос (Звёзды)' },
  { id: 12, label: '13. Галактическая Туманность' },
  { id: 13, label: '14. Северное Сияние' },
  { id: 14, label: '15. Солнечная Корона' },
  { id: 15, label: '16. Синтвейв-Горизонт' },
  { id: 16, label: '17. Биолюминесценция' },
  { id: 17, label: '18. Плазменная Дуга' },
  { id: 18, label: '19. Кристаллическая Матрица' },
  { id: 19, label: '20. Водяная Рябь' },
  { id: 20, label: '21. Вихрь Галактики' },
  { id: 21, label: '22. Лазерное Шоу' },
  { id: 22, label: '23. Нейросеть Созвездий' },
  { id: 23, label: '24. Флюоресцентный Контур' },
  { id: 24, label: '25. Метеоритный Дождь' },
  { id: 25, label: '26. Голографический Туннель' },
  { id: 26, label: '27. Магнитное Поле' },
  { id: 27, label: '28. Сверхновая Вспышка' },
];

export const PALETTES: PaletteConfig[] = [
  { id: 0, name: 'Неоновый Пурпур', colors: ['#a855f7', '#ec4899', '#6366f1', '#3b82f6'] },
  { id: 1, name: 'Киберпанк Неон', colors: ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'] },
  { id: 2, name: 'Глубокий Космос', colors: ['#4f46e5', '#7c3aed', '#db2777', '#0284c7'] },
  { id: 3, name: 'Яркий Закат', colors: ['#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'] },
  { id: 4, name: 'Монохром', colors: ['#ffffff', '#cbd5e1', '#64748b', '#334155'] },
  { id: 5, name: 'Изумрудная Аврора', colors: ['#10b981', '#06b6d4', '#34d399', '#3b82f6'] },
  { id: 6, name: 'Расплавленное Золото', colors: ['#f59e0b', '#fbbf24', '#ef4444', '#fb7185'] },
  { id: 7, name: 'Флюоресцентный Лайм', colors: ['#a3e635', '#22d3ee', '#10b981', '#facc15'] },
];

export const EQ_BANDS = [
  { freq: 60, label: '60 Гц', desc: 'Суб-бас' },
  { freq: 230, label: '230 Гц', desc: 'Теплота' },
  { freq: 910, label: '910 Гц', desc: 'Середина' },
  { freq: 3600, label: '3.6 кГц', desc: 'Присутствие' },
  { freq: 14000, label: '14 кГц', desc: 'Воздух' },
] as const;

export const EQ_PRESETS: EqPreset[] = [
  { id: 'flat', label: 'Ровный', gains: [0, 0, 0, 0, 0] },
  { id: 'bass', label: 'Бас-буст', gains: [6, 4, -1, 1, 2] },
  { id: 'electronic', label: 'Электроника', gains: [5, 2, -2, 3, 5] },
  { id: 'vocal', label: 'Вокал', gains: [-2, 0, 4, 3, 1] },
  { id: 'night', label: 'Ночной', gains: [-3, 2, 3, 1, -2] },
];
