import {
  ChevronDown,
  Cloud,
  FileAudio,
  FolderOpen,
  Globe,
  Loader2,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { ChangeEvent, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import {
  ConfirmDeleteTarget,
  SavedFolderEntry,
  SavedUrlEntry,
  SourceTab,
} from '../types/audio';

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
}: SourcesModalProps) {
  const { t } = useI18n();
  const [audiusInput, setAudiusInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isAudiusListOpen, setIsAudiusListOpen] = useState(true);
  const [isFolderListOpen, setIsFolderListOpen] = useState(true);
  const [isUrlListOpen, setIsUrlListOpen] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<ConfirmDeleteTarget | null>(null);

  if (!isOpen) return null;

  const handleAudiusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = audiusInput.replace(/^@/, '').trim();
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sources-modal-title"
      onClick={onClose}
    >
      <div
        className="glass-modal w-full max-w-lg rounded-3xl p-6 relative border border-white/10 max-h-[90vh] overflow-y-auto hide-scrollbar"
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
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 mb-5">
          <button
            type="button"
            onClick={() => onTabChange('audius')}
            className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'audius'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 shrink-0" />
            <span>{t.tabAudius}</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('folder')}
            className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'folder'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 shrink-0" />
            <span>{t.tabFolder}</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('url')}
            className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'url'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span>{t.tabUrl}</span>
          </button>
        </div>

        {/* TAB 1: AUDIUS */}
        {activeTab === 'audius' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400">{t.audiusHint}</p>
            <form onSubmit={handleAudiusSubmit} className="flex gap-2">
              <input
                type="text"
                value={audiusInput}
                onChange={(e) => setAudiusInput(e.target.value)}
                placeholder={t.audiusPlaceholder}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={isLoadingAudius || !audiusInput.trim()}
                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                {isLoadingAudius && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
                    accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac"
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
                  accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac"
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
                            onClick={() => onSelectSavedFolder(folder)}
                            className="flex items-center gap-2.5 flex-1 text-left cursor-pointer min-w-0 py-0.5"
                          >
                            <FolderOpen className="w-4 h-4 text-purple-400 shrink-0" />
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
                            onClick={() =>
                              setPendingDelete({
                                type: 'folder',
                                id: folder.id,
                                label: folder.name,
                              })
                            }
                            aria-label={`${t.deleteFolderAria} ${folder.name}`}
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

            <form onSubmit={handleUrlSubmit} className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={t.urlPlaceholder}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isLoadingUrl || !urlInput.trim()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                {isLoadingUrl && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
      </div>
    </div>
  );
}
