import { SupportedLang } from './translations';

export interface CloudMessages {
  saveToCloudBtn: string;
  savingToCloudBtn: string;
  cloudConnectedLabel: string;
  cloudSignInHint: string;
  cloudSignOutLabel: string;
  cloudSavedToast: string;
  cloudLoadedToast: (count: number) => string;
  cloudSignedOutToast: string;
  cloudAuthErrorToast: string;
  cloudSyncErrorToast: string;
  folderLocalDbBadge: string;
  folderNeedsRelinkBadge: string;
  authModalTitle: string;
  authGoogleBtn: string;
  authOrDivider: string;
  authModeSignIn: string;
  authModeRegister: string;
  authEmailPlaceholder: string;
  authPasswordPlaceholder: string;
  authForgotPassword: string;
  authVerifyTitle: string;
  authVerifyBody: string;
  authVerifyCheckBtn: string;
  authVerifyResendBtn: string;
  authResetSentToast: string;
  authVerificationSentToast: string;
  authProviderDisabledHint: string;
  authWeakPasswordError: string;
  authInvalidCredError: string;
  authEmailInUseError: string;
  authEnterEmailFirst: string;
  cloudSignInBtn: string;
  cloudAllTabsHint: string;
}

const EN_CLOUD: CloudMessages = {
  saveToCloudBtn: 'Save All Tabs to Cloud',
  savingToCloudBtn: 'Saving to Cloud...',
  cloudConnectedLabel: 'Cloud sync',
  cloudSignInHint: 'Sign in with Google or Email & Password to sync all tabs across devices',
  cloudSignOutLabel: 'Sign out',
  cloudSavedToast: 'Audius, folders & URLs saved to cloud',
  cloudLoadedToast: (count: number) => `Synced from cloud (${count})`,
  cloudSignedOutToast: 'Signed out of cloud sync',
  cloudAuthErrorToast: 'Authentication failed',
  cloudSyncErrorToast: 'Failed to sync with cloud',
  folderLocalDbBadge: 'Saved locally (auto-restores on reload)',
  folderNeedsRelinkBadge: 'Tap to re-link folder on this device',
  authModalTitle: 'Sign in to Cloud Sync',
  authGoogleBtn: 'Continue with Google',
  authOrDivider: 'or with email & password',
  authModeSignIn: 'Sign In',
  authModeRegister: 'Register',
  authEmailPlaceholder: 'Email address',
  authPasswordPlaceholder: 'Password (min 6 chars)',
  authForgotPassword: 'Forgot password?',
  authVerifyTitle: 'Confirm your email',
  authVerifyBody: 'A verification link was sent to your inbox. Confirm it, then click Check.',
  authVerifyCheckBtn: 'Check',
  authVerifyResendBtn: 'Resend',
  authResetSentToast: 'Password reset link sent to your email',
  authVerificationSentToast: 'Verification email sent',
  authProviderDisabledHint: 'Enable Email/Password in Firebase Console → Authentication → Sign-in method',
  authWeakPasswordError: 'Password must be at least 6 characters',
  authInvalidCredError: 'Invalid email or password',
  authEmailInUseError: 'An account with this email already exists',
  authEnterEmailFirst: 'Enter your email address first',
  cloudSignInBtn: 'Sign in',
  cloudAllTabsHint: 'Saves Audius, Folders & URLs at once',
};

