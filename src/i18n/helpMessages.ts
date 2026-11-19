import { SupportedLang } from './translations';

export type HelpSectionId =
  | 'sources'
  | 'visuals'
  | 'orbs'
  | 'backdrop'
  | 'studio'
  | 'audioAndApp';

export interface HelpSection {
  id: HelpSectionId;
  title: string;
  items: string[];
}

export interface HelpMessages {
  helpBtnLabel: string;
  helpMenuBtn: string;
  helpModalTitle: string;
  helpModalSubtitle: string;
  helpCloseBtn: string;
  sections: HelpSection[];
}

const EN_HELP: HelpMessages = {
  helpBtnLabel: 'Help',
  helpMenuBtn: 'User Guide & All Features',
  helpModalTitle: 'YRitmX — Complete Guide',
  helpModalSubtitle: 'Audio, Video, Space Studio & MP4 Export',
  helpCloseBtn: 'Got it',
  sections: [
    {
      id: 'sources',
      title: '1. Music, Video & Photo Sources',
      items: [
        'Tap the album cover or Audius / Folder / URL buttons to switch music sources.',
        'Device Folder & Files support MP3, WAV, FLAC, OGG, M4A (with ID3 cover art), plus MP4/WebM/MOV videos and JPG/PNG/WebP photos.',
        'Multiple selected photos and videos play in sequence automatically (each photo stays on screen for 5 seconds). You can also drag and drop media files onto the stage.',
        'URL supports Audius profiles, GitHub folders, Archive.org, JSON/M3U/RSS playlists, and direct MP3 streams.',
      ],
    },
    {
      id: 'visuals',
      title: '2. Visual Themes, Mix & Carousel',
      items: [
        'Choose among 28 reactive visualizers and 8 color palettes, or click New Look to randomize theme, palette, and motion dynamics.',
        'Mix Layers blends 1–2 extra ambient cosmic effects behind the primary theme. Auto-Bg switches visuals on every track.',
        'Select Carousel in the Visualization Mode list to cycle random themes and layer mixes inside the same track every 5, 10, 15, 20, 25, or 30 seconds.',
      ],
    },
    {
      id: 'orbs',
      title: '3. Zen Mode & Floating Track Orbs',
      items: [
        'Click the cosmic background or the Eye icon to hide panels and reveal floating audio-reactive track spheres.',
        'Tap any sphere to switch tracks, or tap the active sphere to Play/Pause. Toggle Orbs and Captions in the header or menu.',
        'Click anywhere on the background again to restore controls.',
      ],
    },
    {
      id: 'backdrop',
      title: '4. Backdrop, Live Camera & Microphone',
      items: [
        'Open Backdrop to layer custom photos, videos, live Camera, or Microphone over the currently playing music without stopping playback.',
        'Frame Motion switches between Static, Floating, and Rotating (Frame Only, Frame & Media, or Media Only). Fullscreen Backdrop lets you choose With Animation, Orb Only, or Clean.',
        'Turning on Camera while a Photo/Video backdrop is active enables Picture-in-Picture (fullscreen backdrop + draggable Camera frame on top).',
        'Activating Camera also requests the Microphone so you can record live video and sound over your track; adjust Track, Video, and Mic volumes in the Backdrop mixer.',
      ],
    },
    {
      id: 'studio',
      title: '5. Space Studio & MP4 Video Recording',
      items: [
        'Long-press (hold 0.6s) the Play button to arm Studio & Record Mode. Your cover, photo, video, or camera moves into a customizable geometric frame.',
        'In Studio: drag the frame to move it; tap the frame to change shape (circle, square, card, diamond, star, heart, etc.); hold the frame to unlock scale/stretch/rotation handles; tap the background to randomize style and neon contours.',
        'Use the top bar to pick aspect ratio (9:16, 1:1, 16:9), resolution (480, 720, 1080), and render engine: Fast (real-time stream, required for Camera & Mic) or Quality (frame-by-frame HQ H.264 MP4 with offline FFT).',
        'Press the red Record button to record from the start (sequentially through photos/videos if multiple are loaded), and press Stop to save your .mp4 clip.',
      ],
    },
    {
      id: 'audioAndApp',
      title: '6. Equalizer, Fullscreen & App Install',
      items: [
        'Open Equalizer for 5 frequency bands (60 Hz – 14 kHz) and presets (Flat, Bass Boost, Electronic, Vocal, Night).',
        'Use Fullscreen in the top bar or Menu anytime, and install YRitmX via Install App to use it offline as a standalone PWA.',
      ],
    },
  ],
};

const RU_HELP: HelpMessages = {
  helpBtnLabel: 'Справка',
  helpMenuBtn: 'Подробная справка и все функции',
  helpModalTitle: 'YRitmX — Подробный гид',
  helpModalSubtitle: 'Аудио, видео, Студия и запись MP4',
  helpCloseBtn: 'Понятно',
  sections: [
    {
      id: 'sources',
      title: '1. Источники музыки, фото и видео',
      items: [
        'Нажмите на обложку трека или кнопки Audius / Папка / URL, чтобы выбрать источник.',
        'Папка и файлы с устройства поддерживают MP3, WAV, FLAC, OGG, M4A (с чтением обложек из ID3), а также видео (.mp4, .webm, .mov) и фото (.jpg, .png, .webp).',
        'Если прикрепить несколько фото и видео сразу, они проигрываются по очереди (каждое фото показывается 5 секунд). Файлы можно перетаскивать прямо на экран.',
        'URL поддерживает профили Audius, папки GitHub, Archive.org, плейлисты JSON/M3U/RSS и прямые ссылки MP3.',
      ],
    },
    {
      id: 'visuals',
      title: '2. Визуализация, Слои и «Карусель»',
      items: [
        'Доступно 28 реактивных тем и 8 палитр. Кнопка «Новый вид» мгновенно генерирует случайный стиль и динамику.',
        '«Слои (Mix)» накладывают 1–2 дополнительных космических фона за основным эффектом. «Авто-фон» меняет визуал при смене трека.',
        'Выберите режим «Карусель» в списке визуализаций — под ним появятся 6 кнопок (5, 10, 15, 20, 25, 30 с) для автоматической смены случайных фонов и слоёв прямо в течение одного трека.',
      ],
    },
    {
      id: 'orbs',
      title: '3. Дзен-режим и летающие сферы',
      items: [
        'Нажмите на пустой фон (или кнопку «Глаз»), чтобы скрыть интерфейс и оставить только реактивные сферы треков.',
        'Тап по другой сфере переключает трек, тап по активной — ставит паузу/воспроизведение. В шапке и меню можно отдельно включать «Сферы» и «Подписи».',
        'Повторный клик по фону возвращает панель управления.',
      ],
    },
    {
      id: 'backdrop',
      title: '4. Свой фон, Камера и Микрофон',
      items: [
        'Кнопка «Фон» позволяет добавить фото, видео, живую Камеру или Микрофон поверх текущего аудиотрека, не останавливая музыку.',
        'Настраивайте поведение фрейма (Неподвижный, Плавающий, Вращающийся: только фрейм, фрейм и медиа, только медиа) или режим на весь экран (С анимацией, Только сфера, Без анимации).',
        'Если при активном фото/видео-фоне включить Камеру, включится режим «картинка в картинке»: фон на весь экран + перетаскиваемое окно с камерой поверх.',
        'При включении Камеры сразу подключается и Микрофон (доступен фильтр эха и шума), чтобы писать видео со звуком прямо поверх трека; громкость трека, видео и микрофона регулируется в микшере раздела «Фон».',
      ],
    },
    {
      id: 'studio',
      title: '5. Режим Студии и запись MP4',
      items: [
        'Удерживайте кнопку Play 0.6 секунды, чтобы открыть Режим Студии и панель записи: обложка, видео или камера помещаются в фигурный фрейм.',
        'Управление на сцене: перетаскивайте фрейм пальцем/мышью; тап по фрейму — смена геометрической формы; долгое нажатие на фрейм — рамка деформации, масштаба и поворота; тап по фону — смена стиля и контуров.',
        'На верхней панели выберите ориентацию (9:16, 1:1, 16:9), качество (480, 720, 1080) и режим рендера: «Быстро» (потоковая запись в реальном времени — обязательна для Камеры и Микрофона) или «Качественно» (покадровый HQ H.264 MP4 без пропусков кадров).',
        'Нажмите красную кнопку записи для старта с начала (при серии фото/видео они запишутся подряд), затем «Стоп» для скачивания MP4.',
      ],
    },
    {
      id: 'audioAndApp',
      title: '6. Эквалайзер, Полный экран и PWA',
      items: [
        '5-полосный эквалайзер (60 Гц – 14 кГц) с пресетами («Ровный», «Бас-буст», «Электроника», «Вокал», «Ночной») работает и при воспроизведении, и при записи MP4.',
        'Кнопка полноэкранного режима есть в шапке и меню. Плеер можно установить как отдельное приложение (PWA) для работы даже офлайн.',
      ],
    },
  ],
};

