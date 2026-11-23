import { SupportedLang } from './translations';

export type HelpSectionId =
  | 'sources'
  | 'visuals'
  | 'orbs'
  | 'backdrop'
  | 'studio'
  | 'audioAndApp'
  | 'gestures';

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
        'Tap the album cover or Audius / Folder / URL buttons to switch music sources, or swipe left/right on the square cover to launch the next/previous track (or next station on Radio).',
        'Tap the shimmering FM button in the bottom bar to cycle through 12 built-in radio stations (starting with 2 national channels for your language + 10 genre streams); long-press FM to open Media Sources.',
        'Device Folder & Files support MP3, WAV, FLAC, OGG, M4A (with ID3 cover art), plus MP4/WebM/MOV videos and JPG/PNG/WebP photos.',
        'Multiple selected photos and videos play in sequence automatically (each photo stays on screen for 5 seconds). You can also drag and drop media files onto the stage.',
        'URL supports 12 preloaded FM stations (2 national + 10 genre), Audius profiles, GitHub folders, Archive.org, JSON/M3U/PLS/RSS playlists, and direct audio streams.',
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
        'Swipe anywhere on the animation background in Floating Orbs mode to switch the visual theme without leaving Zen mode, or tap the background once to restore controls.',
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
      title: '6. Equalizer, Cloud Sync, Fullscreen & PWA',
      items: [
        'Open Equalizer (header or Menu) for 5 frequency bands (60 Hz – 14 kHz) and presets (Flat, Bass Boost, Electronic, Vocal, Night).',
        'Sign in with Email/Password or Google inside Media Sources to sync Audius profiles, Folders, and URLs across devices in one profile.',
        'Use Fullscreen in the top bar or Menu anytime, and install YRitmX via Install App to use it offline as a standalone PWA.',
      ],
    },
    {
      id: 'gestures',
      title: '7. Touch & Mouse Gestures',
      items: [
        'Square Cover: short tap opens Media Sources; swipe left or right to start the next or previous track (or next/previous station on Radio).',
        'FM Button (bottom bar): short tap switches stations sequentially (custom saved streams first, then 2 national + 10 genre channels); long-press (~0.6 s) opens Media Sources → URL.',
        'Play Button (bottom bar): short tap Plays/Pauses (or starts/stops Recording when Studio is armed); long-press (~0.6 s) opens or closes Space Studio & MP4 Recording Mode.',
        'Cosmic Background & Floating Orbs: short tap on empty background toggles Zen Mode; swipe anywhere on the animation background in Floating Orbs mode to switch the visual theme; tap any Orb to switch tracks or Play/Pause.',
        'Studio Frame Stage: drag the frame (or PiP Camera) to move it; short tap on the frame changes shape; long-press (~0.6 s) on the frame toggles resize/stretch/rotation handles; short tap on background randomizes theme and neon contour.',
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
        'Нажмите на обложку или кнопки Audius / Папка / URL для выбора источника, либо смахните (свайп) квадратную обложку трека или радио для переключения и запуска следующего трека/станции.',
        'Мерцающая кнопка FM на нижней панели последовательно переключает 12 встроенных радиостанций (начиная с 2 национальных каналов для выбранного языка и 10 жанровых); долгий тап по FM открывает «Источники медиа».',
        'Папка и файлы с устройства поддерживают MP3, WAV, FLAC, OGG, M4A (с чтением обложек из ID3), а также видео (.mp4, .webm, .mov) и фото (.jpg, .png, .webp).',
        'Если прикрепить несколько фото и видео сразу, они проигрываются по очереди (каждое фото показывается 5 секунд). Файлы можно перетаскивать прямо на экран.',
        'URL включает 12 готовых FM-станций (2 национальные + 10 жанровых), поддерживает профили Audius, папки GitHub, Archive.org, плейлисты JSON/M3U/PLS/RSS и прямые радиопотоки.',
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
        'Смахните по фону анимации в режиме летающих сфер, чтобы сменить тему визуализации прямо в Дзен-режиме; короткий клик по фону возвращает панель управления.',
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
      title: '6. Эквалайзер, Облако, Полный экран и PWA',
      items: [
        '5-полосный эквалайзер (60 Гц – 14 кГц) доступен в шапке и меню настроек; пресеты работают как при прослушивании, так и при записи MP4.',
        'Войдите по Email/паролю или через Google в «Источниках медиа», чтобы синхронизировать Audius, папки и URL-станции сразу для всех вкладок.',
        'Кнопка полноэкранного режима есть в шапке и меню. Плеер можно установить как отдельное приложение (PWA) для работы даже офлайн.',
      ],
    },
    {
      id: 'gestures',
      title: '7. Жесты, короткие и долгие нажатия',
      items: [
        'Квадратная обложка: короткий тап открывает «Источники медиа»; свайп влево/вправо запускает следующий или предыдущий трек (а на Радио — следующую или предыдущую FM-станцию).',
        'Кнопка FM (нижняя панель): короткий тап последовательно переключает станции (сначала ваши сохранённые потоки, затем 2 национальные и 10 жанровых); долгий тап (~0.6 с) открывает «Источники медиа → URL».',
        'Кнопка Play (нижняя панель): короткий тап включает Play/Пауза (или старт/стоп записи в Студии); долгий тап (~0.6 с) открывает или закрывает Режим Студии и записи MP4.',
        'Фон и летающие сферы: короткий тап по пустому фону включает/выключает Дзен-режим; свайп по фону анимации в режиме сфер меняет тему визуализации; тап по сфере переключает трек или ставит паузу.',
        'Сцена Студии: перетаскивание двигает фрейм (или окно камеры PiP); короткий тап по фрейму меняет форму; долгий тап (~0.6 с) по фрейму открывает рамку масштаба, растяжения и поворота; тап по фону меняет стиль и неон-контур.',
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
        'Натисніть на обкладинку або кнопки Audius / Тека / URL, або змахніть (свайп) квадратну обкладинку для запуску наступного треку чи наступної FM-станції.',
        'Мерехтлива кнопка FM на нижній панелі послідовно перемикає 12 вбудованих радіостанцій (спочатку 2 національні канали для вашої мови та 10 жанрових); довге натискання на FM відкриває «Джерела медіа».',
        'Тека і файли з пристрою підтримують MP3, WAV, FLAC, OGG, M4A (з обкладинками ID3), а також відео (.mp4, .webm, .mov) і фото (.jpg, .png, .webp).',
        'Якщо додати кілька фото та відео одночасно, вони відтворюються по черзі (кожне фото по 5 секунд). Файли можна перетягувати на екран.',
        'URL містить 12 готових FM-станцій (2 національні + 10 жанрових), підтримує Audius, теки GitHub, Archive.org, списки JSON/M3U/PLS/RSS та прямі радіопотоки.',
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
        'Змахніть по фону анімації в режимі летючих сфер, щоб змінити тему візуалізації; короткий клік по фону повертає елементи керування.',
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
      title: '6. Еквалайзер, Хмара, Повний екран і PWA',
      items: [
        '5-смуговий еквалайзер (60 Гц – 14 кГц) доступний у шапці та меню; пресети працюють під час прослуховування й експорту MP4.',
        'Увійдіть через Email/пароль або Google у «Джерелах медіа» для синхронізації Audius, тек і URL-станцій на всіх пристроях.',
        'Повноекранний режим доступний у шапці та меню; плеєр можна встановити як окремий PWA-додаток.',
      ],
    },
    {
      id: 'gestures',
      title: '7. Жести, короткі й довгі натискання',
      items: [
        'Квадратна обкладинка: короткий тап відкриває «Джерела медіа»; свайп ліворуч/праворуч запускає наступний або попередній трек (на Радіо — наступну чи попередню FM-станцію).',
        'Кнопка FM (нижня панель): короткий тап послідовно перемикає станції (спочатку ваші збережені потоки, далі 2 національні й 10 жанрових); довгий тап (~0.6 с) відкриває «Джерела медіа → URL».',
        'Кнопка Play (нижня панель): короткий тап керує відтворенням (або стартом/стопом запису в Студії); довгий тап (~0.6 с) відкриває чи закриває Режим Студії та запису MP4.',
        'Фон і летючі сфери: короткий тап по фону вмикає/вимикає Дзен-режим; свайп по фону анімації в режимі сфер змінює тему візуалізації; тап по сфері перемикає трек або паузу.',
        'Сцена Студії: перетягування рухає фрейм (або вікно камери PiP); короткий тап по фрейму змінює форму; довгий тап (~0.6 с) вмикає рамку масштабу, розтягування й обертання; тап по фону оновлює стиль і контур.',
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
        'Toca la carátula o Audius / Carpeta / URL, o desliza sobre la carátula cuadrada para iniciar la siguiente pista o estación FM.',
        'El botón brillante FM de la barra inferior cambia entre 12 emisoras integradas (2 nacionales según tu idioma + 10 por género); mantén pulsado FM para abrir Fuentes multimedia.',
        'Las carpetas y archivos locales admiten MP3, WAV, FLAC, OGG, M4A (con carátulas ID3), además de vídeos (.mp4, .webm, .mov) y fotos (.jpg, .png, .webp).',
        'Si seleccionas varias fotos y vídeos, se reproducen en secuencia (cada foto dura 5 s). También puedes arrastrar archivos al escenario.',
        'URL incluye 12 emisoras FM preconfiguradas (2 nacionales + 10 por género) y admite Audius, GitHub, Archive.org, listas JSON/M3U/PLS/RSS y transmisiones en vivo.',
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
        'Desliza sobre el fondo animado en modo de esferas flotantes para cambiar el tema visual; un toque corto en el fondo restaura la interfaz.',
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
      title: '6. Ecualizador, Nube, Pantalla completa y PWA',
      items: [
        'Ecualizador de 5 bandas (60 Hz – 14 kHz) disponible en el encabezado o menú, activo en reproducción y exportación MP4.',
        'Inicia sesión con Email/contraseña o Google en Fuentes para sincronizar Audius, carpetas y URLs en todos tus dispositivos.',
        'Activa Pantalla completa desde el encabezado/menú o instala YRitmX como aplicación PWA.',
      ],
    },
    {
      id: 'gestures',
      title: '7. Gestos, toques cortos y largos',
      items: [
        'Carátula cuadrada: toque corto abre Fuentes multimedia; desliza a izquierda/derecha para iniciar la pista siguiente/anterior (o emisora FM siguiente/anterior).',
        'Botón FM (barra inferior): toque corto alterna emisoras en orden (primero tus streams guardados, luego 2 nacionales + 10 por género); toque largo (~0.6 s) abre Fuentes → URL.',
        'Botón Play (barra inferior): toque corto reproduce/pausa (o inicia/detiene grabación en Estudio); toque largo (~0.6 s) abre o cierra el Estudio Espacial y grabación MP4.',
        'Fondo cósmico y esferas: toque corto en el fondo activa/desactiva Modo Zen; desliza sobre el fondo animado en modo esferas para cambiar el tema visual; toca una esfera para cambiar de pista o Play/Pausa.',
        'Escenario del Estudio: arrastra el marco (o la cámara PiP) para moverlo; toque corto cambia la forma; toque largo (~0.6 s) activa controles de escala/estiramiento/rotación; toque corto en el fondo cambia estilo y neón.',
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
        'Touchez la pochette ou Audius / Dossier / URL, ou balayez la pochette carrée pour lancer la piste suivante ou la station radio suivante.',
        'Le bouton scintillant FM en bas enchaîne 12 stations radio intégrées (2 nationales selon la langue + 10 par genre) ; un appui long sur FM ouvre les Sources média.',
        'Les dossiers locaux lisent MP3, WAV, FLAC, OGG, M4A (avec pochettes ID3), ainsi que les vidéos (.mp4, .webm, .mov) et photos (.jpg, .png, .webp).',
        'Plusieurs photos/vidéos s’enchaînent automatiquement (5 s par photo). Glissez-déposez aussi vos fichiers sur l’écran.',
        'URL inclut 12 radios FM intégrées (2 nationales + 10 par genre) et prend en charge Audius, GitHub, Archive.org, playlists JSON/M3U/PLS/RSS et flux directs.',
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
        'Balayez le fond animé en mode sphères flottantes pour changer le thème visuel ; un appui court sur le fond réaffiche l’interface.',
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
      title: '6. Égaliseur, Cloud, Plein écran et PWA',
      items: [
        'Égaliseur 5 bandes (60 Hz – 14 kHz) dans l’en-tête ou le menu, actif en lecture et en export MP4.',
        'Connectez-vous par Email/mot de passe ou Google dans Sources pour synchroniser Audius, dossiers et URL sur tous vos appareils.',
        'Mode Plein écran disponible dans la barre supérieure/menu, et installation PWA pour l’usage hors ligne.',
      ],
    },
    {
      id: 'gestures',
      title: '7. Gestes, appuis courts et longs',
      items: [
        'Pochette carrée : appui court ouvre Sources média ; balayage gauche/droite lance le morceau ou la radio FM suivant/précédent.',
        'Bouton FM (barre inférieure) : appui court fait défiler les stations (vos flux enregistrés d’abord, puis 2 nationales + 10 genres) ; appui long (~0,6 s) ouvre Sources → URL.',
        'Bouton Play (barre inférieure) : appui court Play/Pause (ou Enregistrer/Stop en Studio) ; appui long (~0,6 s) ouvre ou ferme le Studio Spatial et l’enregistrement MP4.',
        'Arrière-plan et sphères : appui court sur le fond vide active/quitte le Mode Zen ; balayage sur le fond animé en mode sphères change le thème visuel ; touchez une sphère pour changer de piste ou Play/Pause.',
        'Scène du Studio : glissez le cadre (ou la caméra PiP) pour le déplacer ; appui court sur le cadre change la forme ; appui long (~0,6 s) affiche les poignées de taille/étirement/rotation ; appui court sur le fond renouvelle style et néon.',
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
        'Tippe auf das Cover oder Audius / Ordner / URL, oder wische über das quadratische Cover zum Starten des nächsten Tracks bzw. Radiosenders.',
        'Die schimmernde FM-Taste schaltet 12 integrierte Radiosender durch (zuerst 2 nationale Sender für deine Sprache + 10 Genre-Streams); langes Drücken auf FM öffnet die Medienquellen.',
        'Lokale Ordner unterstützen MP3, WAV, FLAC, OGG, M4A (inkl. ID3-Covern) sowie Videos (.mp4, .webm, .mov) und Fotos (.jpg, .png, .webp).',
        'Mehrere Fotos & Videos laufen nacheinander (Fotos je 5 Sek.). Dateien lassen sich auch direkt auf die Bühne ziehen.',
        'URL enthält 12 FM-Radiosender (2 nationale + 10 Genre-Sender) und unterstützt Audius, GitHub, Archive.org, JSON/M3U/PLS/RSS sowie direkte Streams.',
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
        'Wische im Sphären-Modus über den animierten Hintergrund, um das Visual-Theme zu wechseln; kurzes Tippen bringt die Steuerung zurück.',
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
      title: '6. Equalizer, Cloud-Sync, Vollbild & PWA',
      items: [
        '5-Band-Equalizer (60 Hz – 14 kHz) in Kopfzeile/Menü für Wiedergabe und MP4-Export.',
        'Melde dich in den Quellen per E-Mail/Passwort oder Google an, um Audius, Ordner und URLs geräteübergreifend zu synchronisieren.',
        'Vollbild über Kopfzeile/Menü steuerbar; als eigenständige PWA offline installierbar.',
      ],
    },
    {
      id: 'gestures',
      title: '7. Gesten, kurzes & langes Tippen',
      items: [
        'Quadratisches Cover: kurzes Tippen öffnet Medienquellen; Wischen nach links/rechts startet den nächsten/vorherigen Track (oder Radiosender).',
        'FM-Taste (unten): kurzes Tippen schaltet Sender nacheinander durch (zuerst gespeicherte Streams, dann 2 nationale + 10 Genre-Sender); langes Drücken (~0,6 s) öffnet Quellen → URL.',
        'Play-Taste (unten): kurzes Tippen für Play/Pause (oder Aufnahme Start/Stopp im Studio); langes Drücken (~0,6 s) öffnet oder schließt Space Studio & MP4-Aufnahme.',
        'Hintergrund & Sphären: kurzes Tippen auf den Hintergrund wechselt in den Zen-Modus; Wischen über den animierten Hintergrund im Sphären-Modus wechselt das Theme; Tippen auf eine Sphäre steuert Trackwechsel oder Play/Pause.',
        'Studio-Bühne: Rahmen (oder PiP-Kamera) per Ziehen verschieben; kurzes Tippen ändert die Form; langes Drücken (~0,6 s) öffnet Skalier-/Streck-/Drehpunkte; kurzes Tippen auf den Hintergrund erneuert Stil & Neon.',
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
        'Tocca la copertina o Audius / Cartella / URL, oppure scorri sulla copertina quadrata per avviare il brano o la stazione FM successiva.',
        'Il pulsante scintillante FM alterna 12 stazioni radio integrate (prima 2 nazionali per la tua lingua + 10 di genere); una pressione prolungata su FM apre le Sorgenti multimediali.',
        'Le cartelle locali leggono MP3, WAV, FLAC, OGG, M4A (con copertine ID3), più video (.mp4, .webm, .mov) e foto (.jpg, .png, .webp).',
        'Più foto e video vengono riprodotti in sequenza (5 s per foto); supportato anche il drag & drop.',
        'URL include 12 radio FM predefinite (2 nazionali + 10 di genere) e supporta Audius, GitHub, Archive.org, JSON/M3U/PLS/RSS e stream diretti.',
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
        'Scorri sullo sfondo animato in modalità sfere fluttuanti per cambiare tema visivo; un tocco breve ripristina i comandi.',
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
      title: '6. Equalizzatore, Cloud, Schermo intero e PWA',
      items: [
        'Equalizzatore a 5 bande (60 Hz – 14 kHz) accessibile dall’intestazione o dal menu, attivo anche nell’esportazione MP4.',
        'Accedi con Email/Password o Google in Sorgenti per sincronizzare Audius, cartelle e URL su più dispositivi.',
        'Schermo intero disponibile nell’intestazione o nel menu; installabile come app PWA.',
      ],
    },
    {
      id: 'gestures',
      title: '7. Gesti, tocchi brevi e prolungati',
      items: [
        'Copertina quadrata: tocco breve apre Sorgenti multimediali; scorrimento destra/sinistra avvia il brano o la stazione FM successiva/precedente.',
        'Pulsante FM (barra inferiore): tocco breve scorre le stazioni (prima gli stream salvati, poi 2 nazionali + 10 di genere); pressione prolungata (~0,6 s) apre Sorgenti → URL.',
        'Pulsante Play (barra inferiore): tocco breve Play/Pausa (o Avvia/Stop registrazione in Studio); pressione prolungata (~0,6 s) apre o chiude Space Studio e registrazione MP4.',
        'Sfondo e sfere: tocco breve sullo sfondo vuoto attiva/esce da Zen; scorrimento sullo sfondo animato in modalità sfere cambia tema visivo; tocco su una sfera cambia brano o Play/Pausa.',
        'Scena Studio: trascina la cornice (o la camera PiP) per spostarla; tocco breve sulla cornice cambia forma; pressione prolungata (~0,6 s) mostra le maniglie di scala/rotazione; tocco sullo sfondo rinnova stile e neon.',
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
        'Toque na capa ou em Audius / Pasta / URL, ou deslize na capa quadrada para iniciar a próxima faixa ou estação FM.',
        'O botão brilhante FM alterna entre 12 rádios integradas (2 nacionais do seu idioma primeiro + 10 por gênero); pressione e segure FM para abrir Fontes de mídia.',
        'Pastas locais reproduzem MP3, WAV, FLAC, OGG, M4A (com capas ID3), além de vídeos (.mp4, .webm, .mov) e fotos (.jpg, .png, .webp).',
        'Várias fotos e vídeos tocam em sequência (5 s por foto). Você também pode arrastar arquivos para a tela.',
        'URL inclui 12 rádios FM prontas (2 nacionais + 10 por gênero) e aceita Audius, GitHub, Archive.org, listas JSON/M3U/PLS/RSS e streams diretos.',
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
        'Deslize pelo fundo animado no modo de esferas flutuantes para trocar o tema visual; um toque curto no fundo restaura a interface.',
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
      title: '6. Equalizador, Nuvem, Tela cheia e PWA',
      items: [
        'Equalizador de 5 bandas (60 Hz – 14 kHz) no topo ou menu, aplicado na reprodução e no MP4.',
        'Entre com E-mail/senha ou Google em Fontes para sincronizar Audius, pastas e URLs entre dispositivos.',
        'Tela cheia disponível no topo ou menu; instale como app PWA para uso offline.',
      ],
    },
    {
      id: 'gestures',
      title: '7. Gestos, toques curtos e longos',
      items: [
        'Capa quadrada: toque curto abre Fontes de mídia; deslizar para esquerda/direita inicia a próxima faixa ou anterior (ou próxima/anterior rádio FM).',
        'Botão FM (barra inferior): toque curto alterna estações em sequência (seus streams salvos primeiro, depois 2 nacionais + 10 por gênero); segurar (~0,6 s) abre Fontes → URL.',
        'Botão Play (barra inferior): toque curto Play/Pausa (ou Gravar/Parar no Estúdio); segurar (~0,6 s) abre ou fecha o Modo Estúdio e gravação MP4.',
        'Fundo cósmico e esferas: toque curto no fundo vazio ativa/sai do Modo Zen; deslizar pelo fundo animado no modo esferas troca o tema visual; toque numa esfera troca de faixa ou Play/Pausa.',
        'Palco do Estúdio: arraste a moldura (ou câmera PiP) para mover; toque curto na moldura troca a forma; segurar (~0,6 s) abre alças de escala/rotação; toque curto no fundo renova estilo e neon.',
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
        '点击专辑封面或 Audius / 文件夹 / URL 按钮加载媒体；在方形封面上左右滑动可立即切换并播放下一首曲目或下一电台。',
        '点击底部栏闪烁的 FM 按钮可依次切换 12 个内置广播电台（优先播放当前语言的 2 个本国电台 + 10 个流派电台）；长按 FM 按钮可快速打开“媒体源”窗口。',
        '本地文件夹支持 MP3、WAV、FLAC、OGG、M4A（含 ID3 封面），以及视频（.mp4/.webm/.mov）和照片（.jpg/.png/.webp）。',
        '同时选择多张照片和视频时会按顺序自动播放（每张照片显示 5 秒），也支持直接拖放文件到舞台。',
        'URL 内置 12 个 FM 电台（2 个本国电台 + 10 个流派）并支持 Audius、GitHub 目录、Archive.org、JSON/M3U/PLS/RSS 列表及直链流媒体。',
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
        '在悬浮球体模式下滑动动画背景即可直接切换视觉主题；轻点一次背景恢复全部控制栏。',
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
      title: '6. 均衡器、云同步、全屏与 PWA',
      items: [
        '在顶部或菜单中打开 5 段均衡器（60 Hz – 14 kHz），听歌与导出 MP4 均实时生效。',
        '在媒体源窗口使用邮箱/密码或 Google 登录后，可将 Audius、文件夹与 URL 收藏一键同步至云端。',
        '可通过顶部或菜单切换全屏，或安装为 PWA 独立应用支持离线播放。',
      ],
    },
    {
      id: 'gestures',
      title: '7. 手势、短按与长按操作',
      items: [
        '方形封面：短按打开“媒体源”；左右滑动立即切换到下一首/上一首曲目（或下一/上一 FM 电台）。',
        '底部 FM 按钮：短按依次切换电台（优先您收藏的电台，随后是 2 个本国电台 + 10 个流派电台）；长按约 0.6 秒打开“媒体源 → URL”。',
        '底部播放按钮：短按播放/暂停（或在工作室模式下开始/停止录制）；长按约 0.6 秒开启或关闭空间工作室与 MP4 录制模式。',
        '背景与悬浮球体：轻点空白背景切换禅意模式；在悬浮球体模式下滑动动画背景可直接切换视觉主题；点击球体切歌或播放/暂停。',
        '工作室舞台：拖动相框（或画中画摄像头窗口）可自由移动；短按相框切换几何形状；长按相框约 0.6 秒开启缩放/拉伸/旋转控制点；短按背景更换配色与霓虹轮廓。',
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
        'ジャケットや Audius / フォルダ / URL から読み込み、正方形ジャケットをスワイプすると次の曲や次のFM局をすぐ再生できます。',
        '下部バーの輝く FM ボタンで12局の内蔵ラジオ（選択言語の国別2局＋ジャンル10局）を順番に切替。FM を長押しするとメディアソースをすぐ開けます。',
        'ローカルフォルダは MP3, WAV, FLAC, OGG, M4A（ID3アートワーク対応）、動画（.mp4/.webm/.mov）、写真（.jpg/.png/.webp）に対応しています。',
        '複数の写真や動画を選ぶと順番に自動再生されます（写真は各5秒）。画面へのドラッグ＆ドロップも可能です。',
        'URL には12局のFMプリセット（国別2局＋ジャンル10局）があり、Audius、GitHub、Archive.org、JSON/M3U/PLS/RSS、直接ストリームに対応しています。',
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
        '浮遊球体モード中にアニメーション背景をスワイプするとテーマが切り替わります。背景を1回タップすると操作パネルに戻ります。',
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
      title: '6. イコライザー・クラウド同期・全画面・PWA',
      items: [
        '上部またはメニューの5バンドイコライザー（60Hz〜14kHz）は再生とMP4出力の両方に反映されます。',
        'ソース画面でメール/パスワードまたは Google でログインすると、Audius・フォルダ・URLを端末間で同期できます。',
        '上部またはメニューから全画面切替や、オフライン対応アプリ（PWA）のインストールが可能です。',
      ],
    },
    {
      id: 'gestures',
      title: '7. ジェスチャー・短押し・長押し操作',
      items: [
        '正方形ジャケット：短押しでメディアソースを開き、左右スワイプで次/前の曲（または次/前のFM局）を再生します。',
        '下部 FM ボタン：短押しで順番にラジオ切替（保存済みカスタム局 → 国別2局 → ジャンル10局）；長押し（約0.6秒）でメディアソース → URL を開きます。',
        '下部 Play ボタン：短押しで再生/一時停止（スタジオ時は録画開始/停止）；長押し（約0.6秒）でスペーススタジオ＆MP4録画モードを切り替えます。',
        '背景と浮遊球体：背景の短押しでゼンモード切替；浮遊球体モード中にアニメーション背景をスワイプするとテーマ切替；球体タップで曲切替や再生/一時停止。',
        'スタジオステージ：枠（またはPIPカメラ）をドラッグで移動；枠の短押しで形状変更；枠の長押し（約0.6秒）で拡大・変形・回転ハンドル表示；背景短押しでスタイル＆ネオン更新。',
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
        '앨범 커버 또는 Audius / 폴더 / URL로 소스를 열거나, 정사각형 커버를 스와이프하여 다음 트랙 또는 다음 FM 방송을 바로 재생하세요.',
        '하단의 반짝이는 FM 버튼으로 12개 내장 라디오(선택한 언어의 국가별 2개 채널 + 10개 장르)를 순서대로 전환하고, 길게 누르면 미디어 소스 창이 바로 열립니다.',
        '로컬 폴더/파일은 MP3, WAV, FLAC, OGG, M4A(ID3 커버 포함)와 동영상(.mp4, .webm, .mov), 사진(.jpg, .png, .webp)을 지원합니다.',
        '여러 사진과 동영상을 선택하면 순서대로 재생됩니다(사진은 각 5초). 화면에 파일을 드래그 앤 드롭할 수도 있습니다.',
        'URL은 기본 12개 FM 채널(국가별 2개 + 장르 10개)과 Audius, GitHub, Archive.org, JSON/M3U/PLS/RSS 및 직접 스트림을 지원합니다.',
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
        '떠다니는 구체 모드에서 애니메이션 배경을 스와이프하면 시각화 테마가 바뀝니다. 배경을 짧게 탭하면 조작 패널이 돌아옵니다.',
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
      title: '6. 이퀄라이저, 클라우드, 전체 화면 & PWA',
      items: [
        '상단 또는 메뉴의 5밴드 이퀄라이저(60Hz~14kHz)가 감상과 MP4 내보내기에 모두 적용됩니다.',
        '소스 창에서 이메일/비밀번호 또는 Google로 로그인해 Audius, 폴더, URL 목록을 기기 간 동기화하세요.',
        '상단 또는 메뉴에서 전체 화면을 전환하거나 오프라인 지원 앱(PWA)으로 설치할 수 있습니다.',
      ],
    },
    {
      id: 'gestures',
      title: '7. 제스처, 짧은 탭 및 길게 누르기',
      items: [
        '정사각형 커버: 짧은 탭은 미디어 소스를 열고, 좌/우 스와이프는 다음/이전 트랙(또는 다음/이전 FM 방송)을 실행합니다.',
        '하단 FM 버튼: 짧은 탭은 순서대로 라디오 전환(사용자 저장 방송 우선 → 국가별 2개 → 장르 10개); 길게 누르기(약 0.6초)는 미디어 소스 → URL을 엽니다.',
        '하단 Play 버튼: 짧은 탭은 재생/일시정지(녹화 대기 중엔 녹화 시작/정지); 길게 누르기(약 0.6초)는 스페이스 스튜디오 및 MP4 녹화 모드를 켜거나 끕니다.',
        '배경 및 떠다니는 구체: 빈 배경 짧은 탭으로 젠 모드 전환; 구체 모드에서 애니메이션 배경 스와이프로 시각화 테마 변경; 구체 탭으로 트랙 전환 또는 재생/일시정지.',
        '스튜디오 무대: 프레임(또는 PIP 카메라)을 드래그해 이동; 프레임 짧은 탭으로 도형 변경; 프레임 길게 누르기(약 0.6초)로 크기/변형/회전 핸들 표시; 배경 탭으로 스타일 및 네온 테두리 변경.',
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
        'Kaynak seçmek için kapağa veya Audius / Klasör / URL’ye dokunun ya da kare kapağı kaydırarak sonraki parçayı veya FM istasyonunu başlatın.',
        'Alt çubuktaki parlayan FM düğmesi 12 dahili radyo istasyonu arasında geçer (dilinize özel 2 ulusal kanal ilk sırada + 10 tür kanalı); FM düğmesine basılı tutmak Medya Kaynaklarını açar.',
        'Cihaz klasörleri MP3, WAV, FLAC, OGG, M4A (ID3 kapaklı) ile video (.mp4, .webm, .mov) ve fotoğrafları (.jpg, .png, .webp) destekler.',
        'Birden fazla fotoğraf ve video seçilirse sırayla oynatılır (her fotoğraf 5 sn kalır). Dosyaları sahneye sürükleyip bırakabilirsiniz.',
        'URL bölümünde 12 hazır FM kanalı (2 ulusal + 10 tür) ile Audius, GitHub, Archive.org, JSON/M3U/PLS/RSS ve doğrudan radyo akışları desteklenir.',
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
        'Yüzen küreler modunda animasyon arka planını kaydırarak görsel temayı değiştirin; kısa dokunuş kontrolleri geri getirir.',
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
      title: '6. Ekolayzer, Bulut, Tam Ekran ve PWA',
      items: [
        'Üst çubuk veya menüdeki 5 bantlı ekolayzer (60 Hz – 14 kHz) hem dinlemede hem MP4 aktarımında çalışır.',
        'Kaynaklar penceresinde E-posta/Şifre veya Google ile giriş yaparak Audius, klasör ve URL listelerinizi cihazlar arasında eşitleyin.',
        'Üst çubuktan Tam Ekran açabilir veya uygulamayı çevrimdışı PWA olarak yükleyebilirsiniz.',
      ],
    },
    {
      id: 'gestures',
      title: '7. Hareketler, Kısa ve Uzun Dokunuşlar',
      items: [
        'Kare Kapak: kısa dokunuş Medya Kaynaklarını açar; sola/sağa kaydırma sonraki veya önceki parçayı (ya da FM istasyonunu) başlatır.',
        'Alt Çubuk FM Düğmesi: kısa dokunuş istasyonları sırayla değiştirir (önce kendi kayıtlı akışlarınız, sonra 2 ulusal + 10 tür kanalı); basılı tutma (~0,6 sn) Kaynaklar → URL’yi açar.',
        'Alt Çubuk Play Düğmesi: kısa dokunuş Oynat/Duraklat (Stüdyoda Kaydet/Durdur); basılı tutma (~0,6 sn) Uzay Stüdyosu ve MP4 Kayıt Modunu açar veya kapatır.',
        'Arka Plan ve Yüzen Küreler: boş arka plana kısa dokunuş Zen Modunu açar/kapatır; küre modunda animasyon arka planını kaydırmak görsel temayı değiştirir; küreye dokunmak parça değiştirir veya oynatır/duraklatır.',
        'Stüdyo Sahnesi: çerçeveyi (veya PiP kamerayı) sürükleyerek taşıyın; çerçeveye kısa dokunuş şekli değiştirir; basılı tutma (~0,6 sn) ölçek/esnetme/döndürme tutamaçlarını açar; arka plana dokunuş stili ve neonu yeniler.',
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
        'Kliknij okładkę lub Audius / Folder / URL albo przesuń palcem po kwadratowej okładce, aby włączyć kolejny utwór lub stację FM.',
        'Połyskujący przycisk FM przełącza kolejno 12 wbudowanych stacji radiowych (najpierw 2 krajowe dla wybranego języka + 10 gatunkowych); długie przytrzymanie FM otwiera Źródła mediów.',
        'Lokalne foldery obsługują MP3, WAV, FLAC, OGG, M4A (z okładkami ID3) oraz wideo (.mp4, .webm, .mov) i zdjęcia (.jpg, .png, .webp).',
        'Wiele wybranych zdjęć i filmów odtwarza się po kolei (każde zdjęcie przez 5 s). Pliki można też przeciągnąć na scenę.',
        'URL zawiera 12 gotowych stacji FM (2 krajowe + 10 gatunkowych) oraz obsługuje Audius, GitHub, Archive.org, listy JSON/M3U/PLS/RSS i bezpośrednie strumienie.',
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
        'Przesuń po animowanym tle w trybie latających sfer, aby zmienić motyw wizualny; krótkie kliknięcie przywraca interfejs.',
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
      title: '6. Korektor, Chmura, Pełny ekran i PWA',
      items: [
        '5-pasmowy korektor (60 Hz – 14 kHz) dostępny w nagłówku lub menu działa podczas słuchania i eksportu MP4.',
        'Zaloguj się przez Email/Hasło lub Google w Źródłach, aby zsynchronizować Audius, foldery i URL między urządzeniami.',
        'Przełączaj Pełny ekran lub zainstaluj YRitmX jako aplikację PWA offline.',
      ],
    },
    {
      id: 'gestures',
      title: '7. Gesty, krótkie i długie przytrzymania',
      items: [
        'Kwadratowa okładka: krótkie kliknięcie otwiera Źródła mediów; przesunięcie w lewo/prawo uruchamia kolejny lub poprzedni utwór (albo stację FM).',
        'Przycisk FM (dolny pasek): krótkie kliknięcie przełącza stacje po kolei (najpierw własne zapisane, potem 2 krajowe + 10 gatunkowych); przytrzymanie (~0,6 s) otwiera Źródła → URL.',
        'Przycisk Play (dolny pasek): krótkie kliknięcie Play/Pauza (lub Nagrywaj/Stop w Studiu); przytrzymanie (~0,6 s) włącza lub wyłącza Studio Kosmiczne i zapis MP4.',
        'Tło i latające sfery: krótkie kliknięcie pustego tła włącza/wyłącza Tryb Zen; przesunięcie po animowanym tle w trybie sfer zmienia motyw wizualny; kliknięcie sfery zmienia utwór lub pauzuje.',
        'Scena Studia: przeciąganie przesuwa ramkę (lub okno kamery PiP); krótkie kliknięcie ramki zmienia kształt; przytrzymanie ramki (~0,6 s) otwiera uchwyty skali, rozciągania i obrotu; kliknięcie tła odświeża styl i neon.',
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
        'انقر على الغلاف أو أزرار Audius / مجلد / رابط، أو اسحب على الغلاف المربع لتشغيل المقطع التالي أو محطة الراديو التالية.',
        'زر FM المتوهج في الشريط السفلي يبدّل بين 12 محطة إذاعية مدمجة (محطتان وطنيتان للغتك أولاً + 10 محطات حسب النوع)؛ والضغط المطوّل على FM يفتح نافذة مصادر الوسائط.',
        'تدعم مجلدات الجهاز ملفات MP3 وWAV وFLAC وOGG وM4A (مع أغلفة ID3)، بالإضافة إلى الفيديو (.mp4/.webm/.mov) والصور (.jpg/.png/.webp).',
        'عند اختيار عدة صور ومقاطع فيديو تُعرض بالتتابع (5 ثوانٍ لكل صورة)، كما يمكنك سحب الملفات وإفلاتها على المسرح.',
        'يتضمن تبويب الرابط 12 محطة FM جاهزة (محطتان وطنيتان + 10 حسب النوع) ويدعم Audius وGitHub وArchive.org وقوائم JSON/M3U/PLS/RSS والبث المباشر.',
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
        'اسحب على الخلفية المتحركة في وضع الكرات العائمة لتغيير نمط المؤثر البصري؛ ونقرة قصيرة على الخلفية تعيد عناصر التحكم.',
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
      title: '6. المعادل والسحابة وملء الشاشة وPWA',
      items: [
        'معادل الصوت خماسي النطاقات (60 هرتز – 14 كيلوهرتز) متاح في الشريط العلوي أو القائمة ويعمل أثناء الاستماع والتصدير.',
        'سجّل الدخول بالبريد/كلمة المرور أو Google من مصادر الوسائط لمزامنة Audius والمجلدات والروابط عبر أجهزتك.',
        'يمكنك تفعيل ملء الشاشة أو تثبيت YRitmX كتطبيق PWA للعمل دون إنترنت.',
      ],
    },
    {
      id: 'gestures',
      title: '7. الإيماءات والنقرات القصيرة والمطوّلة',
      items: [
        'الغلاف المربع: النقر القصير يفتح مصادر الوسائط؛ والسحب لليسار أو اليمين يشغّل المقطع التالي أو السابق (أو محطة FM التالية/السابقة).',
        'زر FM (الشريط السفلي): النقر القصير يبدّل المحطات بالتتابع (محطاتك المحفوظة أولاً ثم محطتان وطنيتان + 10 حسب النوع)؛ والضغط المطوّل (~0.6 ث) يفتح المصادر ← الرابط.',
        'زر التشغيل Play (الشريط السفلي): النقر القصير للتشغيل/الإيقاف المؤقت (أو التسجيل/الإيقاف في الاستوديو)؛ والضغط المطوّل (~0.6 ث) يفتح أو يغلق وضع الاستوديو وتسجيل MP4.',
        'الخلفية والكرات العائمة: النقر القصير على الخلفية الفارغة يبدّل وضع الزن؛ والسحب على الخلفية المتحركة في وضع الكرات يغيّر النمط البصري؛ والنقر على كرة يبدّل المقطع أو يوقفه.',
        'مسرح الاستوديو: اسحب الإطار (أو نافذة الكاميرا) لتحريكه؛ النقر القصير على الإطار يغيّر الشكل؛ الضغط المطوّل (~0.6 ث) يظهر مقابض التحجيم والتدوير؛ والنقر على الخلفية يجدد النمط والنيون.',
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
        'स्रोत चुनने के लिए कवर या Audius / फ़ोल्डर / URL पर टैप करें, या चौकोर कवर पर स्वाइप करके अगला ट्रैक या अगला FM स्टेशन चलाएँ।',
        'निचले बार में चमकता FM बटन 12 इनबिल्ट रेडियो स्टेशन (पहले आपकी भाषा के 2 राष्ट्रीय चैनल + 10 जॉनर चैनल) क्रम से बदलता है; FM को दबाए रखने पर मीडिया स्रोत तुरंत खुलता है।',
        'डिवाइस फ़ोल्डर MP3, WAV, FLAC, OGG, M4A (ID3 कवर सहित) तथा वीडियो (.mp4/.webm/.mov) और फ़ोटो (.jpg/.png/.webp) सपोर्ट करते हैं।',
        'कई फ़ोटो और वीडियो चुनने पर वे क्रम से चलते हैं (हर फ़ोटो 5 सेकंड)। फ़ाइलें सीधे स्टेज पर ड्रैग-ड्रॉप कर सकते हैं।',
        'URL टैब में 12 रेडी FM स्टेशन (2 राष्ट्रीय + 10 जॉनर) पहले से शामिल हैं तथा Audius, GitHub, Archive.org, JSON/M3U/PLS/RSS व लाइव स्ट्रीम चलते हैं।',
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
        'तैरते गोलों वाले मोड में एनीमेशन पृष्ठभूमि पर स्वाइप करके विज़ुअल थीम बदलें; एक छोटे टैप से नियंत्रण वापस आते हैं।',
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
      title: '6. इक्वलाइज़र, क्लाउड, फुलस्क्रीन और PWA',
      items: [
        'हेडर या मेनू में उपलब्ध 5-बैंड इक्वलाइज़र (60 Hz – 14 kHz) सुनने और MP4 एक्सपोर्ट दोनों में काम करता है।',
        'Audius, फ़ोल्डर और URL स्रोतों को डिवाइसों पर सिंक करने के लिए ईमेल/पासवर्ड या Google से साइन इन करें।',
        'ऊपरी बार या मेनू से फुलस्क्रीन चलाएँ या ऑफ़लाइन PWA ऐप इंस्टॉल करें।',
      ],
    },
    {
      id: 'gestures',
      title: '7. जेस्चर, छोटे और लंबे टैप',
      items: [
        'चौकोर कवर: छोटे टैप से मीडिया स्रोत खुलता है; बाएँ/दाएँ स्वाइप से अगला या पिछला ट्रैक (या अगला/पिछला FM स्टेशन) तुरंत चलता है।',
        'निचला FM बटन: छोटे टैप से क्रमशः स्टेशन बदलते हैं (पहले आपकी सहेजी हुई स्ट्रीम, फिर 2 राष्ट्रीय + 10 जॉनर स्टेशन); दबाए रखने (~0.6 से) पर मीडिया स्रोत → URL खुलता है।',
        'निचला Play बटन: छोटे टैप से प्ले/पॉज़ (या स्टूडियो में रिकॉर्ड/स्टॉप); दबाए रखने (~0.6 से) पर स्पेस स्टूडियो और MP4 रिकॉर्डिंग मोड खुलता/बंद होता है।',
        'पृष्ठभूमि और तैरते गोले: खाली पृष्ठभूमि पर छोटे टैप से ज़ेन मोड ऑन/ऑफ़ होता है; गोलों वाले मोड में एनीमेशन पृष्ठभूमि पर स्वाइप से विज़ुअल थीम बदलती है; गोले पर टैप से ट्रैक या प्ले/पॉज़ बदलता है।',
        'स्टूडियो स्टेज: फ़्रेम (या PiP कैमरा) खींचकर खिसकाएँ; फ़्रेम पर छोटे टैप से आकार बदलता है; दबाए रखने (~0.6 से) पर स्केल/स्ट्रेच/रोटेशन हैंडल खुलते हैं; पृष्ठभूमि टैप से स्टाइल व नियॉन बदलता है।',
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
        'Manba tanlash uchun muqova yoki Audius / Papka / URL tugmalarini bosing, yoxud kvadrat muqovani surib (svayp) keyingi trek yoki FM stansiyani ishga tushiring.',
        'Pastki paneldagi jilvali FM tugmasi 12 ta o‘rnatilgan radiostansiyani (avval tilingizdagi 2 ta milliy kanal + 10 ta janrli) ketma-ket almashtiradi; FM tugmasini bosib turish «Media manbalari»ni ochadi.',
        'Qurilma papkalari MP3, WAV, FLAC, OGG, M4A (ID3 muqovalari bilan), shuningdek video (.mp4, .webm, .mov) va rasmlarni (.jpg, .png, .webp) qo‘llab-quvvatlaydi.',
        'Bir nechta rasm va video tanlansa, ketma-ket ijro etiladi (har bir rasm 5 soniya). Fayllarni sahnaga sudrab tashlash ham mumkin.',
        'URL bo‘limida 12 ta tayyor FM stansiya (2 ta milliy + 10 ta janrli) mavjud bo‘lib, Audius, GitHub, Archive.org, JSON/M3U/PLS/RSS va to‘g‘ridan-to‘g‘ri oqimlar ishlaydi.',
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
        'Uchuvchi sferalar rejimida animatsiya fonini surib vizual mavzuni almashtiring; qisqa bosish interfeysni tiklaydi.',
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
      title: '6. Ekvalayzer, Bulut, To‘liq ekran va PWA',
      items: [
        'Yuqori panel yoki menyudagi 5 diapazonli ekvalayzer (60 Hz – 14 kHz) tinglashda ham, MP4 eksportida ham ishlaydi.',
        'Audius, papka va URL manbalarini qurilmalar o‘rtasida sinxronlash uchun Email/parol yoki Google orqali kiring.',
        'Yuqori panel yoki menyudan To‘liq ekranni yoqing hamda pleyerni oflayn PWA ilova sifatida o‘rnating.',
      ],
    },
    {
      id: 'gestures',
      title: '7. Imo-ishoralar, qisqa va uzoq bosishlar',
      items: [
        'Kvadrat muqova: qisqa bosish «Media manbalari»ni ochadi; chapga/o‘ngga surish (svayp) keyingi yoki oldingi trekni (yoki FM stansiyasini) ishga tushiradi.',
        'Pastki FM tugmasi: qisqa bosish stansiyalarni ketma-ket almashtiradi (avval saqlangan oqimlaringiz, so‘ng 2 ta milliy + 10 ta janrli); bosib turish (~0.6 s) «Manbalar → URL»ni ochadi.',
        'Pastki Play tugmasi: qisqa bosish Play/Pauza (yoki Studiyada Yozish/Stop); bosib turish (~0.6 s) Studiya va MP4 yozish rejimini ochadi yoki yopadi.',
        'Fon va uchuvchi sferalar: bo‘sh fonga qisqa bosish Zen rejimini yoqadi/o‘chiradi; sferalar rejimida animatsiya fonini surish vizual mavzuni almashtiradi; sferaga bosish trekni yoki Play/Pauzani boshqaradi.',
        'Studiya sahnasi: ramkani (yoki PiP kamerani) sudrab siljiting; ramkaga qisqa bosish shaklni o‘zgartiradi; bosib turish (~0.6 s) o‘lcham, cho‘zish va burish tutqichlarini ochadi; fonga qisqa bosish uslub va neon chiziqni yangilaydi.',
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
        'Көзді таңдау үшін мұқабаны не Audius / Қалта / URL басыңыз, я болмаса шаршы мұқабаны сырғытып (свайп) келесі тректі не FM станциясын қосыңыз.',
        'Төменгі панельдегі жарқыраған FM батырмасы 12 орнатылған радионы (алдымен тіліңіздегі 2 ұлттық арна + 10 жанрлық) ретімен ауыстырады; FM-ді ұзақ басу «Медиа көздерін» ашады.',
        'Құрылғы қалталары MP3, WAV, FLAC, OGG, M4A (ID3 мұқабаларымен), сондай-ақ бейне (.mp4, .webm, .mov) және фото (.jpg, .png, .webp) қолдайды.',
        'Бірнеше фото мен бейне таңдалса, кезекпен ойнатылады (әр фото 5 секунд). Файлдарды экранға сүйреп тастауға да болады.',
        'URL бөлімінде 12 дайын FM станция (2 ұлттық + 10 жанрлық) бар және Audius, GitHub, Archive.org, JSON/M3U/PLS/RSS пен тікелей ағындарды қолдайды.',
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
        'Ұшатын шарлар режимінде анимация фонын сырғытып визуалды тақырыпты ауыстырыңыз; қысқа түрту интерфейсті қайтарады.',
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
      title: '6. Эквалайзер, Бұлт, Толық экран және PWA',
      items: [
        'Жоғарғы панель мен мәзірдегі 5 жолақты эквалайзер (60 Гц – 14 кГц) тыңдау кезінде де, MP4 экспортында да жұмыс істейді.',
        'Audius, қалта және URL көздерін құрылғылар арасында синхрондау үшін Email/құпиясөз не Google арқылы кіріңіз.',
        'Жоғарғы панельден не мәзірден Толық экранды қосыңыз немесе офлайн PWA қолданбасын орнатыңыз.',
      ],
    },
    {
      id: 'gestures',
      title: '7. Қимылдар, қысқа және ұзақ басулар',
      items: [
        'Шаршы мұқаба: қысқа түрту «Медиа көздерін» ашады; солға/оңға сырғыту (свайп) келесі не алдыңғы тректі (немесе FM станциясын) қосады.',
        'Төменгі FM батырмасы: қысқа түрту станцияларды ретімен ауыстырады (алдымен сақталған ағындарыңыз, сосын 2 ұлттық + 10 жанрлық); ұзақ басу (~0.6 с) «Көздер → URL» ашады.',
        'Төменгі Play батырмасы: қысқа түрту Ойнату/Кідірту (немесе Студияда Жазу/Тоқтату); ұзақ басу (~0.6 с) Студия және MP4 жазу режимін ашады немесе жабады.',
        'Фон және ұшатын шарлар: бос фонды қысқа түрту Дзен режимін қосады/өшіреді; шарлар режимінде анимация фонын сырғыту визуалды тақырыпты ауыстырады; шарды басу тректі не кідіртуді ауыстырады.',
        'Студия сахнасы: жақтауды (немесе PiP камераны) сүйреп жылжытыңыз; жақтауды қысқа түрту пішінді ауыстырады; ұзақ басу (~0.6 с) өлшем, созу және бұру тұтқаларын ашады; фонды қысқа түрту стиль мен неон жиекті жаңартады.',
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