const RU_CLOUD: CloudMessages = {
  saveToCloudBtn: 'Сохранить в облако (все вкладки)',
  savingToCloudBtn: 'Сохранение в облако...',
  cloudConnectedLabel: 'Облако подключено',
  cloudSignInHint: 'Войдите через Google или Email и пароль для синхронизации всех вкладок',
  cloudSignOutLabel: 'Выйти',
  cloudSavedToast: 'Audius, папки и URL сохранены в облако',
  cloudLoadedToast: (count: number) => `Загружено из облака: ${count}`,
  cloudSignedOutToast: 'Вы вышли из облачного профиля',
  cloudAuthErrorToast: 'Ошибка входа',
  cloudSyncErrorToast: 'Ошибка синхронизации с облаком',
  folderLocalDbBadge: 'Файлы сохранены локально (подцепляются при перезагрузке)',
  folderNeedsRelinkBadge: 'Нажмите, чтобы заново выбрать папку на устройстве',
  authModalTitle: 'Вход в облако YRitmX',
  authGoogleBtn: 'Войти через Google',
  authOrDivider: 'или по Email и паролю',
  authModeSignIn: 'Вход',
  authModeRegister: 'Регистрация',
  authEmailPlaceholder: 'Ваш Email',
  authPasswordPlaceholder: 'Пароль (минимум 6 символов)',
  authForgotPassword: 'Забыли пароль?',
  authVerifyTitle: 'Подтвердите Email',
  authVerifyBody: 'Ссылка подтверждения отправлена на почту. Подтвердите и нажмите «Проверить».',
  authVerifyCheckBtn: 'Проверить',
  authVerifyResendBtn: 'Повторно',
  authResetSentToast: 'Ссылка для сброса пароля отправлена на почту',
  authVerificationSentToast: 'Письмо подтверждения отправлено',
  authProviderDisabledHint: 'Включите Email/Password в Firebase Console → Authentication → Sign-in method',
  authWeakPasswordError: 'Пароль должен содержать минимум 6 символов',
  authInvalidCredError: 'Неверный email или пароль',
  authEmailInUseError: 'Этот email уже зарегистрирован',
  authEnterEmailFirst: 'Сначала введите ваш email',
  cloudSignInBtn: 'Войти',
  cloudAllTabsHint: 'Сохраняет сразу Audius, Папки и URL',
};

const UK_CLOUD: CloudMessages = {
  saveToCloudBtn: 'Зберегти в хмару (усі вкладки)',
  savingToCloudBtn: 'Збереження в хмару...',
  cloudConnectedLabel: 'Хмара підключена',
  cloudSignInHint: 'Увійдіть через Google або Email та пароль для синхронізації всіх вкладок',
  cloudSignOutLabel: 'Вийти',
  cloudSavedToast: 'Audius, папки та URL збережено в хмару',
  cloudLoadedToast: (count: number) => `Завантажено з хмари: ${count}`,
  cloudSignedOutToast: 'Ви вийшли з хмарного профілю',
  cloudAuthErrorToast: 'Помилка входу',
  cloudSyncErrorToast: 'Помилка синхронізації з хмарою',
  folderLocalDbBadge: 'Файли збережено локально (автопідключення після перезавантаження)',
  folderNeedsRelinkBadge: 'Натисніть, щоб знову обрати папку на пристрої',
  authModalTitle: 'Вхід до хмари YRitmX',
  authGoogleBtn: 'Увійти через Google',
  authOrDivider: 'або через Email і пароль',
  authModeSignIn: 'Вхід',
  authModeRegister: 'Реєстрація',
  authEmailPlaceholder: 'Ваш Email',
  authPasswordPlaceholder: 'Пароль (мінімум 6 символів)',
  authForgotPassword: 'Забули пароль?',
  authVerifyTitle: 'Підтвердіть Email',
  authVerifyBody: 'Посилання надіслано на пошту. Підтвердіть і натисніть «Перевірити».',
  authVerifyCheckBtn: 'Перевірити',
  authVerifyResendBtn: 'Ще раз',
  authResetSentToast: 'Лист для скидання пароля надіслано',
  authVerificationSentToast: 'Лист підтвердження надіслано',
  authProviderDisabledHint: 'Увімкніть Email/Password у Firebase Console → Authentication → Sign-in method',
  authWeakPasswordError: 'Пароль має містити щонайменше 6 символів',
  authInvalidCredError: 'Невірний email або пароль',
  authEmailInUseError: 'Цей email вже зареєстровано',
  authEnterEmailFirst: 'Спочатку введіть ваш email',
  cloudSignInBtn: 'Увійти',
  cloudAllTabsHint: 'Зберігає одразу Audius, Папки та URL',
};

function makeFallback(base: Partial<CloudMessages>): CloudMessages {
  return { ...EN_CLOUD, ...base };
}