const UK_HELP: HelpMessages = {
  helpBtnLabel: 'Довідка',
  helpMenuBtn: 'Детальна довідка та всі функції',
  helpModalTitle: 'YRitmX — Повний гід',
  helpModalSubtitle: 'Аудіо, відео, Студія та запис MP4',
  helpCloseBtn: 'Зрозуміло',
  sections: [
    {
      id: 'sources',
      title: '1. Джерела музики, фото та відео',
      items: [
        'Натисніть на обкладинку треку або кнопки Audius / Тека / URL, щоб обрати джерело.',
        'Тека і файли з пристрою підтримують MP3, WAV, FLAC, OGG, M4A (з обкладинками ID3), а також відео (.mp4, .webm, .mov) і фото (.jpg, .png, .webp).',
        'Якщо додати кілька фото та відео одночасно, вони відтворюються по черзі (кожне фото по 5 секунд). Файли можна перетягувати на екран.',
        'URL підтримує профілі Audius, теки GitHub, Archive.org, списки JSON/M3U/RSS та прямі посилання MP3.',
      ],
    },
    {
      id: 'visuals',
      title: '2. Візуалізація, Шари та «Карусель»',
      items: [
        'Доступно 28 реактивних тем і 8 палітр. Кнопка «Новий вигляд» миттєво підбирає випадковий стиль та динаміку.',
        '«Шари (Mix)» додають 1–2 фонові ефекти за основною темою. «Авто» змінює візуал на кожному треку.',
        'Оберіть режим «Карусель» у списку візуалізацій — з’являться 6 кнопок (5, 10, 15, 20, 25, 30 с) для автоматичної зміни фонів і шарів протягом одного треку.',
      ],
    },
    {
      id: 'orbs',
      title: '3. Дзен-режим і летючі сфери',
      items: [
        'Натисніть на фон (або кнопку «Око»), щоб приховати інтерфейс і залишити лише реактивні сфери треків.',
        'Тап по іншій сфері перемикає трек, по активній — пауза/відтворення. «Сфери» та «Підписи» перемикаються окремо.',
        'Повторний клік по фону повертає елементи керування.',
      ],
    },
    {
      id: 'backdrop',
      title: '4. Власний фон, Камера та Мікрофон',
      items: [
        'Кнопка «Фон» дозволяє додати фото, відео, живу Камеру або Мікрофон поверх треку без зупинки музики.',
        'Налаштовуйте рух фрейму (Нерухомий, Плаваючий, Обертовий) або повноекранний фон (З анімацією, Лише сфера, Без анімації).',
        'Увімкнення Камери поверх фото/відео активує режим «картинка в картинці»: повноекранний фон + рухоме вікно камери зверху.',
        'Разом із Камерою підключається Мікрофон (з фільтром відлуння і шуму) для запису відео зі звуком поверх музики; гучність треку, відео та мікрофона налаштовується у мікшері.',
      ],
    },
    {
      id: 'studio',
      title: '5. Режим Студії та запис MP4',
      items: [
        'Утримуйте кнопку Play 0.6 с, щоб відкрити Режим Студії та панель запису.',
        'Жести: перетягуйте фрейм; тап по фрейму змінює форму; довге натискання відкриває рамку деформації, масштабу та обертання; тап по фону змінює стиль.',
        'Оберіть формат (9:16, 1:1, 16:9), якість (480, 720, 1080) і рендер: «Швидко» (у реальному часі — обов’язково для Камери й Мікрофона) або «Якісно» (покадровий HQ MP4).',
        'Натисніть червону кнопку запису для старту, а потім «Стоп» для збереження MP4.',
      ],
    },
    {
      id: 'audioAndApp',
      title: '6. Еквалайзер, Повний екран і PWA',
      items: [
        '5-смуговий еквалайзер (60 Гц – 14 кГц) із пресетами працює і під час прослуховування, і під час експорту MP4.',
        'Повноекранний режим доступний у шапці та меню; плеєр можна встановити як окремий PWA-додаток.',
      ],
    },
  ],
};

const ES_HELP: HelpMessages = {
  helpBtnLabel: 'Ayuda',
  helpMenuBtn: 'Guía completa y funciones',
  helpModalTitle: 'YRitmX — Guía del usuario',
  helpModalSubtitle: 'Audio, vídeo, Estudio Espacial y exportación MP4',
  helpCloseBtn: 'Entendido',
  sections: [
    {
      id: 'sources',
      title: '1. Fuentes de música, fotos y vídeos',
      items: [
        'Toca la carátula o Audius / Carpeta / URL para elegir tu fuente.',
        'Las carpetas y archivos locales admiten MP3, WAV, FLAC, OGG, M4A (con carátulas ID3), además de vídeos (.mp4, .webm, .mov) y fotos (.jpg, .png, .webp).',
        'Si seleccionas varias fotos y vídeos, se reproducen en secuencia (cada foto dura 5 s). También puedes arrastrar archivos al escenario.',
        'URL admite perfiles Audius, repositorios GitHub, Archive.org, listas JSON/M3U/RSS y enlaces MP3 directos.',
      ],
    },
    {
      id: 'visuals',
      title: '2. Temas visuales, Capas y Carrusel',
      items: [
        'Explora 28 temas reactivos y 8 paletas, o pulsa Nuevo estilo para combinar diseño y dinámica al azar.',
        'Mezcla añade 1–2 capas cósmicas detrás del tema principal. Fondo automático cambia el estilo en cada pista.',
        'Elige Carrusel en Modo visual para cambiar fondos y capas automáticamente dentro de la misma pista cada 5, 10, 15, 20, 25 o 30 s.',
      ],
    },
    {
      id: 'orbs',
      title: '3. Modo Zen y esferas flotantes',
      items: [
        'Toca el fondo (o el icono del Ojo) para ocultar los controles y ver solo las esferas reactivas.',
        'Toca otra esfera para cambiar de pista o la esfera activa para pausar/reproducir. Activa Esferas y Títulos por separado.',
        'Vuelve a tocar el fondo para restaurar la interfaz.',
      ],
    },
    {
      id: 'backdrop',
      title: '4. Fondo, Cámara en vivo y Micrófono',
      items: [
        'Pulsa Fondo para añadir fotos, vídeos, Cámara en vivo o Micrófono sin detener la música.',
        'Configura el marco (Fijo, Flotante, Giratorio: solo marco, marco y media o solo media) o Pantalla completa (Con animación, Solo esfera, Sin animación).',
        'Activar Cámara sobre un fondo de foto/vídeo inicia Imagen en Imagen (fondo completo + marco de cámara arrastrable encima).',
        'La Cámara activa también el Micrófono (con filtro de eco y ruido) para grabar vídeo con voz sobre la pista; ajusta los volúmenes en el mezclador de Fondo.',
      ],
    },
    {
      id: 'studio',
      title: '5. Estudio Espacial y grabación MP4',
      items: [
        'Mantén pulsado Play 0.6 s para abrir el Modo Estudio y la barra superior de grabación.',
        'Gestos: arrastra el marco; tócalo para cambiar de forma; mantenlo pulsado para escalar, estirar o rotar; toca el fondo para renovar estilo y contornos.',
        'Elige formato (9:16, 1:1, 16:9), calidad (480, 720, 1080) y motor: Rápido (en tiempo real, obligatorio para Cámara/Mic) o Calidad (MP4 HQ fotograma a fotograma).',
        'Pulsa el botón rojo para grabar y Detener para descargar el .mp4.',
      ],
    },
    {
      id: 'audioAndApp',
      title: '6. Ecualizador, Pantalla completa e Instalación',
      items: [
        'Ecualizador de 5 bandas (60 Hz – 14 kHz) con preajustes integrado en reproducción y exportación MP4.',
        'Activa Pantalla completa desde el encabezado/menú o instala YRitmX como aplicación PWA.',
      ],
    },
  ],
};

