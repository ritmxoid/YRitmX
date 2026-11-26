import { Disc3, FolderOpen, Loader2, Play, WifiOff } from 'lucide-react';
import { DEFAULT_COVER_IMAGE } from '../constants/visualizer';
import { useI18n } from '../i18n/I18nContext';
import { Track } from '../types/audio';
import { formatPlayCount } from '../utils/audiusApi';

interface PlaylistItemsProps {
  tracks: Track[];
  filteredTracks: Track[];
  currentTrackId: string | undefined;
  isPlaying: boolean;
  isLoading: boolean;
  isOffline?: boolean;
  errorMessage: string | null;
  onSelectTrack: (indexInPlaylist: number) => void;
  onTriggerDemo: () => void;
  onOpenFolderSource?: () => void;
}

export function PlaylistItems({
  tracks,
  filteredTracks,
  currentTrackId,
  isPlaying,
  isLoading,
  isOffline = false,
  errorMessage,
  onSelectTrack,
  onTriggerDemo,
  onOpenFolderSource,
}: PlaylistItemsProps) {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        <p className="text-xs">{t.loadingTracks}</p>
      </div>
    );
  }

  if (isOffline && tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-purple-600/20 border border-purple-500/35 flex items-center justify-center text-purple-300">
          <WifiOff className="w-5 h-5" />
        </div>
        <div className="space-y-1 max-w-xs">
          <p className="text-sm font-semibold text-white">{t.offlineModeTitle}</p>
          <p className="text-xs text-gray-400 leading-relaxed">{t.offlineModeHint}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {onOpenFolderSource && (
            <button
              type="button"
              onClick={onOpenFolderSource}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-semibold shadow-lg shadow-purple-900/40 transition flex items-center gap-1.5 cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{t.chooseDeviceFolderBtn}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onTriggerDemo}
            className="px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-semibold transition cursor-pointer"
          >
            {t.startDemoBeat}
          </button>
        </div>
      </div>
    );
  }

  if (errorMessage && tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-3">
        <p className="text-xs text-red-300 leading-relaxed">{errorMessage}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {onOpenFolderSource && (
            <button
              type="button"
              onClick={onOpenFolderSource}
              className="px-4 py-2 rounded-xl bg-purple-600/25 text-purple-200 border border-purple-500/35 hover:bg-purple-600/35 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{t.chooseDeviceFolderBtn}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onTriggerDemo}
            className="px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-semibold transition cursor-pointer"
          >
            {t.startDemoBeat}
          </button>
        </div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-400 gap-2">
        <Disc3 className="w-6 h-6 text-gray-500" />
        <p className="text-xs">{t.playlistEmpty}</p>
      </div>
    );
  }

  if (filteredTracks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-xs">
        {t.searchNoResults}
      </div>
    );
  }

  return (
    <>
      {filteredTracks.map((track) => {
        const idx = tracks.findIndex((tr) => tr.id === track.id);
        const isActive = track.id === currentTrackId;
        return (
          <button
            key={track.id}
            type="button"
            onClick={() => onSelectTrack(idx)}
            className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
              isActive
                ? 'bg-purple-600/20 border border-purple-500/35'
                : 'bg-white/5 hover:bg-white/10 border border-transparent'
            }`}
          >
            <img
              src={track.cover}
              alt={track.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.dataset.fallbackApplied) {
                  img.dataset.fallbackApplied = '1';
                  img.src = DEFAULT_COVER_IMAGE;
                }
              }}
              className="w-10 h-10 rounded-xl object-cover shrink-0 bg-white/5"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{track.title}</div>
              <div className="text-[11px] text-gray-400 truncate">
                {track.artist}
                {isActive && isPlaying ? ` · ${t.playingStatus}` : ''}
              </div>
            </div>
            {typeof track.playCount === 'number' && (
              <span
                title={track.playCount.toLocaleString()}
                className="shrink-0 inline-flex items-center gap-1 text-[11px] font-mono tabular-nums text-gray-400/80 pl-1"
              >
                <Play className="w-2.5 h-2.5 fill-current opacity-70" />
                <span>{formatPlayCount(track.playCount)}</span>
              </span>
            )}
          </button>
        );
      })}
    </>
  );
}
