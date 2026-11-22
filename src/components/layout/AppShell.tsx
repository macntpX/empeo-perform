import React, { useState } from 'react';
import {
  LogOut,
  Menu,
  X,
  Calendar,
  CheckCircle2,
  Info,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import { useHRM } from '../../context/HRMContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { PHASE_LABELS, PHASE_LABELS_TH } from '../ui/Badges';
import { EmpeoLogo } from '../ui/EmpeoLogo';
import { LanguageDropdown } from '../ui/LanguageDropdown';
import { RoleSwitcherDropdown } from '../ui/RoleSwitcherDropdown';
import { QuickStartGuideModal } from '../ui/QuickStartGuideModal';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
}

interface AppShellProps {
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  pageTitle: string;
  pageSubtitle?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  navItems,
  activeTab,
  onTabChange,
  pageTitle,
  pageSubtitle,
  headerActions,
  children,
}) => {
  const { currentUser, logout, state, toast, dbStatus, lastSavedAt } = useHRM();
  const { lang, bi } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  if (!currentUser) return null;

  const roleBadgeColor =
    currentUser.role === 'HR'
      ? 'bg-[#EEF0FF] text-[#5B63F6]'
      : currentUser.role === 'MANAGER'
      ? 'bg-[#FFF3EF] text-[#EE5D36]'
      : 'bg-[#ECFDF5] text-[#16A34A]';

  const roleLabel =
    currentUser.role === 'HR'
      ? bi('ผู้ดูแล HR', 'HR Admin')
      : currentUser.role === 'MANAGER'
      ? bi('หัวหน้างาน', 'Manager')
      : bi('พนักงาน', 'Employee');

  const phaseText = lang === 'th' ? PHASE_LABELS_TH[state.cycle.phase] : PHASE_LABELS[state.cycle.phase];

  const SidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#E8ECF2] w-[252px] min-w-[252px] max-w-[252px] shrink-0">
      {/* Brand Header */}
      <div className="px-5 h-16 border-b border-[#E8ECF2] flex items-center justify-between shrink-0">
        <EmpeoLogo subtitle="Perform" size="sm" />
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden text-slate-400 hover:text-[#212141] p-1"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Active Cycle Summary */}
      <div className="px-4 pt-4 shrink-0">
        <div className="bg-[#F7F8FA] border border-[#E8ECF2] rounded-xl p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="w-3 h-3 text-[#EE5D36]" /> {bi('รอบประเมิน', 'Review Cycle')}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                state.cycle.phase === 'PUBLISHED'
                  ? 'bg-[#ECFDF5] text-[#16A34A]'
                  : 'bg-[#FFF3EF] text-[#EE5D36]'
              }`}
            >
              {phaseText}
            </span>
          </div>
          <div className="text-xs font-bold text-[#212141] truncate">{state.cycle.name}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {bi('กำหนดส่ง', 'Due')} {state.cycle.deadline}
          </div>
        </div>
      </div>

      {/* Navigation — Consistent font-semibold prevents text width jitter */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-2.5 pb-2 text-[11px] font-semibold text-slate-400">
          {bi(`เมนู${roleLabel}`, `${roleLabel} Menu`)}
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setMobileMenuOpen(false);
              }}
              className={`relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
                isActive
                  ? 'bg-[#FFF3EF] text-[#EE5D36]'
                  : 'text-[#4B5563] hover:bg-[#F7F8FA] hover:text-[#212141]'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#EE5D36]" />
              )}
              <span className="flex items-center gap-2.5 min-w-0">
                <span className="shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </span>
              {item.badge !== undefined && item.badge !== 0 && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    isActive
                      ? 'bg-[#EE5D36] text-white'
                      : 'bg-[#FFF1F2] text-[#E11D48]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Current User Footer */}
      <div className="p-4 border-t border-[#E8ECF2] bg-[#FAFBFD] space-y-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#212141] text-white font-bold text-xs flex items-center justify-center shrink-0">
            {currentUser.avatarInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-[#212141] truncate">{currentUser.name}</div>
            <div className="text-[11px] text-slate-500 truncate">{currentUser.title}</div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-0.5">
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${roleBadgeColor}`}>
            {roleLabel}
          </span>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#EE5D36] px-2 py-1 rounded-lg hover:bg-[#FFF3EF] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            {bi('ออกจากระบบ', 'Sign Out')}
          </button>
        </div>
        <RoleSwitcherDropdown />
      </div>
    </div>
  );

  return (
    /* Locked Viewport Enterprise App Shell — Mobile/Tablet/Desktop Responsive & Zero-Shift */
    <div className="h-[100dvh] w-screen overflow-hidden flex bg-[#F7F8FA]">
      {/* Fixed Desktop Sidebar */}
      <aside className="hidden lg:flex w-[252px] min-w-[252px] max-w-[252px] shrink-0 h-full">
        {SidebarContent}
      </aside>

      {/* Mobile & Tablet Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#212141]/40 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 flex h-full">{SidebarContent}</div>
        </div>
      )}

      {/* Right Column: Fixed Header + Dedicated Scrollable Main Area */}
      <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
        {/* Top Bar — Fixed height & identical container width to main */}
        <header className="shrink-0 bg-white border-b border-[#E8ECF2] lg:overflow-y-scroll lg:[scrollbar-gutter:stable] [&::-webkit-scrollbar]:invisible">
          <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:bg-[#F7F8FA] shrink-0"
                aria-label="Open navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-extrabold text-[#212141] truncate tracking-tight leading-tight">
                  {pageTitle}
                </h1>
                {pageSubtitle && (
                  <p className="hidden sm:block text-xs text-slate-500 truncate mt-0.5 leading-tight">
                    {pageSubtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Interactive 2-Min Reviewer Guide Button */}
              <button
                type="button"
                onClick={() => setGuideOpen(true)}
                title={bi('คู่มือทดลองใช้งาน 2 นาที', '2-Minute Reviewer Guide')}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#FFF3EF] hover:bg-[#FFE4DB] border border-[#FFD6CA] text-[#EE5D36] text-xs font-bold transition-colors"
              >
                <Compass className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{bi('คู่มือเทส', 'Guide')}</span>
              </button>

              {/* Language Switcher Dropdown (TH / EN) */}
              <LanguageDropdown />

              {/* Live DB Sync Indicator — Fixed min-width prevents header shift */}
              <div
                title={
                  dbStatus === 'synced'
                    ? `Saved to data/empeo-db.json at ${lastSavedAt ?? 'just now'}`
                    : dbStatus === 'saving'
                    ? 'Saving changes to database...'
                    : 'Saved in browser storage'
                }
                className="hidden xl:inline-flex items-center justify-center gap-1.5 min-w-[120px] px-2.5 py-1 rounded-full bg-[#F7F8FA] border border-[#E8ECF2] text-[11px] font-medium text-slate-600 tabular-nums"
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    dbStatus === 'synced'
                      ? 'bg-[#16A34A]'
                      : dbStatus === 'saving'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-slate-400'
                  }`}
                />
                <span>
                  {dbStatus === 'synced'
                    ? `${bi('บันทึกแล้ว', 'Saved')}${lastSavedAt ? ` ${lastSavedAt}` : ''}`
                    : dbStatus === 'saving'
                    ? bi('กำลังบันทึก...', 'Saving...')
                    : bi('โหมดออฟไลน์', 'Local Mode')}
                </span>
              </div>

              {/* Desktop / Tablet Header Actions */}
              {headerActions && (
                <div className="hidden md:flex items-center gap-2">{headerActions}</div>
              )}
            </div>
          </div>

          {/* Mobile / Small-Tablet Action Bar (only shown if page has headerActions) */}
          {headerActions && (
            <div className="md:hidden px-4 sm:px-6 pb-3 pt-0.5 flex items-center gap-2 overflow-x-auto border-t border-[#F1F4F9]">
              {headerActions}
            </div>
          )}
        </header>

        {/* Dedicated Scroll Container — Always reserves exact scrollbar width on desktop */}
        <div className="flex-1 overflow-y-auto lg:overflow-y-scroll lg:[scrollbar-gutter:stable]">
          <main
            key={activeTab}
            className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 animate-page-enter"
          >
            {children}
          </main>
        </div>
      </div>

      {/* Interactive Reviewer Quick-Start Guide Modal */}
      <QuickStartGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        onNavigateTab={onTabChange}
      />

      {/* Clean Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-5 sm:right-5 z-50 flex items-center gap-2.5 bg-[#212141] text-white px-4 py-3 rounded-xl shadow-lg text-xs font-semibold animate-toast-in">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
};