const ES_CLOUD = makeFallback({
  saveToCloudBtn: 'Guardar todo en la nube',
  savingToCloudBtn: 'Guardando en la nube...',
  cloudConnectedLabel: 'Nube conectada',
  cloudSignInHint: 'Inicia sesión con Google o Email y contraseña para sincronizar todo',
  cloudSignOutLabel: 'Cerrar sesión',
  cloudSavedToast: 'Audius, carpetas y URLs guardados en la nube',
  cloudLoadedToast: (count: number) => `Sincronizado desde la nube (${count})`,
  cloudSignedOutToast: 'Sesión en la nube cerrada',
  folderLocalDbBadge: 'Guardado localmente (se restaura al recargar)',
  authModalTitle: 'Iniciar sesión en la nube',
  authGoogleBtn: 'Continuar con Google',
  authOrDivider: 'o con email y contraseña',
  authModeSignIn: 'Entrar',
  authModeRegister: 'Registro',
  authEmailPlaceholder: 'Correo electrónico',
  authPasswordPlaceholder: 'Contraseña (mín. 6)',
  authForgotPassword: '¿Olvidaste tu contraseña?',
  authVerifyTitle: 'Confirma tu correo',
  authVerifyBody: 'Enviamos un enlace a tu correo. Confírmalo y pulsa Verificar.',
  authVerifyCheckBtn: 'Verificar',
  authVerifyResendBtn: 'Reenviar',
  cloudSignInBtn: 'Entrar',
});

const FR_CLOUD = makeFallback({
  saveToCloudBtn: 'Tout enregistrer dans le cloud',
  savingToCloudBtn: 'Enregistrement...',
  cloudConnectedLabel: 'Cloud connecté',
  cloudSignInHint: 'Connectez-vous avec Google ou Email et mot de passe',
  cloudSignOutLabel: 'Déconnexion',
  cloudSavedToast: 'Audius, dossiers et URL enregistrés dans le cloud',
  cloudLoadedToast: (count: number) => `Synchronisé depuis le cloud (${count})`,
  cloudSignedOutToast: 'Déconnecté du cloud',
  folderLocalDbBadge: 'Enregistré localement (restauré au rechargement)',
  authModalTitle: 'Connexion au cloud',
  authGoogleBtn: 'Continuer avec Google',
  authOrDivider: 'ou par email et mot de passe',
  authModeSignIn: 'Connexion',
  authModeRegister: 'Inscription',
  authEmailPlaceholder: 'Adresse e-mail',
  authPasswordPlaceholder: 'Mot de passe (min. 6)',
  authForgotPassword: 'Mot de passe oublié ?',
  authVerifyTitle: 'Vérifiez votre e-mail',
  authVerifyBody: 'Un lien a été envoyé à votre adresse. Confirmez puis cliquez sur Vérifier.',
  authVerifyCheckBtn: 'Vérifier',
  authVerifyResendBtn: 'Renvoyer',
  cloudSignInBtn: 'Connexion',
});

const DE_CLOUD = makeFallback({
  saveToCloudBtn: 'Alle Tabs in Cloud speichern',
  savingToCloudBtn: 'Wird gespeichert...',
  cloudConnectedLabel: 'Cloud verbunden',
  cloudSignInHint: 'Mit Google oder E-Mail & Passwort anmelden, um alle Tabs zu synchronisieren',
  cloudSignOutLabel: 'Abmelden',
  cloudSavedToast: 'Audius, Ordner & URLs in der Cloud gespeichert',
  cloudLoadedToast: (count: number) => `Aus der Cloud synchronisiert (${count})`,
  cloudSignedOutToast: 'Von Cloud-Sync abgemeldet',
  folderLocalDbBadge: 'Lokal gespeichert (wird beim Neuladen wiederhergestellt)',
  authModalTitle: 'Bei Cloud-Sync anmelden',
  authGoogleBtn: 'Mit Google fortfahren',
  authOrDivider: 'oder mit E-Mail & Passwort',
  authModeSignIn: 'Anmelden',
  authModeRegister: 'Registrieren',
  authEmailPlaceholder: 'E-Mail-Adresse',
  authPasswordPlaceholder: 'Passwort (mind. 6 Zeichen)',
  authForgotPassword: 'Passwort vergessen?',
  authVerifyTitle: 'E-Mail bestätigen',
  authVerifyBody: 'Ein Bestätigungslink wurde gesendet. Bestätigen Sie ihn und klicken Sie auf Prüfen.',
  authVerifyCheckBtn: 'Prüfen',
  authVerifyResendBtn: 'Erneut senden',
  cloudSignInBtn: 'Anmelden',
});

