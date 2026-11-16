import { RotateCcw, Sliders, X } from 'lucide-react';
import { EQ_BANDS, EQ_PRESETS } from '../constants/visualizer';
import { useI18n } from '../i18n/I18nContext';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  gains: number[];
  onGainChange: (index: number, value: number) => void;
  onApplyPreset: (gains: number[]) => void;
}

export function EqualizerModal({
  isOpen,
  onClose,
  gains,
  onGainChange,
  onApplyPreset,
}: EqualizerModalProps) {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="eq-modal-title"
      onClick={onClose}
    >
      <div
        className="glass-modal w-full max-w-lg rounded-3xl p-5 sm:p-6 relative border border-white/10 max-h-[90vh] overflow-y-auto hide-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-purple-400" />
            <h3 id="eq-modal-title" className="font-bold text-lg text-white">
              {t.eqTitle}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onApplyPreset([0, 0, 0, 0, 0])}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-300 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.resetBtn}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.closeEqLabel}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2 mb-6">
          {EQ_PRESETS.map((preset) => {
            const isActive = preset.gains.every((val, idx) => Math.abs((gains[idx] ?? 0) - val) < 0.1);
            const presetLabel =
              t.eqPresets[preset.id as keyof typeof t.eqPresets] || preset.label;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyPreset([...preset.gains])}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {presetLabel}
              </button>
            );
          })}
        </div>

        {/* 5 Frequency Bands */}
        <div className="space-y-4">
          {EQ_BANDS.map((band, idx) => {
            const val = gains[idx] ?? 0;
            const formatted = val > 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
            const localizedBand = t.eqBands[idx] || band;
            return (
              <div key={band.freq} className="grid grid-cols-12 items-center gap-3">
                <div className="col-span-4 sm:col-span-3">
                  <div className="text-xs font-semibold text-gray-200 font-mono tabular-nums">
                    {localizedBand.label}
                  </div>
                  <div className="text-[11px] text-gray-400">{localizedBand.desc}</div>
                </div>
                <div className="col-span-6 sm:col-span-7 flex items-center">
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={0.5}
                    value={val}
                    aria-label={`${localizedBand.label} (${localizedBand.desc})`}
                    onChange={(e) => onGainChange(idx, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-full cursor-pointer"
                  />
                </div>
                <div className="col-span-2 text-right font-mono tabular-nums text-xs font-semibold text-purple-300">
                  {formatted} {t.dbUnit}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
