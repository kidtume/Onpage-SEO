
import React, { useState } from 'react';
import { CheckResult } from '../types';

interface ChecklistSectionProps {
  title: string;
  checks: CheckResult[];
}

const ChecklistSection: React.FC<ChecklistSectionProps> = ({ title, checks }) => {
  const [selectedCheck, setSelectedCheck] = useState<CheckResult | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-500 text-white shadow-sm shadow-green-200"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></div>;
      case 'failed':
        return <div className="w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white shadow-sm shadow-red-200"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg></div>;
      case 'warning':
        return <div className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-500 text-white shadow-sm shadow-amber-200"><span className="text-[14px] font-black">!</span></div>;
      default:
        return <div className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 shadow-sm"><span className="text-[10px] font-black">...</span></div>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-slate-800';
      case 'failed': return 'text-red-600';
      case 'warning': return 'text-amber-700';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="bg-white p-7 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col h-full overflow-hidden relative">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
          {title}
        </h3>
        <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100 uppercase">{checks.length} tiêu chí</span>
      </div>
      
      <div className="space-y-4 flex-grow overflow-y-auto max-h-[500px] pr-2 scrollbar-thin scrollbar-thumb-slate-200">
        {checks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
               <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">Đang chờ phân tích...</p>
          </div>
        ) : (
          checks.map((check) => (
            <div key={check.id} className="group flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 relative">
              <div className="shrink-0 mt-0.5 group-hover:scale-110 transition-transform">{getStatusIcon(check.status)}</div>
              <div className="flex flex-col flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-bold leading-tight truncate ${getStatusColor(check.status)}`}>
                    {check.label}
                  </p>
                  {check.description && (
                    <button 
                      onClick={() => setSelectedCheck(check)}
                      className="p-1 rounded-full hover:bg-indigo-100 text-slate-300 hover:text-indigo-600 transition-all focus:outline-none"
                      title="Xem hướng dẫn chi tiết"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                {check.message && (
                  <p className="text-[11px] font-medium text-slate-400 mt-1 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    {check.message}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal chi tiết sửa lỗi thay thế Tooltip cũ */}
      {selectedCheck && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white w-full max-w-2xl max-h-[85vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                {getStatusIcon(selectedCheck.status)}
                <div>
                  <h4 className="text-xl font-black text-slate-900 leading-none">{selectedCheck.label}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Hướng dẫn sửa lỗi Semantic SEO</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCheck(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-900 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Nội dung chi tiết */}
            <div className="p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 text-slate-700 leading-relaxed">
              <div className="bg-indigo-50 border-l-4 border-indigo-600 p-6 rounded-2xl mb-6">
                <p className="text-sm font-bold text-indigo-900 mb-1 uppercase tracking-tight">Vấn đề ghi nhận:</p>
                <p className="text-indigo-800 italic">{selectedCheck.message || "Tiêu chí này cần được cải thiện để đạt chuẩn SEO Semantic chuyên sâu."}</p>
              </div>
              
              <div className="prose prose-slate max-w-none">
                <h5 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                  <span className="bg-indigo-600 w-2 h-6 rounded-full inline-block"></span>
                  PHÂN TÍCH & HƯỚNG DẪN CHI TIẾT
                </h5>
                <div className="whitespace-pre-wrap text-base font-medium text-slate-600 leading-loose">
                  {selectedCheck.description}
                </div>
              </div>

              {/* Ghi chú chân trang của Modal */}
              <div className="mt-10 pt-8 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                <span>SEO EXPERT PRO ENGINE v2.0</span>
                <span>Audit Code: {selectedCheck.id}</span>
              </div>
            </div>

            {/* Footer Modal với nút đóng */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
              <button 
                onClick={() => setSelectedCheck(null)}
                className="px-12 py-4 bg-indigo-900 hover:bg-indigo-950 text-white font-black rounded-full shadow-lg shadow-indigo-200 transition-all transform hover:scale-105 active:scale-95 text-sm uppercase tracking-widest"
              >
                ĐÃ HIỂU & SẼ CHỈNH SỬA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChecklistSection;