const IT_CLOUD = makeFallback({
  saveToCloudBtn: 'Salva tutto nel cloud',
  savingToCloudBtn: 'Salvataggio...',
  cloudConnectedLabel: 'Cloud connesso',
  cloudSignInHint: 'Accedi con Google o Email e password per sincronizzare tutto',
  cloudSignOutLabel: 'Esci',
  cloudSavedToast: 'Audius, cartelle e URL salvati nel cloud',
  cloudLoadedToast: (count: number) => `Sincronizzato dal cloud (${count})`,
  cloudSignedOutToast: 'Disconnesso dal cloud',
  folderLocalDbBadge: 'Salvato localmente (ripristinato al ricaricamento)',
  authModalTitle: 'Accedi al cloud',
  authGoogleBtn: 'Continua con Google',
  authOrDivider: 'o con email e password',
  authModeSignIn: 'Accedi',
  authModeRegister: 'Registrati',
  cloudSignInBtn: 'Accedi',
});

const PT_CLOUD = makeFallback({
  saveToCloudBtn: 'Salvar tudo na nuvem',
  savingToCloudBtn: 'Salvando na nuvem...',
  cloudConnectedLabel: 'Nuvem conectada',
  cloudSignInHint: 'Entre com Google ou E-mail e senha para sincronizar tudo',
  cloudSignOutLabel: 'Sair',
  cloudSavedToast: 'Audius, pastas e URLs salvos na nuvem',
  cloudLoadedToast: (count: number) => `Sincronizado da nuvem (${count})`,
  cloudSignedOutToast: 'Desconectado da nuvem',
  folderLocalDbBadge: 'Salvo localmente (restaura ao recarregar)',
  authModalTitle: 'Entrar na nuvem',
  authGoogleBtn: 'Continuar com Google',
  authOrDivider: 'ou com e-mail e senha',
  authModeSignIn: 'Entrar',
  authModeRegister: 'Criar conta',
  cloudSignInBtn: 'Entrar',
});

const ZH_CLOUD = makeFallback({
  saveToCloudBtn: '将所有标签页保存到云端',
  savingToCloudBtn: '正在保存到云端...',
  cloudConnectedLabel: '云同步已连接',
  cloudSignInHint: '使用 Google 或邮箱密码登录即可同步所有标签页',
  cloudSignOutLabel: '退出登录',
  cloudSavedToast: 'Audius、文件夹与网址已保存到云端',
  cloudLoadedToast: (count: number) => `已从云端同步 (${count})`,
  cloudSignedOutToast: '已退出云同步账号',
  folderLocalDbBadge: '已本地保存（刷新后自动恢复）',
  authModalTitle: '登录云同步',
  authGoogleBtn: '使用 Google 登录',
  authOrDivider: '或使用邮箱和密码',
  authModeSignIn: '登录',
  authModeRegister: '注册',
  cloudSignInBtn: '登录',
});

const JA_CLOUD = makeFallback({
  saveToCloudBtn: 'すべてクラウドに保存',
  savingToCloudBtn: 'クラウドに保存中...',
  cloudConnectedLabel: 'クラウド接続済み',
  cloudSignInHint: 'Google またはメールとパスワードでログインして同期できます',
  cloudSignOutLabel: 'ログアウト',
  cloudSavedToast: 'Audius・フォルダ・URLをクラウドに保存しました',
  cloudLoadedToast: (count: number) => `クラウドから同期しました (${count})`,
  cloudSignedOutToast: 'クラウドからログアウトしました',
  folderLocalDbBadge: 'ローカル保存済み（再読み込み時に自動復元）',
  authModalTitle: 'クラウドにログイン',
  authGoogleBtn: 'Google で続行',
  authOrDivider: 'またはメールとパスワードで',
  authModeSignIn: 'ログイン',
  authModeRegister: '新規登録',
  cloudSignInBtn: 'ログイン',
});