const FR_HELP: HelpMessages = {
  helpBtnLabel: 'Aide',
  helpMenuBtn: 'Guide complet et fonctionnalités',
  helpModalTitle: 'YRitmX — Guide complet',
  helpModalSubtitle: 'Audio, vidéo, Studio Spatial et export MP4',
  helpCloseBtn: 'Compris',
  sections: [
    {
      id: 'sources',
      title: '1. Sources audio, photos et vidéos',
      items: [
        'Touchez la pochette ou Audius / Dossier / URL pour charger vos médias.',
        'Les dossiers locaux lisent MP3, WAV, FLAC, OGG, M4A (avec pochettes ID3), ainsi que les vidéos (.mp4, .webm, .mov) et photos (.jpg, .png, .webp).',
        'Plusieurs photos/vidéos s’enchaînent automatiquement (5 s par photo). Glissez-déposez aussi vos fichiers sur l’écran.',
        'URL prend en charge Audius, GitHub, Archive.org, playlists JSON/M3U/RSS et flux MP3 directs.',
      ],
    },
    {
      id: 'visuals',
      title: '2. Visuels, Calques et Carrousel',
      items: [
        'Profitez de 28 thèmes réactifs et 8 palettes, ou cliquez sur Nouveau style pour un rendu aléatoire.',
        'Mixage superpose 1 à 2 couches cosmiques. Auto-fond change le style à chaque piste.',
        'Choisissez Carrousel dans le menu Mode visuel pour alterner automatiquement les fonds toutes les 5, 10, 15, 20, 25 ou 30 s durant un même morceau.',
      ],
    },
    {
      id: 'orbs',
      title: '3. Mode Zen et sphères flottantes',
      items: [
        'Touchez l’arrière-plan (ou l’icône Œil) pour masquer les contrôles et afficher les sphères musicales réactives.',
        'Touchez une sphère pour changer de piste ou la sphère active pour Play/Pause. Réglez Sphères et Titres dans l’en-tête ou le menu.',
        'Touchez de nouveau le fond pour réafficher l’interface.',
      ],
    },
    {
      id: 'backdrop',
      title: '4. Arrière-plan, Caméra et Micro',
      items: [
        'Ouvrez Arrière-plan pour ajouter photos, vidéos, Caméra en direct ou Micro sans couper la musique.',
        'Réglez le cadre (Fixe, Flottant, Rotatif : cadre, média ou les deux) ou le Plein écran (Avec animation, Sphère seule, Sans animation).',
        'Activer la Caméra sur une photo/vidéo passe en Image dans l’image (fond plein écran + cadre caméra déplaçable).',
        'L’activation de la Caméra connecte aussi le Micro (avec filtre anti-écho) pour enregistrer vidéo + voix sur le morceau via le mixeur intégré.',
      ],
    },
    {
      id: 'studio',
      title: '5. Studio Spatial et enregistrement MP4',
      items: [
        'Maintenez Play 0,6 s pour armer le Mode Studio et afficher la barre d’enregistrement.',
        'Gestes : déplacez le cadre ; touchez-le pour changer de forme ; maintenez-le pour redimensionner/pivoter ; touchez le fond pour changer les couleurs.',
        'Choisissez format (9:16, 1:1, 16:9), qualité (480, 720, 1080) et rendu : Rapide (temps réel, requis pour Caméra/Micro) ou Qualité (HQ MP4 image par image).',
        'Appuyez sur Enregistrer puis Stop pour télécharger votre MP4.',
      ],
    },
    {
      id: 'audioAndApp',
      title: '6. Égaliseur, Plein écran et PWA',
      items: [
        'Égaliseur 5 bandes (60 Hz – 14 kHz) avec préréglages actif en lecture et en export MP4.',
        'Mode Plein écran disponible dans la barre supérieure/menu, et installation PWA pour l’usage hors ligne.',
      ],
    },
  ],
};

const DE_HELP: HelpMessages = {
  helpBtnLabel: 'Hilfe',
  helpMenuBtn: 'Anleitung & alle Funktionen',
  helpModalTitle: 'YRitmX — Vollständige Anleitung',
  helpModalSubtitle: 'Audio, Video, Space Studio & MP4-Export',
  helpCloseBtn: 'Verstanden',
  sections: [
    {
      id: 'sources',
      title: '1. Musik-, Video- & Fotoquellen',
      items: [
        'Tippe auf das Cover oder Audius / Ordner / URL, um eine Quelle zu laden.',
        'Lokale Ordner unterstützen MP3, WAV, FLAC, OGG, M4A (inkl. ID3-Covern) sowie Videos (.mp4, .webm, .mov) und Fotos (.jpg, .png, .webp).',
        'Mehrere Fotos & Videos laufen nacheinander (Fotos je 5 Sek.). Dateien lassen sich auch direkt auf die Bühne ziehen.',
        'URL unterstützt Audius, GitHub-Ordner, Archive.org, JSON/M3U/RSS und direkte MP3-Streams.',
      ],
    },
    {
      id: 'visuals',
      title: '2. Visualisierung, Mix & Karussell',
      items: [
        'Wähle aus 28 reaktiven Themes und 8 Farbpaletten oder klicke auf Neuer Look.',
        'Mix-Ebenen kombiniert 1–2 Hintergrund-Effekte; Auto-Hintergrund wechselt bei jedem Track.',
        'Wähle Karussell unter Visualisierung, um Hintergründe innerhalb desselben Tracks alle 5, 10, 15, 20, 25 oder 30 Sek. automatisch zu wechseln.',
      ],
    },
    {
      id: 'orbs',
      title: '3. Zen-Modus & schwebende Sphären',
      items: [
        'Tippe auf den Hintergrund (oder das Augensymbol), um die Oberfläche auszublenden und reaktive Track-Sphären anzuzeigen.',
        'Tippe auf eine Sphäre für Trackwechsel oder Play/Pause. Sphären & Titel lassen sich separat umschalten.',
        'Erneutes Tippen auf den Hintergrund zeigt die Steuerung wieder an.',
      ],
    },
    {
      id: 'backdrop',
      title: '4. Hintergrund, Live-Kamera & Mikrofon',
      items: [
        'Unter Hintergrund kannst du Fotos, Videos, Live-Kamera oder Mikrofon über die laufende Musik legen.',
        'Wähle Rahmenbewegung (Fest, Schwebend, Drehend) oder Vollbild (Mit Animation, Nur Sphäre, Ohne Animation).',
        'Kamera + Foto/Video aktiviert Bild-in-Bild (Vollbild-Hintergrund + verschiebbarer Kamerarahmen).',
        'Die Kamera schaltet auch das Mikrofon (mit Echo-/Rauschfilter) zu, um Video & Stimme direkt über dem Track aufzunehmen.',
      ],
    },
    {
      id: 'studio',
      title: '5. Space Studio & MP4-Aufnahme',
      items: [
        'Halte Play 0,6 s gedrückt, um Space Studio und die obere Aufnahmeleiste zu öffnen.',
        'Gesten: Rahmen verschieben; antippen für Formwechsel; gedrückt halten für Skalieren/Drehen; Hintergrund antippen für neuen Stil.',
        'Wähle Format (9:16, 1:1, 16:9), Auflösung (480, 720, 1080) und Modus: Schnell (Echtzeit, nötig für Kamera & Mikro) oder Qualität (HQ MP4 Bild-für-Bild).',
        'Starte mit der roten Taste und beende mit Stopp zum MP4-Download.',
      ],
    },
    {
      id: 'audioAndApp',
      title: '6. Equalizer, Vollbild & PWA',
      items: [
        '5-Band-Equalizer (60 Hz – 14 kHz) mit Presets für Wiedergabe und MP4-Export.',
        'Vollbild über Kopfzeile/Menü steuerbar; als eigenständige PWA offline installierbar.',
      ],
    },
  ],
};

const IT_HELP: HelpMessages = {
  helpBtnLabel: 'Guida',
  helpMenuBtn: 'Guida completa e funzioni',
  helpModalTitle: 'YRitmX — Guida completa',
  helpModalSubtitle: 'Audio, video, Space Studio ed esportazione MP4',
  helpCloseBtn: 'Capito',
  sections: [
    {
      id: 'sources',
      title: '1. Sorgenti musica, foto e video',
      items: [
        'Tocca la copertina o Audius / Cartella / URL per scegliere la sorgente.',
        'Le cartelle locali leggono MP3, WAV, FLAC, OGG, M4A (con copertine ID3), più video (.mp4, .webm, .mov) e foto (.jpg, .png, .webp).',
        'Più foto e video vengono riprodotti in sequenza (5 s per foto); supportato anche il drag & drop.',
        'URL supporta Audius, cartelle GitHub, Archive.org, playlist JSON/M3U/RSS e MP3 diretti.',
      ],
    },
    {
      id: 'visuals',
      title: '2. Visualizzazioni, Livelli e Carosello',
      items: [
        'Scegli tra 28 temi reattivi e 8 palette, oppure premi Nuovo look per uno stile casuale.',
        'Livelli combina 1–2 effetti cosmici dietro al tema principale; Sfondo auto cambia a ogni traccia.',
        'Seleziona Carosello in Modalità visiva per cambiare sfondo e livelli nello stesso brano ogni 5, 10, 15, 20, 25 o 30 s.',
      ],
    },
    {
      id: 'orbs',
      title: '3. Modalità Zen e sfere fluttuanti',
      items: [
        'Tocca lo sfondo (o l’icona Occhio) per nascondere i controlli e mostrare le sfere reattive.',
        'Tocca una sfera per cambiare brano o la sfera attiva per Play/Pausa. Sfere e Titoli sono attivabili separatamente.',
        'Tocca di nuovo lo sfondo per ripristinare i comandi.',
      ],
    },
    {
      id: 'backdrop',
      title: '4. Sfondo, Fotocamera live e Microfono',
      items: [
        'Apri Sfondo per aggiungere foto, video, Fotocamera live o Microfono senza fermare la musica.',
        'Scegli il movimento della cornice (Fissa, Fluttuante, Rotante) o Schermo intero (Con animazione, Solo sfera, Senza animazione).',
        'Attivare la Fotocamera su foto/video attiva Picture-in-Picture (sfondo intero + riquadro camera spostabile).',
        'La Fotocamera collega anche il Microfono (con filtro eco/rumore) per registrare video e voce sopra la musica tramite il mixer integrato.',
      ],
    },
    {
      id: 'studio',
      title: '5. Space Studio e registrazione MP4',
      items: [
        'Tieni premuto Play per 0,6 s per aprire Space Studio e la barra di registrazione superiore.',
        'Gesti: trascina la cornice; tocca per cambiare forma; tieni premuto per ridimensionare/ruotare; tocca lo sfondo per cambiare stile.',
        'Scegli formato (9:16, 1:1, 16:9), qualità (480, 720, 1080) e motore: Veloce (tempo reale, per Camera/Mic) o Qualità (HQ MP4 fotogramma per fotogramma).',
        'Premi il tasto rosso per registrare e Stop per scaricare il file MP4.',
      ],
    },
    {
      id: 'audioAndApp',
      title: '6. Equalizzatore, Schermo intero e PWA',
      items: [
        'Equalizzatore a 5 bande (60 Hz – 14 kHz) con preset attivo anche durante l’esportazione MP4.',
        'Schermo intero disponibile nell’intestazione o nel menu; installabile come app PWA.',
      ],
    },
  ],
};

