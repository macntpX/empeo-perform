import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Compass,
  Scale,
  Users,
  UserCheck,
  SlidersHorizontal,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { useHRM } from '../../context/HRMContext';
import { useLanguage } from '../../i18n/LanguageContext';

interface QuickStartGuideModalProps {
  open: boolean;
  onClose: () => void;
  onNavigateTab?: (tabId: string) => void;
}

export const QuickStartGuideModal: React.FC<QuickStartGuideModalProps> = ({
  open,
  onClose,
  onNavigateTab,
}) => {
  const { currentUser, loginAsDemoAccount, resetAllData } = useHRM();
  const { bi } = useLanguage();

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const jumpTo = (accountId: string, tabId?: string) => {
    const isSameUser = currentUser?.id === accountId;
    if (!isSameUser) {
      loginAsDemoAccount(accountId);
    }
    if (isSameUser && tabId && onNavigateTab) {
      onNavigateTab(tabId);
    }
    onClose();
  };

  const steps = [
    {
      num: '1',
      badge: bi('HR Admin', 'HR Admin'),
      badgeCls: 'bg-[#EEF0FF] text-[#5B63F6]',
      icon: <Scale className="w-4 h-4 text-[#5B63F6]" />,
      title: bi(
        'ดูหลักฐาน Z-Score แก้ความลำเอียงข้ามแผนก',
        'See Z-Score Bias Normalization in Action'
      ),
      desc: bi(
        'เปรียบเทียบ Nadia (หัวหน้าสายเข้มงวด: Raw 4.00 → Fair 4.41 High) กับ Kanya (หัวหน้าสายให้สูง: Raw 3.75 → Fair 2.50 Low) แล้วลองกด Calibrate เพื่อทำ Manual Override',
        'Compare Nadia (Strict Mgr: Raw 4.00 → Fair 4.41 High) vs. Kanya (Lenient Mgr: Raw 3.75 → Fair 2.50 Low), toggle Z-Score ON/OFF, or click Calibrate for Manual Override.'
      ),
      cta: bi('ไปหน้า HR Calibration', 'Open HR Calibration'),
      onClick: () => jumpTo('USR-HR', 'calibration'),
    },
    {
      num: '2',
      badge: bi('หัวหน้างาน (Ken)', 'Manager (Ken)'),
      badgeCls: 'bg-[#FFF3EF] text-[#EE5D36]',
      icon: <Users className="w-4 h-4 text-[#EE5D36]" />,
      title: bi(
        'ลองประเมินลูกทีม & เคสหน้างานจริง (Messy Reality)',
        'Evaluate Team & Inspect Messy Reality Cases'
      ),
      desc: bi(
        'ดูแถบ HR Grace Period, เตือนคะแนนต่างกันมาก (Self vs. Mgr Gap) ของ Ploypailin K., พนักงานทดลองงาน (Arthit J.) และลองปรับคะแนน 1–5 แบบ Real-time',
        'Inspect active HR Grace Period, Self vs. Manager Gap alert (Ploypailin K.), Probation Exempt (Arthit J.), and adjust 1–5 rubric scores live.'
      ),
      cta: bi('สลับเป็น Ken Tanaka', 'Switch to Ken Tanaka'),
      onClick: () => jumpTo('USR-MGR-ENG'),
    },
    {
      num: '3',
      badge: bi('พนักงาน (Nadia)', 'Employee (Nadia)'),
      badgeCls: 'bg-[#ECFDF5] text-[#16A34A]',
      icon: <UserCheck className="w-4 h-4 text-[#16A34A]" />,
      title: bi(
        'ดูการป้องกันผลหลุดก่อน HR กด Publish',
        'Test Pre-Publish Score Protection & Sign-Off'
      ),
      desc: bi(
        'พนักงานจะเห็น Goals และส่ง Self-Review ได้ แต่จะยังไม่เห็นคะแนนสุทธิจนกว่า HR จะกด "ประกาศผลประเมิน (Publish Results)"',
        'Employees can track goals & submit self-reviews, while official scores stay hidden until HR clicks "Publish Results".'
      ),
      cta: bi('สลับเป็น Nadia Srisai', 'Switch to Nadia Srisai'),
      onClick: () => jumpTo('USR-EMP-01'),
    },
    {
      num: '4',
      badge: bi('HR ตั้งค่า & CRUD', 'HR Setup & CRUD'),
      badgeCls: 'bg-slate-100 text-[#212141]',
      icon: <SlidersHorizontal className="w-4 h-4 text-[#212141]" />,
      title: bi(
        'เพิ่มหัวหน้า/พนักงานแล้วล็อกอินจริง + แก้คำถามประเมิน',
        'Add Managers/Employees & Customize Criteria'
      ),
      desc: bi(
        'ลองเพิ่ม Manager หรือ Employee ใหม่แล้วใช้ Email + Password ล็อกอินได้ทันที หรือแก้หัวข้อ Core Competencies ในแท็บ รอบประเมินและนโยบาย',
        'Create a new Manager or Employee and sign in immediately, or edit Core Competency questions in Cycle & Policies with Phase Guardrails.'
      ),
      cta: bi('ไปหน้าจัดการรายชื่อ', 'Open HR Directory'),
      onClick: () => jumpTo('USR-HR', 'directory'),
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
      <div
        className="fixed inset-0 bg-[#212141]/50 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="relative z-10 bg-white w-full max-w-2xl max-h-[90dvh] rounded-3xl shadow-2xl border border-[#E8ECF2] flex flex-col overflow-hidden animate-modal-pop">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-[#212141] text-white flex items-start justify-between gap-3 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#F4815F] bg-white/10 px-2.5 py-0.5 rounded-full">
              <Compass className="w-3.5 h-3.5" />
              {bi('คู่มือทดลองใช้งาน 2 นาที', '2-Minute Reviewer Quick-Start')}
            </div>
            <h2 className="text-base sm:text-lg font-extrabold mt-1.5">
              {bi(
                '4 จุดสำคัญที่อยากให้ลองคลิกใน empeo Perform',
                '4 Key Flows to Explore in empeo Perform'
              )}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {bi(
                'ไม่ต้องอ่าน README ก็ลองเล่นครบทุกบทบาทได้ทันที กดปุ่มด้านล่างเพื่อกระโดดไปแต่ละเคสได้เลย',
                'Jump directly into each role and real-world scenario below — no setup needed.'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition shrink-0"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {steps.map((step) => (
            <div
              key={step.num}
              className="p-4 rounded-2xl border border-[#E8ECF2] bg-[#FAFBFD] hover:border-[#FFD6CA] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-5 h-5 rounded-full bg-[#212141] text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">
                    {step.num}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${step.badgeCls}`}>
                    {step.badge}
                  </span>
                  <span className="inline-flex items-center">{step.icon}</span>
                </div>
                <div className="text-sm font-extrabold text-[#212141]">{step.title}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
              <button
                type="button"
                onClick={step.onClick}
                className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#EE5D36] text-[#212141] hover:text-white border border-[#E8ECF2] hover:border-[#EE5D36] text-xs font-bold transition shadow-xs"
              >
                <span>{step.cta}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-[#E8ECF2] bg-[#FAFBFD] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              resetAllData();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {bi('รีเซ็ตข้อมูลเดโมทั้งหมด', 'Reset All Demo Data')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#212141] hover:bg-[#2d2d57] text-white text-xs font-bold transition"
          >
            {bi('เริ่มใช้งานเลย', 'Got It, Let Me Explore')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