const KO_CLOUD = makeFallback({
  saveToCloudBtn: '모든 탭 클라우드에 저장',
  savingToCloudBtn: '클라우드에 저장 중...',
  cloudConnectedLabel: '클라우드 연결됨',
  cloudSignInHint: 'Google 또는 이메일/비밀번호로 로그인하여 모든 탭을 동기화하세요',
  cloudSignOutLabel: '로그아웃',
  cloudSavedToast: 'Audius, 폴더 및 URL이 클라우드에 저장되었습니다',
  cloudLoadedToast: (count: number) => `클라우드에서 동기화됨 (${count})`,
  cloudSignedOutToast: '클라우드 동기화에서 로그아웃됨',
  folderLocalDbBadge: '로컬에 저장됨 (새로고침 시 자동 복원)',
  authModalTitle: '클라우드 로그인',
  authGoogleBtn: 'Google로 계속',
  authOrDivider: '또는 이메일과 비밀번호로',
  authModeSignIn: '로그인',
  authModeRegister: '회원가입',
  cloudSignInBtn: '로그인',
});

const TR_CLOUD = makeFallback({
  saveToCloudBtn: 'Tüm Sekmeleri Buluta Kaydet',
  savingToCloudBtn: 'Buluta Kaydediliyor...',
  cloudConnectedLabel: 'Bulut bağlı',
  cloudSignInHint: 'Google veya E-posta ve şifre ile giriş yapın',
  cloudSignOutLabel: 'Çıkış yap',
  cloudSavedToast: 'Audius, klasörler ve URL’ler buluta kaydedildi',
  cloudLoadedToast: (count: number) => `Buluttan eşitlendi (${count})`,
  cloudSignedOutToast: 'Bulut eşitlemeden çıkıldı',
  folderLocalDbBadge: 'Yerel olarak kaydedildi (yenilemede otomatik yüklenir)',
  authModalTitle: 'Buluta Giriş Yap',
  authGoogleBtn: 'Google ile Devam Et',
  authOrDivider: 'veya e-posta ve şifre ile',
  authModeSignIn: 'Giriş',
  authModeRegister: 'Kayıt Ol',
  cloudSignInBtn: 'Giriş',
});

const PL_CLOUD = makeFallback({
  saveToCloudBtn: 'Zapisz wszystko w chmurze',
  savingToCloudBtn: 'Zapisywanie...',
  cloudConnectedLabel: 'Chmura połączona',
  cloudSignInHint: 'Zaloguj się przez Google lub E-mail i hasło',
  cloudSignOutLabel: 'Wyloguj',
  cloudSavedToast: 'Audius, foldery i URL zapisane w chmurze',
  cloudLoadedToast: (count: number) => `Zsynchronizowano z chmury (${count})`,
  cloudSignedOutToast: 'Wylogowano z chmury',
  folderLocalDbBadge: 'Zapisano lokalnie (automatyczne przywracanie po odświeżeniu)',
  authModalTitle: 'Zaloguj się do chmury',
  authGoogleBtn: 'Kontynuuj przez Google',
  authOrDivider: 'lub przez e-mail i hasło',
  authModeSignIn: 'Logowanie',
  authModeRegister: 'Rejestracja',
  cloudSignInBtn: 'Zaloguj',
});

const AR_CLOUD = makeFallback({
  saveToCloudBtn: 'حفظ كل التبويبات في السحابة',
  savingToCloudBtn: 'جارٍ الحفظ في السحابة...',
  cloudConnectedLabel: 'السحابة متصلة',
  cloudSignInHint: 'سجّل الدخول عبر Google أو البريد وكلمة المرور',
  cloudSignOutLabel: 'تسجيل الخروج',
  cloudSavedToast: 'تم حفظ Audius والمجلدات والروابط في السحابة',
  cloudLoadedToast: (count: number) => `تمت المزامنة من السحابة (${count})`,
  cloudSignedOutToast: 'تم تسجيل الخروج من السحابة',
  folderLocalDbBadge: 'محفوظ محلياً (يُستعاد تلقائياً بعد التحديث)',
  authModalTitle: 'تسجيل الدخول للسحابة',
  authGoogleBtn: 'المتابعة باستخدام Google',
  authOrDivider: 'أو بالبريد الإلكتروني وكلمة المرور',
  authModeSignIn: 'دخول',
  authModeRegister: 'تسجيل',
  cloudSignInBtn: 'دخول',
});