const PT_HELP: HelpMessages = {
  helpBtnLabel: 'Ajuda',
  helpMenuBtn: 'Guia completo e recursos',
  helpModalTitle: 'YRitmX — Guia completo',
  helpModalSubtitle: 'Áudio, vídeo, Estúdio e exportação MP4',
  helpCloseBtn: 'Entendi',
  sections: [
    {
      id: 'sources',
      title: '1. Fontes de música, fotos e vídeos',
      items: [
        'Toque na capa ou em Audius / Pasta / URL para escolher sua mídia.',
        'Pastas locais reproduzem MP3, WAV, FLAC, OGG, M4A (com capas ID3), além de vídeos (.mp4, .webm, .mov) e fotos (.jpg, .png, .webp).',
        'Várias fotos e vídeos tocam em sequência (5 s por foto). Você também pode arrastar arquivos para a tela.',
        'URL aceita perfis Audius, pastas GitHub, Archive.org, listas JSON/M3U/RSS e MP3 direto.',
      ],
    },
    {
      id: 'visuals',
      title: '2. Visuais, Camadas e Carrossel',
      items: [
        'Escolha entre 28 temas reativos e 8 paletas, ou toque em Novo visual para sortear estilo e dinâmica.',
        'Camadas mistura 1–2 efeitos cósmicos extras; Fundo automático muda a cada faixa.',
        'Selecione Carrossel em Modo visual para alternar fundos e camadas na mesma faixa a cada 5, 10, 15, 20, 25 ou 30 s.',
      ],
    },
    {
      id: 'orbs',
      title: '3. Modo Zen e esferas flutuantes',
      items: [
        'Toque no fundo (ou ícone do Olho) para ocultar os painéis e mostrar as esferas reativas das faixas.',
        'Toque em uma esfera para trocar de música ou na esfera ativa para Play/Pausa. Controle Esferas e Títulos separadamente.',
        'Toque no fundo novamente para restaurar a interface.',
      ],
    },
    {
      id: 'backdrop',
      title: '4. Fundo, Câmera ao vivo e Microfone',
      items: [
        'Em Fundo, adicione fotos, vídeos, Câmera ao vivo ou Microfone sem parar a música.',
        'Configure a moldura (Fixa, Flutuante, Giratória) ou Tela cheia (Com animação, Só esfera, Sem animação).',
        'Ligar a Câmera com foto/vídeo de fundo ativa Picture-in-Picture (fundo inteiro + moldura de câmera arrastável).',
        'Ao ativar a Câmera, o Microfone também é conectado (com filtro de eco e ruído) para gravar vídeo e voz sobre a música.',
      ],
    },
    {
      id: 'studio',
      title: '5. Modo Estúdio e gravação MP4',
      items: [
        'Segure Play por 0,6 s para abrir o Estúdio e a barra superior de gravação.',
        'Gestos: arraste a moldura; toque para mudar forma; segure para escalar/girar; toque no fundo para renovar o estilo.',
        'Escolha formato (9:16, 1:1, 16:9), resolução (480, 720, 1080) e render: Rápido (tempo real, para Câmera/Mic) ou Qualidade (MP4 HQ quadro a quadro).',
        'Pressione o botão vermelho para gravar e Parar para baixar o .mp4.',
      ],
    },
    {
      id: 'audioAndApp',
      title: '6. Equalizador, Tela cheia e PWA',
      items: [
        'Equalizador de 5 bandas (60 Hz – 14 kHz) com presets aplicado na reprodução e no MP4.',
        'Tela cheia disponível no topo ou menu; instale como app PWA para uso offline.',
      ],
    },
  ],
};

const ZH_HELP: HelpMessages = {
  helpBtnLabel: '帮助',
  helpMenuBtn: '完整使用指南与功能说明',
  helpModalTitle: 'YRitmX — 使用指南',
  helpModalSubtitle: '音频、视频、空间工作室与 MP4 导出',
  helpCloseBtn: '知道了',
  sections: [
    {
      id: 'sources',
      title: '1. 音乐、视频与照片来源',
      items: [
        '点击专辑封面或 Audius / 文件夹 / URL 按钮加载媒体。',
        '本地文件夹支持 MP3、WAV、FLAC、OGG、M4A（含 ID3 封面），以及视频（.mp4/.webm/.mov）和照片（.jpg/.png/.webp）。',
        '同时选择多张照片和视频时会按顺序自动播放（每张照片显示 5 秒），也支持直接拖放文件到舞台。',
        'URL 支持 Audius 主页、GitHub 目录、Archive.org、JSON/M3U/RSS 列表及直链 MP3。',
      ],
    },
    {
      id: 'visuals',
      title: '2. 视觉主题、图层混合与轮播',
      items: [
        '提供 28 种音乐响应式主题与 8 套配色，点击“换个风格”即可随机生成视觉组合。',
        '“叠加图层”可在主背景后融合 1–2 层宇宙特效；“自动换背景”在切歌时自动切换。',
        '在视觉模式中选择“轮播”，下方会出现 5、10、15、20、25、30 秒按钮，可在同一首歌内定时自动切换背景与图层组合。',
      ],
    },
    {
      id: 'orbs',
      title: '3. 禅意模式与悬浮音轨球体',
      items: [
        '点击空白背景（或眼睛图标）可隐藏面板，仅展示随节奏律动的悬浮曲目球体。',
        '点击其他球体切换歌曲，点击当前球体播放/暂停；顶部和菜单中可独立开关“球体”和“弧形标题”。',
        '再次点击背景即可恢复全部控制栏。',
      ],
    },
    {
      id: 'backdrop',
      title: '4. 背景、实时摄像头与麦克风',
      items: [
        '点击“背景”可在不断音的情况下叠加照片、视频、实时摄像头或麦克风。',
        '支持固定/漂浮/旋转相框（仅框、框与画面、仅画面）以及全屏模式（保留动画、仅球体、纯画面）。',
        '在已有照片或视频背景时开启摄像头，将激活画中画模式（全屏背景 + 可拖动摄像头窗口）。',
        '开启摄像头时会同步请求麦克风（带回声降噪过滤），方便伴随背景音乐直接录制口播或现场视频；各路音量可在混音滑块调节。',
      ],
    },
    {
      id: 'studio',
      title: '5. 空间工作室与 MP4 录制',
      items: [
        '长按播放键 0.6 秒进入空间工作室与录制模式，顶部将显示录制设置栏。',
        '交互手势：拖动相框移动；轻点相框切换几何形状；长按相框开启缩放/拉伸/旋转控制点；点击背景切换宇宙配色与霓虹轮廓。',
        '选择比例（9:16、1:1、16:9）、清晰度（480、720、1080）与渲染模式：“快速”（实时录制，摄像头/麦克风必选）或“高画质”（逐帧高清 H.264 MP4）。',
        '点击红色录制按钮开始录制，点击停止即可保存 .mp4 文件。',
      ],
    },
    {
      id: 'audioAndApp',
      title: '6. 均衡器、全屏与安装应用',
      items: [
        '内置 5 段均衡器（60 Hz – 14 kHz）及多套预设，听歌和导出 MP4 均实时生效。',
        '可通过顶部或菜单切换全屏，或安装为 PWA 独立应用支持离线播放。',
      ],
    },
  ],
};

