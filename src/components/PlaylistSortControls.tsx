import { ArrowDown, ArrowUp, ArrowUpDown, Shuffle } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { PlaylistSortField, PlaylistSortMode } from '../types/audio';

interface PlaylistSortControlsProps {
  sortMode: PlaylistSortMode | null;
  onToggleSort: (field: PlaylistSortField) => void;
  showDateAndPopular?: boolean;
}

export function PlaylistSortControls({
  sortMode,
  onToggleSort,
  showDateAndPopular = true,
}: PlaylistSortControlsProps) {
  const { t } = useI18n();
  const isDateActive = sortMode === 'date-desc' || sortMode === 'date-asc';
  const isPopActive = sortMode === 'popular-desc' || sortMode === 'popular-asc';
  const isRandomActive = sortMode === 'random';

  const dateTitle =
    sortMode === 'date-asc' ? t.sortDateAscTitle : t.sortDateDescTitle;
  const popTitle =
    sortMode === 'popular-asc' ? t.sortPopAscTitle : t.sortPopDescTitle;

  return (
    <div className="inline-flex flex-wrap items-center justify-end gap-1.5 shrink-0">
      {showDateAndPopular && (
        <>
          <button
            type="button"
            onClick={() => onToggleSort('date')}
            aria-pressed={isDateActive}
            title={dateTitle}
            aria-label={dateTitle}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition cursor-pointer whitespace-nowrap ${
              isDateActive
                ? 'bg-purple-600/25 border-purple-400/50 text-purple-200'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/10'
            }`}
          >
            <span>{t.sortByDateLabel}</span>
            {sortMode === 'date-desc' ? (
              <ArrowDown className="w-3 h-3 text-purple-300 shrink-0" />
            ) : sortMode === 'date-asc' ? (
              <ArrowUp className="w-3 h-3 text-purple-300 shrink-0" />
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-60 shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onToggleSort('popular')}
            aria-pressed={isPopActive}
            title={popTitle}
            aria-label={popTitle}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition cursor-pointer whitespace-nowrap ${
              isPopActive
                ? 'bg-purple-600/25 border-purple-400/50 text-purple-200'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/10'
            }`}
          >
            <span>{t.sortByPopularityLabel}</span>
            {sortMode === 'popular-desc' ? (
              <ArrowDown className="w-3 h-3 text-purple-300 shrink-0" />
            ) : sortMode === 'popular-asc' ? (
              <ArrowUp className="w-3 h-3 text-purple-300 shrink-0" />
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-60 shrink-0" />
            )}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => onToggleSort('random')}
        aria-pressed={isRandomActive}
        title={t.sortRandomTitle}
        aria-label={t.sortRandomTitle}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition cursor-pointer whitespace-nowrap ${
          isRandomActive
            ? 'bg-purple-600/25 border-purple-400/50 text-purple-200'
            : 'bg-white/5 border-white/10 text-gray-400 hover:text-gray-200 hover:bg-white/10'
        }`}
      >
        <span>{t.sortByRandomLabel}</span>
        <Shuffle className={`w-3 h-3 shrink-0 ${isRandomActive ? 'text-purple-300' : 'opacity-60'}`} />
      </button>
    </div>
  );
}
