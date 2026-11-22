import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, RotateCcw, Compass } from 'lucide-react';
import { useHRM } from '../../context/HRMContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { EmpeoLogo } from '../ui/EmpeoLogo';
import { LanguageDropdown } from '../ui/LanguageDropdown';
import { QuickStartGuideModal } from '../ui/QuickStartGuideModal';

export const LoginPage: React.FC = () => {
  const { allAccounts, loginWithCredentials, loginAsDemoAccount, resetAllData } = useHRM();
  const { bi } = useLanguage();
  const [email, setEmail] = useState('hr@empeo.co');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [roleTab, setRoleTab] = useState<'HR' | 'MANAGER' | 'EMPLOYEE'>('HR');
  const [guideOpen, setGuideOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = loginWithCredentials(email, password);
    if (!res.ok) {
      setError(res.error ?? bi('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'Invalid credentials'));
    }
  };

  const tabAccounts = allAccounts.filter((a) => a.role === roleTab);

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      {/* Authentic empeo White Top Navbar */}
      <header className="bg-white border-b border-[#E8ECF2] px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          <EmpeoLogo subtitle="Perform" size="sm" />
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <span className="hidden lg:inline text-xs font-medium text-slate-500">
              {bi(
                'ระบบประเมินผลงานและปรับเทียบมาตรฐานองค์กร',
                'Performance Management & Calibration Suite'
              )}
            </span>
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#EE5D36] bg-[#FFF3EF] hover:bg-[#FFE4DB] px-2.5 sm:px-3 py-1.5 rounded-full border border-[#FFD6CA] transition"
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{bi('คู่มือเทส 2 นาที', '2-Min Guide')}</span>
            </button>
            <LanguageDropdown />
            <button
              type="button"
              onClick={resetAllData}
              title={bi('รีเซ็ตข้อมูลเดโม', 'Reset Demo Data')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#EE5D36] px-2.5 sm:px-3 py-1.5 rounded-full border border-[#E8ECF2] hover:border-[#FFD6CA] bg-white transition"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{bi('รีเซ็ตข้อมูล', 'Reset Data')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Split Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-5 sm:py-10">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-stretch animate-page-enter">
          {/* Left Panel — empeo Deep Navy Showcase */}
          <div className="lg:col-span-6 bg-[#212141] text-white rounded-3xl p-6 sm:p-10 flex flex-col justify-between shadow-card">
            <div>
              <span className="inline-block text-[11px] font-bold tracking-wide text-[#F4815F] bg-white/10 px-3 py-1 rounded-full">
                Empowering People Platform
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-snug mt-4">
                {bi(
                  'ประเมินผลงานประจำปีอย่างเป็นธรรม ทั่วทั้งองค์กร',
                  'Fair performance reviews across your entire organization.'
                )}
              </h1>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                {bi(
                  'เปลี่ยนจากการเก็บคะแนนบนสเปรดชีตและอีเมล มาสู่ระบบประเมิน KPI & Competency พร้อม Z-Score Calibration และ 9-Box Talent ที่โปร่งใส',
                  'Replace spreadsheets and inconsistent manager scales with structured KPI & Competency evaluations, Z-score calibration, and 9-Box talent visibility.'
                )}
              </p>

              {/* empeo-style 3-Color Feature Mini Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
                <div className="rounded-2xl bg-[#EE5D36] p-4 text-white">
                  <div className="text-xs font-extrabold">
                    {bi('ปรับเทียบเป็นธรรม', 'Fair Calibration')}
                  </div>
                  <p className="text-[11px] text-white/90 mt-1.5 leading-relaxed">
                    {bi(
                      'ลดอคติการให้คะแนนระหว่างหัวหน้าสายเข้มงวดและสายใจดี',
                      'Corrects strict vs. lenient manager grading bias automatically.'
                    )}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#2E7CF6] p-4 text-white">
                  <div className="text-xs font-extrabold">
                    {bi('แผนผัง 9-Box', '9-Box Talent')}
                  </div>
                  <p className="text-[11px] text-white/90 mt-1.5 leading-relaxed">
                    {bi(
                      'เห็นกลุ่มดาวรุ่งและกลุ่มที่ต้องโค้ชชิ่งได้ชัดเจนทันที',
                      'Surfaces top stars and coaching priorities clearly.'
                    )}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#5B63F6] p-4 text-white">
                  <div className="text-xs font-extrabold">
                    {bi('โปร่งใสตรวจสอบได้', 'Real Governance')}
                  </div>
                  <p className="text-[11px] text-white/90 mt-1.5 leading-relaxed">
                    {bi(
                      'รองรับ Grace Period, ยกเว้น Probation และ Audit Trail ครบ',
                      'Grace periods, probation rules, and full audit trail.'
                    )}
                  </p>
                </div>
              </div>
              {/* 3-Step Interactive Reviewer Quick-Start Strip */}
              <div className="mt-6 p-4 rounded-2xl bg-white/8 border border-white/15 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-[#F4815F] uppercase tracking-wide">
                    {bi('เริ่มทดลองใน 3 ขั้นตอน (คลิกเข้าได้เลย)', 'Try the Full Flow in 3 Clicks')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGuideOpen(true)}
                    className="text-[11px] font-semibold text-slate-300 hover:text-white underline"
                  >
                    {bi('ดูคู่มือเต็ม', 'Full Guide')}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => loginAsDemoAccount('USR-HR')}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-[#EE5D36] text-left transition group"
                  >
                    <div className="text-[11px] font-extrabold text-white">1. HR Admin</div>
                    <div className="text-[10px] text-slate-300 group-hover:text-white/90">
                      {bi('ดู Z-Score & Override', 'Z-Score & Override')}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => loginAsDemoAccount('USR-MGR-ENG')}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-[#2E7CF6] text-left transition group"
                  >
                    <div className="text-[11px] font-extrabold text-white">2. Manager</div>
                    <div className="text-[10px] text-slate-300 group-hover:text-white/90">
                      {bi('ประเมินทีม & Gap', 'Rate Team & Gaps')}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => loginAsDemoAccount('USR-EMP-01')}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-[#16A34A] text-left transition group"
                  >
                    <div className="text-[11px] font-extrabold text-white">3. Employee</div>
                    <div className="text-[10px] text-slate-300 group-hover:text-white/90">
                      {bi('ดูผลก่อน/หลัง Publish', 'Pre/Post Publish')}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span>empeo HRM • FY 2026</span>
              <span>{bi('ระบบสิทธิ์แยกตามบทบาท', 'Role-Based Access Control')}</span>
            </div>
          </div>

          {/* Right Panel — Clean White Login & Quick Role Switch */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E8ECF2] shadow-card p-8 sm:p-10 flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#212141]">
                {bi('เข้าสู่ระบบ empeo', 'Sign in to empeo')}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {bi(
                  'กรอกอีเมลบริษัทและรหัสผ่าน หรือเลือกบัญชีทดสอบตามบทบาทด้านล่าง',
                  'Enter your work email and password, or pick a workspace account below.'
                )}
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-xs font-semibold text-[#E11D48]">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#212141] mb-1.5">
                    {bi('อีเมลบริษัท', 'Work Email')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@empeo.co"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-[#E8ECF2] rounded-xl bg-[#F7F8FA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EE5D36]/20 focus:border-[#EE5D36] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#212141] mb-1.5">
                    {bi('รหัสผ่าน', 'Password')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-[#E8ECF2] rounded-xl bg-[#F7F8FA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EE5D36]/20 focus:border-[#EE5D36] transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-5 rounded-full bg-[#EE5D36] hover:bg-[#D94D28] text-white text-sm font-bold flex items-center justify-center gap-2 transition shadow-sm"
                >
                  {bi('เข้าสู่ระบบ', 'Sign In')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Clean Tabbed Quick Access Accounts */}
            <div className="pt-5 border-t border-[#E8ECF2] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#212141]">
                  {bi('เข้าใช้งานด่วนตามบทบาท', 'Quick Workspace Sign In')}
                </span>
                <div className="inline-flex bg-[#F7F8FA] p-0.5 rounded-full border border-[#E8ECF2]">
                  {(['HR', 'MANAGER', 'EMPLOYEE'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRoleTab(r)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition ${
                        roleTab === r
                          ? 'bg-white text-[#EE5D36] shadow-xs'
                          : 'text-slate-500 hover:text-[#212141]'
                      }`}
                    >
                      {r === 'HR'
                        ? bi('HR Admin', 'HR Admin')
                        : r === 'MANAGER'
                        ? bi('หัวหน้างาน', 'Manager')
                        : bi('พนักงาน', 'Employee')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {tabAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => loginAsDemoAccount(acc.id)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#F7F8FA] hover:bg-[#FFF3EF] border border-[#E8ECF2] hover:border-[#FFD6CA] transition text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-white border border-[#E8ECF2] text-[#212141] font-bold text-xs flex items-center justify-center shrink-0">
                        {acc.avatarInitials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#212141] truncate">{acc.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {acc.title} • {acc.email}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#EE5D36] shrink-0 ml-2 group-hover:translate-x-0.5 transition">
                      {bi('เข้าใช้งาน →', 'Sign in →')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <QuickStartGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
};