const JA_HELP: HelpMessages = {
  helpBtnLabel: 'ヘルプ',
  helpMenuBtn: '詳しいガイドと全機能',
  helpModalTitle: 'YRitmX — 使い方ガイド',
  helpModalSubtitle: '音楽・動画・スタジオ・MP4書き出し',
  helpCloseBtn: 'OK',
  sections: [
    {
      id: 'sources',
      title: '1. 音楽・動画・写真の読み込み',
      items: [
        'アルバムジャケットや Audius / フォルダ / URL ボタンからソースを開けます。',
        'ローカルフォルダは MP3, WAV, FLAC, OGG, M4A（ID3アートワーク対応）、動画（.mp4/.webm/.mov）、写真（.jpg/.png/.webp）に対応しています。',
        '複数の写真や動画を選ぶと順番に自動再生されます（写真は各5秒）。画面へのドラッグ＆ドロップも可能です。',
        'URL は Audius、GitHubフォルダ、Archive.org、JSON/M3U/RSS、直リンクMP3に対応しています。',
      ],
    },
    {
      id: 'visuals',
      title: '2. ビジュアライザー・レイヤー・カルーセル',
      items: [
        '28種類のリアクティブテーマと8つのカラーパレットを搭載。「新スタイル」で即座にランダム生成できます。',
        '「ミックス」で1〜2層の背景を重ね、「自動」で曲ごとにスタイルを切り替えます。',
        'ビジュアライザーで「カルーセル」を選ぶと、5 / 10 / 15 / 20 / 25 / 30 秒ボタンが表示され、1曲の中でも背景を自動ローテーションできます。',
      ],
    },
    {
      id: 'orbs',
      title: '3. ゼンモード＆浮遊トラック球体',
      items: [
        '背景（または目のアイコン）をタップすると UI が消え、音楽に反応する球体だけが表示されます。',
        '他の球体タップで曲切替、再生中の球体タップで一時停止/再生。「球体」と「曲名」は個別に切替可能です。',
        'もう一度背景をタップすると操作パネルに戻ります。',
      ],
    },
    {
      id: 'backdrop',
      title: '4. 背景・ライブカメラ・マイク',
      items: [
        '「背景」から再生を止めずに写真・動画・カメラ・マイクを重ねられます。',
        'フレーム動作（固定・浮遊・回転）や全画面表示（アニメあり・球体のみ・アニメなし）を選べます。',
        '写真や動画の背景中にカメラをオンにするとピクチャーインピクチャーになります。',
        'カメラ起動時は音声付き録画のためマイクも自動接続（エコー抑制あり）され、楽曲・動画・マイク音量をミキサーで調整できます。',
      ],
    },
    {
      id: 'studio',
      title: '5. スペーススタジオ＆MP4録画',
      items: [
        'Playボタンを0.6秒長押しするとスタジオ＆録画モードが起動し、上部に録画バーが表示されます。',
        '操作：枠をドラッグで移動、タップで形状変更、長押しで変形/拡大縮小/回転、背景タップでスタイル更新。',
        '比率（9:16, 1:1, 16:9）、画質（480, 720, 1080）、方式（高速＝カメラ/マイク必須、高画質＝コマ落ちなしHQ MP4）を設定できます。',
        '赤い録画ボタンで開始し、停止ボタンで .mp4 を保存します。',
      ],
    },
    {
      id: 'audioAndApp',
      title: '6. イコライザー・全画面・PWA',
      items: [
        '5バンドイコライザー（60Hz〜14kHz）とプリセットが再生とMP4出力の両方に反映されます。',
        '上部またはメニューから全画面切替や、オフライン対応アプリ（PWA）のインストールが可能です。',
      ],
    },
  ],
};

const KO_HELP: HelpMessages = {
  helpBtnLabel: '도움말',
  helpMenuBtn: '상세 가이드 및 전체 기능',
  helpModalTitle: 'YRitmX — 전체 사용 가이드',
  helpModalSubtitle: '오디오, 비디오, 스페이스 스튜디오 & MP4 저장',
  helpCloseBtn: '확인',
  sections: [
    {
      id: 'sources',
      title: '1. 음악, 사진 및 동영상 소스',
      items: [
        '앨범 커버 또는 Audius / 폴더 / URL 버튼을 눌러 소스를 선택하세요.',
        '로컬 폴더/파일은 MP3, WAV, FLAC, OGG, M4A(ID3 커버 포함)와 동영상(.mp4, .webm, .mov), 사진(.jpg, .png, .webp)을 지원합니다.',
        '여러 사진과 동영상을 선택하면 순서대로 재생됩니다(사진은 각 5초). 화면에 파일을 드래그 앤 드롭할 수도 있습니다.',
        'URL은 Audius 프로필, GitHub 폴더, Archive.org, JSON/M3U/RSS 및 직접 MP3 링크를 지원합니다.',
      ],
    },
    {
      id: 'visuals',
      title: '2. 시각화, 레이어 믹스 & 캐러셀',
      items: [
        '28가지 반응형 테마와 8가지 색상 팔레트를 선택하거나 새 스타일로 즉시 무작위 조합하세요.',
        '레이어 믹스는 1~2개의 추가 우주 효과를 겹치며, 자동 변경은 트랙이 바뀔 때마다 배경을 전환합니다.',
        '시각화 모드에서 캐러셀을 선택하면 5, 10, 15, 20, 25, 30초 버튼이 나타나 한 곡 안에서도 주기적으로 배경을 자동 전환합니다.',
      ],
    },
    {
      id: 'orbs',
      title: '3. 젠 모드 및 떠다니는 트랙 구체',
      items: [
        '빈 배경(또는 눈 아이콘)을 누르면 UI가 숨겨지고 비트에 반응하는 트랙 구체만 표시됩니다.',
        '다른 구체를 누르면 트랙 전환, 재생 중 구체를 누르면 재생/일시정지됩니다. 구체와 제목 표시는 따로 켤 수 있습니다.',
        '배경을 다시 누르면 조작 패널이 돌아옵니다.',
      ],
    },
    {
      id: 'backdrop',
      title: '4. 배경, 실시간 카메라 및 마이크',
      items: [
        '배경 메뉴에서 음악을 멈추지 않고 사진, 동영상, 실시간 카메라 또는 마이크를 추가하세요.',
        '프레임 움직임(고정, 부유, 회전) 또는 전체 화면 배경(애니메이션 포함, 구체만, 없음)을 선택할 수 있습니다.',
        '사진/동영상 배경 위에 카메라를 켜면 화면 속 화면(PIP)으로 작동합니다.',
        '카메라를 켜면 트랙 위에 영상과 소리를 함께 녹화하도록 마이크도 함께 연결되며(에코 필터 지원), 믹서에서 음량을 조절할 수 있습니다.',
      ],
    },
    {
      id: 'studio',
      title: '5. 스페이스 스튜디오 & MP4 녹화',
      items: [
        '재생(Play) 버튼을 0.6초 길게 누르면 스튜디오 모드와 상단 녹화 바가 열립니다.',
        '제스처: 프레임 드래그 이동, 탭으로 도형 변경, 길게 눌러 변형/크기/회전 조절, 배경 탭으로 스타일 새로고침.',
        '비율(9:16, 1:1, 16:9), 화질(480, 720, 1080), 렌더링(빠름=실시간·카메라/마이크 필수, 고화질=프레임별 HQ MP4)을 설정하세요.',
        '빨간 녹화 버튼을 눌러 시작하고 정지 버튼으로 .mp4 파일을 저장합니다.',
      ],
    },
    {
      id: 'audioAndApp',
      title: '6. 이퀄라이저, 전체 화면 & PWA',
      items: [
        '5밴드 이퀄라이저(60Hz~14kHz)와 프리셋이 감상과 MP4 내보내기에 모두 적용됩니다.',
        '상단 또는 메뉴에서 전체 화면을 전환하거나 오프라인 지원 앱(PWA)으로 설치할 수 있습니다.',
      ],
    },
  ],
};

