import {
  Camera,
  Disc3,
  FolderOpen,
  HelpCircle,
  Sliders,
  Sparkles,
  Video,
  X,
} from 'lucide-react';
import { useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { getHelpMessages, HelpSectionId } from '../i18n/helpMessages';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function getSectionIcon(id: HelpSectionId) {
  switch (id) {
    case 'sources':
      return <FolderOpen className="w-4 h-4 text-purple-300 shrink-0" />;
    case 'visuals':
      return <Sparkles className="w-4 h-4 text-sky-300 shrink-0" />;
    case 'orbs':
      return <Disc3 className="w-4 h-4 text-emerald-300 shrink-0" />;
    case 'backdrop':
      return <Camera className="w-4 h-4 text-fuchsia-300 shrink-0" />;
    case 'studio':
      return <Video className="w-4 h-4 text-rose-300 shrink-0" />;
    case 'audioAndApp':
      return <Sliders className="w-4 h-4 text-amber-300 shrink-0" />;
  }
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const { lang, t } = useI18n();
  const helpT = getHelpMessages(lang);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      data-no-zen-toggle="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={helpT.helpModalTitle}
      onClick={onClose}
    >
      <div
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        className="glass-modal w-full max-w-2xl rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10 mb-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-600/25 border border-purple-400/35 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 text-purple-300" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base sm:text-lg text-white truncate">
                {helpT.helpModalTitle}
              </h3>
              <p className="text-xs text-gray-400 truncate">{helpT.helpModalSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeWindowLabel}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 hide-scrollbar">
          {helpT.sections.map((section) => (
            <section
              key={section.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5"
            >
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                {getSectionIcon(section.id)}
                <span>{section.title}</span>
              </h4>
              <ul className="space-y-2 text-xs sm:text-[13px] text-gray-300 leading-relaxed">
                {section.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400/80 shrink-0"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="pt-4 mt-4 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600/35 to-fuchsia-600/30 hover:from-purple-600/50 hover:to-fuchsia-600/45 border border-purple-400/40 text-xs sm:text-sm font-semibold text-white transition cursor-pointer"
          >
            {helpT.helpCloseBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
