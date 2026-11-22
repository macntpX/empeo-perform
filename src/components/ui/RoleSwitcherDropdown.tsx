import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeftRight, Check, RotateCcw } from 'lucide-react';
import { useHRM } from '../../context/HRMContext';
import { useLanguage } from '../../i18n/LanguageContext';

export const RoleSwitcherDropdown: React.FC = () => {
  const { currentUser, allAccounts, loginAsDemoAccount, resetAllData } = useHRM();
  const { bi } = useLanguage();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ bottom: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setMenuPos({
      bottom: window.innerHeight - rect.top + 8,
      left: Math.max(12, Math.min(rect.left, window.innerWidth - 280)),
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

  if (!currentUser) return null;

  const getRoleTag = (role: string) => {
    if (role === 'HR') return { label: bi('HR', 'HR'), cls: 'bg-[#EEF0FF] text-[#5B63F6]' };
    if (role === 'MANAGER') return { label: bi('หัวหน้า', 'Mgr'), cls: 'bg-[#FFF3EF] text-[#EE5D36]' };
    return { label: bi('พนักงาน', 'Emp'), cls: 'bg-[#ECFDF5] text-[#16A34A]' };
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#212141] bg-white hover:bg-[#FFF3EF] hover:text-[#EE5D36] border border-[#E8ECF2] hover:border-[#FFD6CA] px-3 py-1.5 rounded-xl transition-colors"
      >
        <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
        <span>{bi('สลับบทบาท (Demo)', 'Switch Role (Demo)')}</span>
      </button>

      {open &&
        menuPos &&
        createPortal(
          <div
            ref={menuRef}
            style={{ bottom: menuPos.bottom, left: menuPos.left }}
            className="fixed w-64 bg-white rounded-2xl border border-[#E8ECF2] shadow-xl py-2 z-[100] animate-modal-pop"
          >
            <div className="px-3.5 pb-1.5 mb-1 border-b border-[#E8ECF2] flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                {bi('สลับบัญชีทดสอบทันที', 'Quick Demo Switcher')}
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto px-1.5 space-y-0.5">
              {allAccounts.map((acc) => {
                const isActive = acc.id === currentUser.id;
                const tag = getRoleTag(acc.role);
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      loginAsDemoAccount(acc.id);
                      setOpen(false);
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between gap-2 transition-colors ${
                      isActive ? 'bg-[#FFF3EF]' : 'hover:bg-[#F7F8FA]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-bold truncate ${
                            isActive ? 'text-[#EE5D36]' : 'text-[#212141]'
                          }`}
                        >
                          {acc.name}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${tag.cls}`}>
                          {tag.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{acc.title}</div>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-[#EE5D36] shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-1.5 pt-1.5 px-1.5 border-t border-[#E8ECF2]">
              <button
                type="button"
                onClick={() => {
                  resetAllData();
                  setOpen(false);
                }}
                className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>{bi('รีเซ็ตข้อมูลเดโมทั้งหมด', 'Reset All Demo Data')}</span>
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