const TR_HELP: HelpMessages = {
  helpBtnLabel: 'Yardım',
  helpMenuBtn: 'Detaylı Kılavuz ve Tüm Özellikler',
  helpModalTitle: 'YRitmX — Kullanım Kılavuzu',
  helpModalSubtitle: 'Ses, Video, Uzay Stüdyosu ve MP4 Kayıt',
  helpCloseBtn: 'Anladım',
  sections: [
    {
      id: 'sources',
      title: '1. Müzik, Fotoğraf ve Video Kaynakları',
      items: [
        'Kaynak seçmek için albüm kapağına veya Audius / Klasör / URL düğmelerine dokunun.',
        'Cihaz klasörleri MP3, WAV, FLAC, OGG, M4A (ID3 kapaklı) ile video (.mp4, .webm, .mov) ve fotoğrafları (.jpg, .png, .webp) destekler.',
        'Birden fazla fotoğraf ve video seçilirse sırayla oynatılır (her fotoğraf 5 sn kalır). Dosyaları sahneye sürükleyip bırakabilirsiniz.',
        'URL ile Audius profilleri, GitHub klasörleri, Archive.org, JSON/M3U/RSS ve doğrudan MP3 çalınabilir.',
      ],
    },
    {
      id: 'visuals',
      title: '2. Görseller, Katmanlar ve Karusel',
      items: [
        '28 reaktif tema ve 8 renk paleti seçin ya da Yeni Stil ile rastgele kombinasyon oluşturun.',
        'Katman Karıştır ana temanın arkasına 1–2 kozmik katman ekler; Oto-Arka Plan her parçada görseli değiştirir.',
        'Görselleştirme listesinde Döngü (Karusel) seçildiğinde aynı parça içinde 5, 10, 15, 20, 25 veya 30 sn’de bir arka plan değiştiren 6 düğme açılır.',
      ],
    },
    {
      id: 'orbs',
      title: '3. Zen Modu ve Yüzen Parça Küreleri',
      items: [
        'Arayüzü gizleyip yalnızca müziğe tepki veren küreleri görmek için arka plana (veya Göz simgesine) dokunun.',
        'Başka küreye dokunarak parça değiştirin, aktif küreye dokunarak duraklatın/oynatın. Küreler ve Başlıklar ayrı açılıp kapanır.',
        'Kontrolleri geri getirmek için tekrar arka plana dokunun.',
      ],
    },
    {
      id: 'backdrop',
      title: '4. Arka Plan, Canlı Kamera ve Mikrofon',
      items: [
        'Arka Plan menüsünden müziği durdurmadan fotoğraf, video, canlı Kamera veya Mikrofon ekleyin.',
        'Çerçeve hareketini (Sabit, Yüzen, Dönen) veya Tam Ekran modunu (Animasyonlu, Sadece Küre, Animasyonsuz) seçin.',
        'Fotoğraf/video varken Kamerayı açmak Resim İçinde Resim (tam ekran arka plan + üstte taşınabilir kamera çerçevesi) başlatır.',
        'Kamera açıldığında parça üzerine sesli video kaydı için Mikrofon da bağlanır (yankı filtreli); mikserden ses seviyelerini ayarlayın.',
      ],
    },
    {
      id: 'studio',
      title: '5. Uzay Stüdyosu ve MP4 Kayıt',
      items: [
        'Stüdyo ve üst kayıt çubuğunu açmak için Play düğmesine 0.6 sn basılı tutun.',
        'Hareketler: çerçeveyi sürükleyin; şekil için dokunun; ölçek/eğme/döndürme için basılı tutun; stil için arka plana dokunun.',
        'Oranı (9:16, 1:1, 16:9), kaliteyi (480, 720, 1080) ve modu seçin: Hızlı (gerçek zamanlı, Kamera/Mik için gerekli) veya Kalite (kare kare HQ MP4).',
        'Kırmızı kayıt düğmesiyle başlatın, Durdur ile .mp4 dosyasını indirin.',
      ],
    },
    {
      id: 'audioAndApp',
      title: '6. Ekolayzer, Tam Ekran ve PWA',
      items: [
        '5 bantlı ekolayzer (60 Hz – 14 kHz) ve hazır ayarlar hem dinlemede hem MP4 aktarımında çalışır.',
        'Üst çubuktan Tam Ekran açabilir veya uygulamayı çevrimdışı PWA olarak yükleyebilirsiniz.',
      ],
    },
  ],
};

const PL_HELP: HelpMessages = {
  helpBtnLabel: 'Pomoc',
  helpMenuBtn: 'Przewodnik i wszystkie funkcje',
  helpModalTitle: 'YRitmX — Przewodnik',
  helpModalSubtitle: 'Audio, wideo, Studio Kosmiczne i eksport MP4',
  helpCloseBtn: 'Rozumiem',
  sections: [
    {
      id: 'sources',
      title: '1. Źródła muzyki, zdjęć i wideo',
      items: [
        'Kliknij okładkę lub przyciski Audius / Folder / URL, aby wybrać źródło.',
        'Lokalne foldery obsługują MP3, WAV, FLAC, OGG, M4A (z okładkami ID3) oraz wideo (.mp4, .webm, .mov) i zdjęcia (.jpg, .png, .webp).',
        'Wiele wybranych zdjęć i filmów odtwarza się po kolei (każde zdjęcie przez 5 s). Pliki można też przeciągnąć na scenę.',
        'URL obsługuje profile Audius, foldery GitHub, Archive.org, listy JSON/M3U/RSS i bezpośrednie MP3.',
      ],
    },
    {
      id: 'visuals',
      title: '2. Wizualizacje, Warstwy i Karuzela',
      items: [
        'Wybierz spośród 28 reaktywnych motywów i 8 palet albo kliknij Nowy styl.',
        'Miks warstw nakłada 1–2 kosmiczne warstwy tła; Auto-tło zmienia wygląd przy nowym utworze.',
        'Wybierz Karuzelę w trybie wizualizacji, aby automatycznie zmieniać tła i warstwy w trakcie jednego utworu co 5, 10, 15, 20, 25 lub 30 s.',
      ],
    },
    {
      id: 'orbs',
      title: '3. Tryb Zen i latające sfery',
      items: [
        'Kliknij tło (lub ikonę Oka), aby ukryć panel i zostawić tylko reaktywne sfery utworów.',
        'Kliknij inną sferę by zmienić utwór, a aktywną by włączyć Play/Pauzę. Sfery i Podpisy przełączysz osobno.',
        'Ponowne kliknięcie tła przywraca interfejs.',
      ],
    },
    {
      id: 'backdrop',
      title: '4. Własne tło, Kamera na żywo i Mikrofon',
      items: [
        'Przycisk Tło pozwala dodać zdjęcia, wideo, Kamerę lub Mikrofon bez zatrzymywania muzyki.',
        'Ustaw ruch ramki (Stała, Pływająca, Obrotowa) lub Pełny ekran (Z animacją, Tylko sfera, Bez animacji).',
        'Włączenie Kamery przy aktywnym zdjęciu/wideo uruchamia tryb Obraz w obrazie.',
        'Kamera automatycznie podłącza też Mikrofon (z filtrem echa), aby nagrywać wideo z głosem na tle muzyki; głośność ustawisz w mikserze.',
      ],
    },
    {
      id: 'studio',
      title: '5. Studio Kosmiczne i zapis MP4',
      items: [
        'Przytrzymaj Play 0,6 s, aby włączyć Studio i górny pasek nagrywania.',
        'Gesty: przeciągaj ramkę; stuknij by zmienić kształt; przytrzymaj ramkę by skalować/obracać; kliknij tło by zmienić styl.',
        'Wybierz proporcje (9:16, 1:1, 16:9), jakość (480, 720, 1080) i render: Szybki (na żywo, dla Kamery/Mik) lub Jakość (klatka po klatce HQ MP4).',
        'Naciśnij czerwony przycisk by nagrywać i Stop by pobrać MP4.',
      ],
    },
    {
      id: 'audioAndApp',
      title: '6. Korektor, Pełny ekran i PWA',
      items: [
        '5-pasmowy korektor (60 Hz – 14 kHz) z presetami działa podczas słuchania i eksportu MP4.',
        'Przełączaj Pełny ekran lub zainstaluj YRitmX jako aplikację PWA offline.',
      ],
    },
  ],
};