const HI_CLOUD = makeFallback({
  saveToCloudBtn: 'सभी टैब क्लाउड में सहेजें',
  savingToCloudBtn: 'क्लाउड में सहेजा जा रहा है...',
  cloudConnectedLabel: 'क्लाउड जुड़ा हुआ है',
  cloudSignInHint: 'Google या ईमेल और पासवर्ड से साइन इन करें',
  cloudSignOutLabel: 'साइन आउट',
  cloudSavedToast: 'Audius, फ़ोल्डर और URL क्लाउड में सहेजे गए',
  cloudLoadedToast: (count: number) => `क्लाउड से सिंक किया गया (${count})`,
  cloudSignedOutToast: 'क्लाउड सिंक से साइन आउट हो गए',
  folderLocalDbBadge: 'स्थानीय रूप से सहेजा गया (रीलोड पर स्वतः पुनर्स्थापित)',
  authModalTitle: 'क्लाउड सिंक साइन इन',
  authGoogleBtn: 'Google से जारी रखें',
  authOrDivider: 'या ईमेल और पासवर्ड से',
  authModeSignIn: 'साइन इन',
  authModeRegister: 'रजिस्टर',
  cloudSignInBtn: 'साइन इन',
});

const UZ_CLOUD = makeFallback({
  saveToCloudBtn: 'Hammasini bulutga saqlash',
  savingToCloudBtn: 'Bulutga saqlanmoqda...',
  cloudConnectedLabel: 'Bulut ulangan',
  cloudSignInHint: 'Google yoki Email va parol orqali kiring',
  cloudSignOutLabel: 'Chiqish',
  cloudSavedToast: 'Audius, jildlar va URL manbalar bulutga saqlandi',
  cloudLoadedToast: (count: number) => `Bulutdan yuklandi (${count})`,
  cloudSignedOutToast: 'Bulut profilidan chiqildi',
  folderLocalDbBadge: 'Mahalliy saqlangan (qayta yuklashda avtomatik ulanadi)',
  authModalTitle: 'Bulutga kirish',
  authGoogleBtn: 'Google orqali kirish',
  authOrDivider: 'yoki Email va parol bilan',
  authModeSignIn: 'Kirish',
  authModeRegister: 'Ro‘yxatdan o‘tish',
  cloudSignInBtn: 'Kirish',
});

const KK_CLOUD = makeFallback({
  saveToCloudBtn: 'Барлығын бұлтқа сақтау',
  savingToCloudBtn: 'Бұлтқа сақталуда...',
  cloudConnectedLabel: 'Бұлт қосылды',
  cloudSignInHint: 'Google немесе Email және құпиясөз арқылы кіріңіз',
  cloudSignOutLabel: 'Шығу',
  cloudSavedToast: 'Audius, қалталар және URL бұлтқа сақталды',
  cloudLoadedToast: (count: number) => `Бұлттан жүктелді (${count})`,
  cloudSignedOutToast: 'Бұлт профилінен шықтыңыз',
  folderLocalDbBadge: 'Жергілікті сақталған (қайта жүктегенде автоматты қосылады)',
  authModalTitle: 'Бұлтқа кіру',
  authGoogleBtn: 'Google арқылы кіру',
  authOrDivider: 'немесе Email және құпиясөзбен',
  authModeSignIn: 'Кіру',
  authModeRegister: 'Тіркелу',
  cloudSignInBtn: 'Кіру',
});

const CLOUD_MESSAGES_MAP: Record<SupportedLang, CloudMessages> = {
  en: EN_CLOUD,
  ru: RU_CLOUD,
  uk: UK_CLOUD,
  es: ES_CLOUD,
  fr: FR_CLOUD,
  de: DE_CLOUD,
  it: IT_CLOUD,
  pt: PT_CLOUD,
  zh: ZH_CLOUD,
  ja: JA_CLOUD,
  ko: KO_CLOUD,
  tr: TR_CLOUD,
  pl: PL_CLOUD,
  ar: AR_CLOUD,
  hi: HI_CLOUD,
  uz: UZ_CLOUD,
  kk: KK_CLOUD,
};

export function getCloudMessages(lang: SupportedLang): CloudMessages {
  return CLOUD_MESSAGES_MAP[lang] ?? EN_CLOUD;
}
