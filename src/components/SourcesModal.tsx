import {
  AlertCircle,
  ChevronDown,
  Cloud,
  CloudUpload,
  Eye,
  EyeOff,
  FileAudio,
  FolderOpen,
  Globe,
  HardDrive,
  Loader2,
  LogOut,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { ChangeEvent, useState } from 'react';
import { getCloudMessages } from '../i18n/cloudMessages';
import { useI18n } from '../i18n/I18nContext';
import {
  ConfirmDeleteTarget,
  SavedFolderEntry,
  SavedUrlEntry,
  SourceTab,
} from '../types/audio';
import { extractAudiusHandle } from '../utils/audiusApi';
import { CloudUserInfo } from '../utils/firebaseCloud';

interface SourcesModalProps {
  isOpen: boolean;
  activeTab: SourceTab;
  onTabChange: (tab: SourceTab) => void;
  onClose: () => void;

  // Audius
  savedProfiles: string[];
  currentHandle: string;
  isLoadingAudius: boolean;
  onLoadAudiusProfile: (handle: string) => void;

  // Folders
  savedFolders: SavedFolderEntry[];
  activeFolderId: string | null;
  isParsingFiles: boolean;
  onSelectDirectoryPicker?: () => void;
  onSelectFolderInputFiles: (files: FileList | null) => void;
  onSelectSavedFolder: (folder: SavedFolderEntry) => void;

  // URL / Repositories
  savedUrls: SavedUrlEntry[];
  activeUrlId: string | null;
  isLoadingUrl: boolean;
  onLoadUrlSource: (url: string) => void;
  onSelectSavedUrl: (entry: SavedUrlEntry) => void;

  // Delete confirmation
  onConfirmDelete: (target: ConfirmDeleteTarget) => void;

  // Cloud sync & auth
  cloudUser?: CloudUserInfo | null;
  isSavingToCloud?: boolean;
  onSaveToCloud?: (tab: SourceTab) => void;
  onSignInGoogleCloud?: (
    saveAfterTab?: SourceTab
  ) => Promise<{ ok: boolean; errorMsg?: string } | boolean>;
  onSignInEmailCloud?: (
    email: string,
    password: string,
    mode: 'signin' | 'register',
    saveAfterTab?: SourceTab
  ) => Promise<{ ok: boolean; errorMsg?: string }>;
  onResetPasswordCloud?: (email: string) => Promise<{ ok: boolean; errorMsg?: string }>;
  onSignOutCloud?: () => void;
}

export function SourcesModal({
  isOpen,
  activeTab,
  onTabChange,
  onClose,
  savedProfiles,
  currentHandle,
  isLoadingAudius,
  onLoadAudiusProfile,
  savedFolders,
  activeFolderId,
  isParsingFiles,
  onSelectDirectoryPicker,
  onSelectFolderInputFiles,
  onSelectSavedFolder,
  savedUrls,
  activeUrlId,
  isLoadingUrl,
  onLoadUrlSource,
  onSelectSavedUrl,
  onConfirmDelete,
  cloudUser,
  isSavingToCloud = false,
  onSaveToCloud,
  onSignInGoogleCloud,
  onSignInEmailCloud,
  onResetPasswordCloud,
  onSignOutCloud,
}: SourcesModalProps) {
  const { t, lang } = useI18n();
  const cloudT = getCloudMessages(lang);
  const [audiusInput, setAudiusInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isAudiusListOpen, setIsAudiusListOpen] = useState(true);
  const [isFolderListOpen, setIsFolderListOpen] = useState(true);
  const [isUrlListOpen, setIsUrlListOpen] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<ConfirmDeleteTarget | null>(null);

  // Cloud auth dialog state
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [pendingSaveTab, setPendingSaveTab] = useState<SourceTab | undefined>(undefined);
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAudiusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = extractAudiusHandle(audiusInput) || audiusInput.replace(/^@/, '').trim();
    if (cleaned) {
      onLoadAudiusProfile(cleaned);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (trimmed) {
      onLoadUrlSource(trimmed);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    onSelectFolderInputFiles(e.target.files);
    e.target.value = '';
  };

  const setFolderAttributes = (el: HTMLInputElement | null) => {
    if (!el) return;
    el.webkitdirectory = true;
    el.setAttribute('webkitdirectory', '');
    el.setAttribute('directory', '');
  };

  const canUseDirectoryPicker =
    typeof window !== 'undefined' &&
    'showDirectoryPicker' in window &&
    window.self === window.top &&
    Boolean(onSelectDirectoryPicker);

  const openAuthModalFor = (saveTab?: SourceTab) => {
    setPendingSaveTab(saveTab);
    setAuthError(null);
    setIsAuthDialogOpen(true);
  };

  const handleCloudActionClick = (tab: SourceTab) => {
    if (!cloudUser) {
      openAuthModalFor(tab);
      return;
    }
    onSaveToCloud?.(tab);
  };

  const handleGoogleAuthClick = async () => {
    if (!onSignInGoogleCloud) return;
    setAuthBusy(true);
    setAuthError(null);
    try {
      const res = await onSignInGoogleCloud(pendingSaveTab);
      const ok = typeof res === 'boolean' ? res : res.ok;
      if (ok) {
        setIsAuthDialogOpen(false);
        setPendingSaveTab(undefined);
      } else if (typeof res === 'object' && res.errorMsg) {
        setAuthError(res.errorMsg);
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSignInEmailCloud) return;
    const email = authEmail.trim();
    if (!email) {
      setAuthError(cloudT.authEnterEmailFirst);
      return;
    }
    if (authPassword.length < 6) {
      setAuthError(cloudT.authWeakPasswordError);
      return;
    }
    setAuthBusy(true);
    setAuthError(null);
    try {
      const res = await onSignInEmailCloud(email, authPassword, authMode, pendingSaveTab);
      if (res.ok) {
        setIsAuthDialogOpen(false);
        setAuthPassword('');
        setPendingSaveTab(undefined);
      } else if (res.errorMsg) {
        setAuthError(res.errorMsg);
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const handleForgotPasswordClick = async () => {
    if (!onResetPasswordCloud) return;
    const email = authEmail.trim();
    if (!email) {
      setAuthError(cloudT.authEnterEmailFirst);
      return;
    }
    setAuthBusy(true);
    setAuthError(null);
    try {
      const res = await onResetPasswordCloud(email);
      if (!res.ok && res.errorMsg) {
        setAuthError(res.errorMsg);
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const renderCloudSaveFooter = (tab: SourceTab) => {
    if (!onSaveToCloud) return null;
    const btnGradient =
      tab === 'audius'
        ? 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-sky-950/40'
        : tab === 'folder'
        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-950/40'
        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/40';

    return (
      <div className="pt-2.5 border-t border-white/10 space-y-2">
        <button
          type="button"
          disabled={isSavingToCloud}
          onClick={() => handleCloudActionClick(tab)}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-lg ${btnGradient}`}
        >
          {isSavingToCloud ? (
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          ) : (
            <CloudUpload className="w-4 h-4 shrink-0" />
          )}
          <span>
            {isSavingToCloud ? cloudT.savingToCloudBtn : cloudT.saveToCloudBtn}
          </span>
        </button>

        {cloudUser ? (
          <div className="flex items-center justify-between gap-2 px-1 text-[11px] text-gray-400">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="truncate">
                {cloudT.cloudConnectedLabel}:{' '}
                <span className="text-gray-200 font-medium">
                  {cloudUser.email || cloudUser.displayName || 'Google'}
                </span>
              </span>
            </div>
            {onSignOutCloud && (
              <button
                type="button"
                onClick={onSignOutCloud}
                className="inline-flex items-center gap-1 text-gray-400 hover:text-white px-2 py-0.5 rounded-lg hover:bg-white/10 transition cursor-pointer shrink-0"
              >
                <LogOut className="w-3 h-3" />
                <span>{cloudT.cloudSignOutLabel}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 px-1 text-[11px] text-gray-400">
            <span className="leading-snug truncate">{cloudT.cloudAllTabsHint}</span>
            <button
              type="button"
              onClick={() => openAuthModalFor(undefined)}
              className="text-sky-400 hover:text-sky-300 font-semibold whitespace-nowrap cursor-pointer shrink-0"
            >
              {cloudT.cloudSignInBtn}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sources-modal-title"
      onClick={onClose}
    >
      <div
        className="glass-modal w-full max-w-lg rounded-3xl p-4 sm:p-6 relative border border-white/10 max-h-[90vh] overflow-y-auto overflow-x-hidden hide-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id="sources-modal-title" className="font-bold text-lg text-white">
            {t.sourcesTitle}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeSourcesLabel}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Tabs */}
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 mb-5">
          <button
            type="button"
            onClick={() => onTabChange('audius')}
            className={`min-w-0 py-2 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer ${
              activeTab === 'audius'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t.tabAudius}</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('folder')}
            className={`min-w-0 py-2 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer ${
              activeTab === 'folder'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t.tabFolder}</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('url')}
            className={`min-w-0 py-2 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer ${
              activeTab === 'url'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t.tabUrl}</span>
          </button>
        </div>

        {/* TAB 1: AUDIUS */}
        {activeTab === 'audius' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400">{t.audiusHint}</p>
            <form onSubmit={handleAudiusSubmit} className="flex items-stretch gap-2 min-w-0">
              <input
                type="text"
                value={audiusInput}
                onChange={(e) => setAudiusInput(e.target.value)}
                placeholder={t.audiusPlaceholder}
                className="flex-1 min-w-0 w-full bg-white/5 border border-white/10 rounded-xl px-3 sm:px-3.5 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={isLoadingAudius || !audiusInput.trim()}
                className="shrink-0 px-3 sm:px-4 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                {isLoadingAudius && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
                <span>{t.loadBtn}</span>
              </button>
            </form>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
              <button
                type="button"
                onClick={() => setIsAudiusListOpen((v) => !v)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-gray-300 hover:text-white transition cursor-pointer"
              >
                <span>
                  {t.savedAudiusProfiles} (
                  <span className="font-mono tabular-nums">{savedProfiles.length}</span>)
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isAudiusListOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isAudiusListOpen && (
                <div className="px-2.5 pb-2.5 space-y-1.5 max-h-52 overflow-y-auto hide-scrollbar">
                  {savedProfiles.length === 0 ? (
                    <div className="text-center py-4 text-xs text-gray-500">
                      {t.emptyAudiusList}
                    </div>
                  ) : (
                    savedProfiles.map((profile) => {
                      const isCurrent =
                        profile.toLowerCase() === currentHandle.toLowerCase();
                      return (
                        <div
                          key={profile}
                          className={`flex items-center justify-between p-2 rounded-xl transition ${
                            isCurrent
                              ? 'bg-sky-500/20 border border-sky-500/35'
                              : 'bg-white/5 hover:bg-white/10 border border-transparent'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onLoadAudiusProfile(profile)}
                            className="flex items-center gap-2.5 flex-1 text-left cursor-pointer min-w-0 py-0.5"
                          >
                            <User className="w-4 h-4 text-sky-400 shrink-0" />
                            <span className="text-xs font-semibold text-gray-100 truncate">
                              @{profile}
                            </span>
                            {isCurrent && (
                              <span className="text-[11px] text-sky-300 shrink-0">
                                · {t.activeBadge}
                              </span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingDelete({
                                type: 'audius',
                                id: profile,
                                label: `@${profile}`,
                              })
                            }
                            aria-label={`${t.deleteProfileAria} @${profile}`}
                            title={t.removeFromListTitle}
                            className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {renderCloudSaveFooter('audius')}
          </div>
        )}

        {/* TAB 2: LOCAL FOLDER */}
        {activeTab === 'folder' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 leading-relaxed">{t.folderHint}</p>

            <div className="space-y-2.5">
              {canUseDirectoryPicker ? (
                <button
                  type="button"
                  onClick={onSelectDirectoryPicker}
                  disabled={isParsingFiles}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl cursor-pointer shadow-lg shadow-purple-900/40 transition"
                >
                  {isParsingFiles ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FolderOpen className="w-4 h-4" />
                  )}
                  <span>{isParsingFiles ? t.scanningFiles : t.pickFolderBtn}</span>
                </button>
              ) : (
                <label className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-semibold rounded-xl cursor-pointer shadow-lg shadow-purple-900/40 transition">
                  {isParsingFiles ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FolderOpen className="w-4 h-4" />
                  )}
                  <span>{isParsingFiles ? t.scanningFiles : t.pickFolderBtn}</span>
                  <input
                    ref={setFolderAttributes}
                    type="file"
                    multiple
                    accept="audio/*,video/mp4,video/webm,video/quicktime,image/*,.mp3,.wav,.flac,.ogg,.m4a,.aac,.mp4,.webm,.mov,.m4v,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileInputChange}
                    disabled={isParsingFiles}
                    className="hidden"
                  />
                </label>
              )}

              <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 text-xs font-semibold rounded-xl cursor-pointer transition">
                <FileAudio className="w-4 h-4 text-purple-300" />
                <span>{t.pickFilesBtn}</span>
                <input
                  type="file"
                  multiple
                  accept="audio/*,video/mp4,video/webm,video/quicktime,image/*,.mp3,.wav,.flac,.ogg,.m4a,.aac,.mp4,.webm,.mov,.m4v,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileInputChange}
                  disabled={isParsingFiles}
                  className="hidden"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
              <button
                type="button"
                onClick={() => setIsFolderListOpen((v) => !v)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-gray-300 hover:text-white transition cursor-pointer"
              >
                <span>
                  {t.savedFolders} (
                  <span className="font-mono tabular-nums">{savedFolders.length}</span>)
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isFolderListOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isFolderListOpen && (
                <div className="px-2.5 pb-2.5 space-y-1.5 max-h-48 overflow-y-auto hide-scrollbar">
                  {savedFolders.length === 0 ? (
                    <div className="text-center py-4 text-xs text-gray-500">
                      {t.emptyFolderList}
                    </div>
                  ) : (
                    savedFolders.map((folder) => {
                      const isActive = folder.id === activeFolderId;
                      return (
                        <div
                          key={folder.id}
                          className={`flex items-center justify-between p-2 rounded-xl transition ${
                            isActive
                              ? 'bg-purple-500/20 border border-purple-500/35'
                              : 'bg-white/5 hover:bg-white/10 border border-transparent'
                          }`}
                        >
                          <button
                            type="button"
                            disabled={isParsingFiles}
                            onClick={() => onSelectSavedFolder(folder)}
                            className="flex items-center gap-2.5 flex-1 text-left cursor-pointer disabled:opacity-60 disabled:cursor-wait min-w-0 py-1 px-0.5 rounded-lg"
                          >
                            {isParsingFiles && isActive ? (
                              <Loader2 className="w-4 h-4 text-purple-300 animate-spin shrink-0" />
                            ) : (
                              <FolderOpen className="w-4 h-4 text-purple-400 shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-gray-100 truncate">
                                {folder.name}
                              </div>
                              <div className="text-[11px] text-gray-400 font-mono tabular-nums">
                                {folder.trackCount} {t.tracksCountWord}
                              </div>
                            </div>
                          </button>
                          <button
                            type="button"
                            disabled={isParsingFiles}
                            onClick={() =>
                              setPendingDelete({
                                type: 'folder',
                                id: folder.id,
                                label: folder.name,
                              })
                            }
                            aria-label={`${t.deleteFolderAria} ${folder.name}`}
                            title={t.removeFromListTitle}
                            className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer shrink-0 disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] text-gray-400">
              <HardDrive className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="leading-snug">{cloudT.folderLocalDbBadge}</span>
            </div>

            {renderCloudSaveFooter('folder')}
          </div>
        )}

        {/* TAB 3: EXTERNAL URL / REPOSITORY */}
        {activeTab === 'url' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 leading-relaxed">
              {t.urlHintHtmlParts.before} <strong>GitHub</strong>,{' '}
              <strong>Archive.org</strong>, <strong>Audius</strong>,{' '}
              <strong>JSON / M3U / RSS</strong> {t.urlHintHtmlParts.orDirect}
            </p>

            <form onSubmit={handleUrlSubmit} className="flex items-stretch gap-2 min-w-0">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={t.urlPlaceholder}
                className="flex-1 min-w-0 w-full bg-white/5 border border-white/10 rounded-xl px-3 sm:px-3.5 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isLoadingUrl || !urlInput.trim()}
                className="shrink-0 px-3 sm:px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                {isLoadingUrl && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
                <span>{t.loadBtn}</span>
              </button>
            </form>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
              <button
                type="button"
                onClick={() => setIsUrlListOpen((v) => !v)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-gray-300 hover:text-white transition cursor-pointer"
              >
                <span>
                  {t.savedUrls} (
                  <span className="font-mono tabular-nums">{savedUrls.length}</span>)
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isUrlListOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isUrlListOpen && (
                <div className="px-2.5 pb-2.5 space-y-1.5 max-h-48 overflow-y-auto hide-scrollbar">
                  {savedUrls.length === 0 ? (
                    <div className="text-center py-4 text-xs text-gray-500">
                      {t.emptyUrlList}
                    </div>
                  ) : (
                    savedUrls.map((entry) => {
                      const isActive = entry.id === activeUrlId;
                      return (
                        <div
                          key={entry.id}
                          className={`flex items-center justify-between p-2 rounded-xl transition ${
                            isActive
                              ? 'bg-emerald-500/20 border border-emerald-500/35'
                              : 'bg-white/5 hover:bg-white/10 border border-transparent'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectSavedUrl(entry)}
                            className="flex items-center gap-2.5 flex-1 text-left cursor-pointer min-w-0 py-0.5"
                          >
                            <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-gray-100 truncate">
                                {entry.label}
                              </div>
                              <div className="text-[11px] text-gray-400 truncate">
                                {entry.url}
                              </div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingDelete({
                                type: 'url',
                                id: entry.id,
                                label: entry.label,
                              })
                            }
                            aria-label={`${t.deleteUrlAria} ${entry.label}`}
                            title={t.removeFromListTitle}
                            className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {renderCloudSaveFooter('url')}
          </div>
        )}

        {/* IN-MODAL DELETE CONFIRMATION DIALOG */}
        {pendingDelete && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            role="alertdialog"
            aria-modal="true"
            onClick={() => setPendingDelete(null)}
          >
            <div
              className="glass-modal w-full max-w-sm rounded-2xl p-5 border border-white/15 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-white">{t.deleteDialogTitle}</h4>
                  <p className="text-xs text-gray-400 truncate">{pendingDelete.label}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300 mb-5 leading-relaxed">
                {t.deleteDialogBody}
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendingDelete(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-200 transition cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onConfirmDelete(pendingDelete);
                    setPendingDelete(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition cursor-pointer"
                >
                  {t.deleteBtn}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* IN-MODAL CLOUD AUTH DIALOG (Google + Email & Password) */}
        {isAuthDialogOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => !authBusy && setIsAuthDialogOpen(false)}
          >
            <div
              className="glass-modal w-full max-w-sm rounded-2xl p-5 border border-white/15 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white">{cloudT.authModalTitle}</h4>
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={() => setIsAuthDialogOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {onSignInGoogleCloud && (
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={() => void handleGoogleAuthClick()}
                  className="w-full py-2.5 px-4 rounded-xl bg-white text-gray-900 hover:bg-gray-100 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>{cloudT.authGoogleBtn}</span>
                </button>
              )}

              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <span className="h-px flex-1 bg-white/10" />
                <span>{cloudT.authOrDivider}</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setAuthError(null);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    authMode === 'signin'
                      ? 'bg-sky-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {cloudT.authModeSignIn}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError(null);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-sky-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {cloudT.authModeRegister}
                </button>
              </div>

              <form onSubmit={(e) => void handleEmailAuthSubmit(e)} className="space-y-2.5">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder={cloudT.authEmailPlaceholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-sky-500"
                />
                <div className="relative">
                  <input
                    type={showAuthPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder={cloudT.authPasswordPlaceholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-3.5 pr-9 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showAuthPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {authError && (
                  <div className="flex items-start gap-2 rounded-xl bg-red-500/15 border border-red-500/30 p-2.5 text-[11px] text-red-200 leading-snug">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authBusy}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {authBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {authMode === 'signin' ? cloudT.authModeSignIn : cloudT.authModeRegister}
                  </span>
                </button>

                {authMode === 'signin' && onResetPasswordCloud && (
                  <div className="text-center pt-0.5">
                    <button
                      type="button"
                      disabled={authBusy}
                      onClick={() => void handleForgotPasswordClick()}
                      className="text-[11px] text-gray-400 hover:text-sky-300 transition cursor-pointer"
                    >
                      {cloudT.authForgotPassword}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