const AR_HELP: HelpMessages = {
  helpBtnLabel: 'مساعدة',
  helpMenuBtn: 'الدليل الكامل وجميع الميزات',
  helpModalTitle: 'YRitmX — الدليل الشامل',
  helpModalSubtitle: 'الصوت والفيديو والاستوديو وتصدير MP4',
  helpCloseBtn: 'فهمت',
  sections: [
    {
      id: 'sources',
      title: '1. مصادر الموسيقى والصور والفيديو',
      items: [
        'انقر على غلاف المقطع أو أزرار Audius / مجلد / رابط لاختيار المصدر.',
        'تدعم مجلدات الجهاز ملفات MP3 وWAV وFLAC وOGG وM4A (مع أغلفة ID3)، بالإضافة إلى الفيديو (.mp4/.webm/.mov) والصور (.jpg/.png/.webp).',
        'عند اختيار عدة صور ومقاطع فيديو تُعرض بالتتابع (5 ثوانٍ لكل صورة)، كما يمكنك سحب الملفات وإفلاتها على المسرح.',
        'يدعم الرابط ملفات Audius ومجلدات GitHub وArchive.org وقوائم JSON/M3U/RSS وروابط MP3 المباشرة.',
      ],
    },
    {
      id: 'visuals',
      title: '2. المؤثرات البصرية والطبقات والدوّار',
      items: [
        'اختر من بين 28 مؤثراً تفاعلياً و8 لوحات ألوان، أو اضغط مظهر جديد للتبديل العشوائي.',
        'يمزج خيار الطبقات 1–2 خلفية كونية إضافية، بينما يبدّل الخلفية التلقائية المظهر مع كل مقطع.',
        'اختر دوّار (كاروسيل) من قائمة العرض لتظهر 6 أزرار (5، 10، 15، 20، 25، 30 ث) لتبديل الخلفيات تلقائياً داخل المقطع الواحد.',
      ],
    },
    {
      id: 'orbs',
      title: '3. وضع الزن وكرات المقاطع العائمة',
      items: [
        'انقر على الخلفية الفارغة (أو أيقونة العين) لإخفاء الأزرار وإظهار كرات المقاطع المتفاعلة مع الإيقاع.',
        'انقر على أي كرة لتبديل المقطع أو الكرة النشطة للإيقاف/التشغيل. يمكن التحكم في الكرات والعناوين بشكل منفصل.',
        'انقر على الخلفية مرة أخرى لإعادة عناصر التحكم.',
      ],
    },
    {
      id: 'backdrop',
      title: '4. الخلفية والكاميرا والميكروفون',
      items: [
        'افتح الخلفية لإضافة صور أو فيديو أو كاميرا مباشرة أو ميكروفون فوق الموسيقى دون إيقافها.',
        'اختر حركة الإطار (ثابت، عائم، دوّار) أو ملء الشاشة (مع حركة، الكرة فقط، بدون حركة).',
        'تشغيل الكاميرا مع خلفية صورة/فيديو يفعّل وضع صورة داخل صورة.',
        'تشغيل الكاميرا يربط الميكروفون أيضاً (مع مرشح الصدى) لتسجيل الفيديو والصوت فوق الموسيقى وضبط مستويات الصوت من المازج.',
      ],
    },
    {
      id: 'studio',
      title: '5. وضع الاستوديو وتسجيل MP4',
      items: [
        'اضغط مطولاً على زر التشغيل لمدة 0.6 ثانية لتفعيل الاستوديو وإظهار شريط التسجيل العلوي.',
        'الإيماءات: اسحب الإطار لتحريكه، انقر لتغيير الشكل، اضغط مطولاً للتكبير والتدوير، وانقر الخلفية لتغيير النمط.',
        'حدد النسبة (9:16، 1:1، 16:9) والجودة (480، 720، 1080) والمحرك: سريع (فوري للكاميرا والميكروفون) أو جودة (تصيير HQ MP4 إطاراً بإطار).',
        'اضغط زر التسجيل الأحمر للبدء ثم إيقاف لتنزيل ملف MP4.',
      ],
    },
    {
      id: 'audioAndApp',
      title: '6. المعادل وملء الشاشة والتثبيت',
      items: [
        'معادل صوت خماسي النطاقات (60 هرتز – 14 كيلوهرتز) مع إعدادات جاهزة يعمل أثناء الاستماع والتصدير.',
        'يمكنك تفعيل ملء الشاشة أو تثبيت YRitmX كتطبيق PWA للعمل دون إنترنت.',
      ],
    },
  ],
};

const HI_HELP: HelpMessages = {
  helpBtnLabel: 'मदद',
  helpMenuBtn: 'पूर्ण गाइड और सभी सुविधाएँ',
  helpModalTitle: 'YRitmX — उपयोग गाइड',
  helpModalSubtitle: 'ऑडियो, वीडियो, स्पेस स्टूडियो और MP4 एक्सपोर्ट',
  helpCloseBtn: 'समझ गया',
  sections: [
    {
      id: 'sources',
      title: '1. संगीत, फ़ोटो और वीडियो स्रोत',
      items: [
        'स्रोत चुनने के लिए एल्बम कवर या Audius / फ़ोल्डर / URL बटन पर टैप करें।',
        'डिवाइस फ़ोल्डर MP3, WAV, FLAC, OGG, M4A (ID3 कवर सहित) तथा वीडियो (.mp4/.webm/.mov) और फ़ोटो (.jpg/.png/.webp) सपोर्ट करते हैं।',
        'कई फ़ोटो और वीडियो चुनने पर वे क्रम से चलते हैं (हर फ़ोटो 5 सेकंड)। फ़ाइलें सीधे स्टेज पर ड्रैग-ड्रॉप कर सकते हैं।',
        'URL में Audius प्रोफ़ाइल, GitHub फ़ोल्डर, Archive.org, JSON/M3U/RSS प्लेलिस्ट और डायरेक्ट MP3 चलते हैं।',
      ],
    },
    {
      id: 'visuals',
      title: '2. विज़ुअल, लेयर्स और कैरोसेल',
      items: [
        '28 रिएक्टिव थीम और 8 रंग पैलेट चुनें, या नया लुक बटन से रैंडम स्टाइल बनाएँ।',
        'लेयर मिक्स मुख्य थीम के पीछे 1–2 कॉस्मिक इफ़ेक्ट जोड़ता है; ऑटो-बैकग्राउंड हर ट्रैक पर बदलता है।',
        'विज़ुअलाइज़ेशन सूची में कैरोसेल चुनने पर 5, 10, 15, 20, 25, 30 सेकंड के 6 बटन दिखते हैं, जो एक ही ट्रैक के दौरान पृष्ठभूमि बदलते हैं।',
      ],
    },
    {
      id: 'orbs',
      title: '3. ज़ेन मोड और तैरते ट्रैक गोले',
      items: [
        'इंटरफ़ेस छिपाने और केवल बीट पर थिरकते ट्रैक गोले देखने के लिए खाली पृष्ठभूमि (या आँख आइकन) पर टैप करें।',
        'दूसरे गोले पर टैप से ट्रैक बदलें, सक्रिय गोले पर प्ले/पॉज़ करें। गोले और शीर्षक अलग से ऑन/ऑफ होते हैं।',
        'पृष्ठभूमि पर दोबारा क्लिक करने से नियंत्रण वापस आ जाते हैं।',
      ],
    },
    {
      id: 'backdrop',
      title: '4. पृष्ठभूमि, लाइव कैमरा और माइक्रोफ़ोन',
      items: [
        'पृष्ठभूमि खोलकर संगीत रोके बिना फ़ोटो, वीडियो, लाइव कैमरा या माइक्रोफ़ोन जोड़ें।',
        'फ़्रेम गति (स्थिर, तैरता, घूमता) या पूर्ण स्क्रीन (एनिमेशन सहित, केवल गोला, बिना एनिमेशन) चुनें।',
        'फ़ोटो/वीडियो के साथ कैमरा चालू करने पर पिक्चर-इन-पिक्चर सक्रिय होता है।',
        'कैमरा चालू करने पर ट्रैक के ऊपर आवाज़ सहित वीडियो रिकॉर्डिंग के लिए माइक्रोफ़ोन भी जुड़ता है (इको फ़िल्टर सहित)।',
      ],
    },
    {
      id: 'studio',
      title: '5. स्पेस स्टूडियो और MP4 रिकॉर्डिंग',
      items: [
        'स्टूडियो और ऊपरी रिकॉर्डिंग बार खोलने के लिए Play बटन को 0.6 सेकंड दबाए रखें।',
        'इशारे: फ़्रेम खींचकर हिलाएँ; आकार बदलने को टैप करें; स्केल/घुमाने के लिए दबाए रखें; स्टाइल के लिए पृष्ठभूमि टैप करें।',
        'अनुपात (9:16, 1:1, 16:9), गुणवत्ता (480, 720, 1080) और मोड चुनें: तेज़ (रीयल-टाइम, कैमरा/माइक हेतु) या गुणवत्ता (फ़्रेम-दर-फ़्रेम HQ MP4)।',
        'लाल रिकॉर्ड बटन से शुरू करें और स्टॉप दबाकर MP4 डाउनलोड करें।',
      ],
    },
    {
      id: 'audioAndApp',
      title: '6. इक्वलाइज़र, फुलस्क्रीन और PWA',
      items: [
        '5-बैंड इक्वलाइज़र (60 Hz – 14 kHz) और प्रीसेट सुनने तथा MP4 एक्सपोर्ट दोनों में काम करते हैं।',
        'ऊपरी बार या मेनू से फुलस्क्रीन चलाएँ या ऑफ़लाइन PWA ऐप इंस्टॉल करें।',
      ],
    },
  ],
};

