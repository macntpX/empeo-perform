import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { Language, useLanguage } from '../../i18n/LanguageContext';

const OPTIONS: { code: Language; short: string; label: string; flag: string }[] = [
  { code: 'th', short: 'TH', label: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'en', short: 'EN', label: 'English', flag: '🇬🇧' },
];

export const LanguageDropdown: React.FC = () => {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 8,
      right: Math.max(12, window.innerWidth - rect.right),
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const handleReposition = () => updatePosition();

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open]);

  const current = OPTIONS.find((o) => o.code === lang) ?? OPTIONS[1];

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center justify-between gap-1.5 min-w-[78px] px-3 py-1.5 rounded-full bg-white hover:bg-[#F7F8FA] border border-[#E8ECF2] hover:border-[#FFD6CA] text-xs font-bold text-[#212141] transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-[#EE5D36] shrink-0" />
          <span>{current.short}</span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open &&
        menuPos &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{ top: menuPos.top, right: menuPos.right }}
            className="fixed w-44 bg-white rounded-2xl border border-[#E8ECF2] shadow-lg py-1.5 z-[100] animate-modal-pop"
          >
            {OPTIONS.map((opt) => {
              const active = opt.code === lang;
              return (
                <button
                  key={opt.code}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setLang(opt.code);
                    setOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between transition-colors ${
                    active
                      ? 'bg-[#FFF3EF] text-[#EE5D36] font-bold'
                      : 'text-[#212141] font-medium hover:bg-[#F7F8FA]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{opt.flag}</span>
                    <span>{opt.label}</span>
                  </span>
                  {active && <Check className="w-3.5 h-3.5 text-[#EE5D36]" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
};