const UZ_HELP: HelpMessages = {
  helpBtnLabel: 'Yordam',
  helpMenuBtn: 'To‘liq qo‘llanma va barcha funksiyalar',
  helpModalTitle: 'YRitmX — Batafsil qo‘llanma',
  helpModalSubtitle: 'Audio, video, Studiya va MP4 yozish',
  helpCloseBtn: 'Tushunarli',
  sections: [
    {
      id: 'sources',
      title: '1. Musiqa, rasm va video manbalari',
      items: [
        'Manba tanlash uchun trek muqovasini yoki Audius / Papka / URL tugmalarini bosing.',
        'Qurilma papkalari MP3, WAV, FLAC, OGG, M4A (ID3 muqovalari bilan), shuningdek video (.mp4, .webm, .mov) va rasmlarni (.jpg, .png, .webp) qo‘llab-quvvatlaydi.',
        'Bir nechta rasm va video tanlansa, ketma-ket ijro etiladi (har bir rasm 5 soniya). Fayllarni sahnaga sudrab tashlash ham mumkin.',
        'URL orqali Audius, GitHub papkalari, Archive.org, JSON/M3U/RSS va to‘g‘ridan-to‘g‘ri MP3 oqimlarini oching.',
      ],
    },
    {
      id: 'visuals',
      title: '2. Vizualizatsiya, Qatlamlar va Karusel',
      items: [
        '28 ta reaktiv mavzu va 8 ta rang palitrasi mavjud, «Yangi ko‘rinish» esa tasodifiy uslub yaratadi.',
        '«Qatlamlar (Mix)» asosiy mavzu ortiga 1–2 kosmik effekt qo‘shadi; «Avto-fon» har trekda ko‘rinishni almashtiradi.',
        'Vizualizatsiya ro‘yxatida «Karusel»ni tanlasangiz, bitta trek davomida fonni har 5, 10, 15, 20, 25 yoki 30 soniyada almashtiruvchi 6 ta tugma chiqadi.',
      ],
    },
    {
      id: 'orbs',
      title: '3. Zen rejimi va uchuvchi sferalar',
      items: [
        'Boshqaruv panelini yashirib faqat musiqaga mos uchuvchi sferalarni qoldirish uchun bo‘sh fonni (yoki Ko‘z tugmasini) bosing.',
        'Boshqa sferaga bosish trekni almashtiradi, faol sferaga bosish Pauza/Play qiladi. Sferalar va sarlavhalar alohida yoqiladi.',
        'Fonga qayta bosish interfeysni tiklaydi.',
      ],
    },
    {
      id: 'backdrop',
      title: '4. Shaxsiy fon, Jonli kamera va Mikrofon',
      items: [
        '«Fon» tugmasi orqali musiqani to‘xtatmasdan rasm, video, jonli Kamera yoki Mikrofon qo‘shing.',
        'Ramka harakati (Qo‘zg‘almas, Suzuvchi, Aylanuvchi) yoki To‘liq ekran rejimini (Animatsiya bilan, Faqat sfera, Animatsiyasiz) tanlang.',
        'Rasm/video fon ustida Kamerani yoqsangiz, rasm-ichida-rasm rejimi ishga tushadi.',
        'Kamera yoqilganda trek ustiga ovozli video yozish uchun Mikrofon ham ulanadi (aks-sado filtri bilan); mikserda tovush balandligini sozlang.',
      ],
    },
    {
      id: 'studio',
      title: '5. Studiya rejimi va MP4 yozish',
      items: [
        'Studiya rejimi va yuqori yozish panelini ochish uchun Play tugmasini 0.6 soniya bosib turing.',
        'Imo-ishoralar: ramkani suring; shakl o‘zgartirish uchun bosing; o‘lcham va burish uchun ushlab turing; uslubni yangilash uchun fonni bosing.',
        'Nisbat (9:16, 1:1, 16:9), sifat (480, 720, 1080) va rejimni tanlang: «Tez» (real vaqt, Kamera/Mikrofon uchun) yoki «Sifatli» (kadrma-kadr HQ MP4).',
        'Qizil yozish tugmasi bilan boshlang va saqlash uchun Stop tugmasini bosing.',
      ],
    },
    {
      id: 'audioAndApp',
      title: '6. Ekvalayzer, To‘liq ekran va PWA',
      items: [
        '5 diapazonli ekvalayzer (60 Hz – 14 kHz) tinglashda ham, MP4 eksportida ham ishlaydi.',
        'Yuqori panel yoki menyudan To‘liq ekranni yoqing hamda pleyerni oflayn PWA ilova sifatida o‘rnating.',
      ],
    },
  ],
};

const KK_HELP: HelpMessages = {
  helpBtnLabel: 'Анықтама',
  helpMenuBtn: 'Толық анықтама және барлық мүмкіндіктер',
  helpModalTitle: 'YRitmX — Толық нұсқаулық',
  helpModalSubtitle: 'Аудио, бейне, Студия және MP4 жазу',
  helpCloseBtn: 'Түсінікті',
  sections: [
    {
      id: 'sources',
      title: '1. Музыка, фото және бейне көздері',
      items: [
        'Көзді таңдау үшін трек мұқабасын немесе Audius / Қалта / URL түймелерін басыңыз.',
        'Құрылғы қалталары MP3, WAV, FLAC, OGG, M4A (ID3 мұқабаларымен), сондай-ақ бейне (.mp4, .webm, .mov) және фото (.jpg, .png, .webp) қолдайды.',
        'Бірнеше фото мен бейне таңдалса, кезекпен ойнатылады (әр фото 5 секунд). Файлдарды экранға сүйреп тастауға да болады.',
        'URL арқылы Audius профильдерін, GitHub қалталарын, Archive.org, JSON/M3U/RSS тізімдерін және тікелей MP3 ашуға болады.',
      ],
    },
    {
      id: 'visuals',
      title: '2. Визуализация, Қабаттар және «Карусель»',
      items: [
        '28 реактивті тақырып пен 8 палитра қолжетімді; «Жаңа түр» түймесі кездейсоқ стиль жасайды.',
        '«Қабаттар (Mix)» негізгі фон артына 1–2 ғарыштық әсер қосады; «Авто-фон» әр тректе түрді ауыстырады.',
        'Визуализация тізімінде «Карусель» таңдасаңыз, бір трек ішінде фонды әр 5, 10, 15, 20, 25 не 30 с сайын ауыстыратын 6 түйме пайда болады.',
      ],
    },
    {
      id: 'orbs',
      title: '3. Дзен режимі және ұшатын шарлар',
      items: [
        'Басқару панелін жасырып тек әуенге ілесетін шарларды қалдыру үшін бос фонды (немесе Көз белгісін) басыңыз.',
        'Басқа шарды басу тректі ауыстырады, белсенді шар — Ойнату/Кідірту. Шарлар мен атаулар бөлек қосылады.',
        'Фонды қайта түрту интерфейсті қайтарады.',
      ],
    },
    {
      id: 'backdrop',
      title: '4. Арнайы фон, Тікелей камера және Микрофон',
      items: [
        '«Фон» батырмасы арқылы музыканы тоқтатпай фото, бейне, тікелей Камера немесе Микрофон қосыңыз.',
        'Жақтау қозғалысын (Тұрақты, Қалқымалы, Айналмалы) немесе Толық экранды (Анимациямен, Тек шар, Анимациясыз) таңдаңыз.',
        'Фото/бейне фонында Камераны қосу «сурет ішіндегі сурет» режимін іске қосады.',
        'Камера қосылғанда трек үстіне дыбысты бейне жазу үшін Микрофон да бірге қосылады (жаңғырық сүзгісімен); дыбыс деңгейін микшерде реттеңіз.',
      ],
    },
    {
      id: 'studio',
      title: '5. Студия режимі және MP4 жазу',
      items: [
        'Студия режимін және жоғарғы жазу панелін ашу үшін Play түймесін 0.6 секунд басып тұрыңыз.',
        'Қимылдар: жақтауды сүйреңіз; пішін үшін түртіңіз; өлшем/бұру үшін басып тұрыңыз; стильді жаңарту үшін фонды түртіңіз.',
        'Пішім (9:16, 1:1, 16:9), сапа (480, 720, 1080) және рендерді таңдаңыз: «Жылдам» (нақты уақыт, Камера/Микрофон үшін) немесе «Сапалы» (кадр-кадр HQ MP4).',
        'Қызыл жазу түймесімен бастап, сақтау үшін Тоқтату басыңыз.',
      ],
    },
    {
      id: 'audioAndApp',
      title: '6. Эквалайзер, Толық экран және PWA',
      items: [
        '5 жолақты эквалайзер (60 Гц – 14 кГц) тыңдау кезінде де, MP4 экспортында да жұмыс істейді.',
        'Жоғарғы панельден не мәзірден Толық экранды қосыңыз немесе офлайн PWA қолданбасын орнатыңыз.',
      ],
    },
  ],
};

const HELP_MAP: Record<SupportedLang, HelpMessages> = {
  en: EN_HELP,
  ru: RU_HELP,
  uk: UK_HELP,
  es: ES_HELP,
  fr: FR_HELP,
  de: DE_HELP,
  it: IT_HELP,
  pt: PT_HELP,
  zh: ZH_HELP,
  ja: JA_HELP,
  ko: KO_HELP,
  tr: TR_HELP,
  pl: PL_HELP,
  ar: AR_HELP,
  hi: HI_HELP,
  uz: UZ_HELP,
  kk: KK_HELP,
};

export function getHelpMessages(lang: SupportedLang): HelpMessages {
  return HELP_MAP[lang] ?? EN_HELP;
}
