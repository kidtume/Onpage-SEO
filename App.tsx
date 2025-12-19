
import React, { useState, useEffect } from 'react';
import { TabType, SEOInput, SEOAnalysis, SEOHistoryItem } from './types';
import { runHardcodedOnPageChecks, analyzeWithAI } from './services/seoAnalyzer';
import ChecklistSection from './components/ChecklistSection';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.INPUT);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [history, setHistory] = useState<SEOHistoryItem[]>([]);
  
  const [input, setInput] = useState<SEOInput>({
    mainKeyword: '',
    url: '',
    title: '',
    metaDescription: '',
    content: '',
    outline: ''
  });

  const [analysis, setAnalysis] = useState<SEOAnalysis>({
    onPage: [],
    outline: [],
    writing: [],
    overallScore: 0,
    aiFeedback: '',
    subScores: { onpage: 0, outline: 0, writing: 0 },
    strategicReport: { pros: [], cons: [], summary: '' }
  });

  const loadingMessages = [
    "Đang kiểm tra các tiêu chí Onpage cơ bản...",
    "AI đang phân tích cấu trúc Main & Supplementary Content...",
    "Đang rà soát 70+ quy tắc Writing nâng cao...",
    "Kiểm tra các cụm móc xích thực thể (Entities)...",
    "Đang tính toán điểm Semantic SEO tổng thể...",
    "Sắp hoàn tất, đang chuẩn bị báo cáo chi tiết..."
  ];

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('seo_expert_pro_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Lỗi load lịch sử:", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('seo_expert_pro_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    let interval: number;
    if (isLoading) {
      setLoadingStep(0);
      interval = window.setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const extractOutlineFromHTML = (html: string) => {
    if (!html) return "";
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const headings = doc.querySelectorAll('h1, h2, h3, h4');
      
      let outlineText = "";
      headings.forEach((heading) => {
        const level = heading.tagName.toLowerCase();
        const prefix = level === 'h1' ? '# ' : level === 'h2' ? '## ' : level === 'h3' ? '### ' : '#### ';
        outlineText += `${prefix}${heading.textContent?.trim()}\n`;
      });
      
      return outlineText || "Không tìm thấy thẻ tiêu đề (H1-H4) trong nội dung.";
    } catch (e) {
      console.error("Lỗi trích xuất dàn ý:", e);
      return "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInput(prev => {
      const newInput = { ...prev, [name]: value };
      if (name === 'content') {
        const extracted = extractOutlineFromHTML(value);
        if (extracted && extracted !== "Không tìm thấy thẻ tiêu đề (H1-H4) trong nội dung.") {
          newInput.outline = extracted;
        }
      }
      return newInput;
    });
  };

  const runAnalysis = async () => {
    if (!input.mainKeyword) {
      alert("Vui lòng nhập từ khóa chính!");
      return;
    }
    setIsLoading(true);
    setActiveTab(TabType.ANALYSIS);
    try {
      const onPageResults = runHardcodedOnPageChecks(input);
      const aiResults = await analyzeWithAI(input);
      
      const newAnalysis: SEOAnalysis = {
        onPage: onPageResults,
        outline: aiResults.outline || [],
        writing: aiResults.writing || [],
        overallScore: aiResults.overallScore || 0,
        subScores: aiResults.subScores || { onpage: 0, outline: 0, writing: 0 },
        strategicReport: aiResults.strategicReport || { pros: [], cons: [], summary: aiResults.aiFeedback || '' },
        aiFeedback: aiResults.aiFeedback || ''
      };

      setAnalysis(newAnalysis);

      // Save to history
      const historyItem: SEOHistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        input: { ...input },
        analysis: newAnalysis
      };
      setHistory(prev => [historyItem, ...prev].slice(0, 50)); // Keep last 50
      
    } catch (err) {
      console.error(err);
      alert("Đã có lỗi xảy ra trong quá trình phân tích.");
      setActiveTab(TabType.INPUT);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (item: SEOHistoryItem) => {
    setInput(item.input);
    setAnalysis(item.analysis);
    setActiveTab(TabType.ANALYSIS);
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Xóa mục này khỏi lịch sử?")) {
      setHistory(prev => prev.filter(item => item.id !== id));
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981"; // Xanh lục
    if (score >= 50) return "#f59e0b"; // Vàng
    return "#ef4444"; // Đỏ
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-black placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all text-base shadow-sm font-medium";
  const labelClass = "block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide";

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans text-slate-900">
      <header className="bg-indigo-900 text-white py-6 shadow-2xl sticky top-0 z-50">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
              <span className="bg-white text-indigo-900 px-2 py-0.5 rounded shadow-sm">SEO</span>
              EXPERT PRO
            </h1>
            <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 opacity-70">Semantic Audit Engine</p>
          </div>
          <div className="flex bg-indigo-950/40 p-1 rounded-xl backdrop-blur-md gap-1">
            <button 
              onClick={() => setActiveTab(TabType.INPUT)}
              className={`px-4 lg:px-6 py-2 rounded-lg text-xs lg:text-sm font-black transition-all ${activeTab === TabType.INPUT ? 'bg-white text-indigo-900 shadow-lg' : 'text-indigo-100 hover:text-white'}`}
            >
              SOẠN THẢO
            </button>
            <button 
              onClick={() => setActiveTab(TabType.HISTORY)}
              className={`px-4 lg:px-6 py-2 rounded-lg text-xs lg:text-sm font-black transition-all ${activeTab === TabType.HISTORY ? 'bg-white text-indigo-900 shadow-lg' : 'text-indigo-100 hover:text-white'}`}
            >
              LỊCH SỬ
            </button>
            <button 
              onClick={() => setActiveTab(TabType.ANALYSIS)}
              disabled={analysis.onPage.length === 0 && !isLoading}
              className={`px-4 lg:px-6 py-2 rounded-lg text-xs lg:text-sm font-black transition-all ${activeTab === TabType.ANALYSIS ? 'bg-white text-indigo-900 shadow-lg' : 'text-indigo-100 hover:text-white disabled:opacity-30'}`}
            >
              BÁO CÁO
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        {activeTab === TabType.INPUT ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
            <div className="lg:col-span-4 space-y-6">
              <section className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200">
                <h2 className="text-xs font-black text-indigo-600 uppercase mb-4 tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  SEO Onpage
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className={labelClass}>Từ khóa chính *</label>
                    <input type="text" name="mainKeyword" value={input.mainKeyword} onChange={handleInputChange} placeholder="Ví dụ: máy lọc nước ion kiềm" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>URL bài viết</label>
                    <input type="text" name="url" value={input.url} onChange={handleInputChange} placeholder="domain.com/bai-viet" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Tiêu đề (Title)</label>
                    <input type="text" name="title" value={input.title} onChange={handleInputChange} placeholder="Tiêu đề chứa từ khóa..." className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Meta Description</label>
                    <textarea name="metaDescription" rows={3} value={input.metaDescription} onChange={handleInputChange} placeholder="Mô tả tóm tắt..." className={`${inputClass} resize-none`}></textarea>
                  </div>
                </div>
              </section>
              <button onClick={runAnalysis} disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-3xl shadow-2xl shadow-indigo-300/50 transform active:scale-[0.98] transition-all text-lg tracking-tight">
                {isLoading ? 'ĐANG PHÂN TÍCH...' : 'CHẠY KIỂM TRA PRO'}
              </button>
            </div>
            <div className="lg:col-span-8 space-y-6">
              <section className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200">
                <h2 className="text-xs font-black text-indigo-600 uppercase mb-4 tracking-widest flex justify-between items-center">
                  <span>Dàn ý (Phần 2)</span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">Tự động từ HTML</span>
                </h2>
                <textarea name="outline" rows={6} value={input.outline} onChange={handleInputChange} className={`${inputClass} font-mono leading-relaxed bg-slate-50 border-dashed text-sm cursor-not-allowed`} readOnly placeholder="Dàn ý sẽ tự động bóc từ Phần 3..."></textarea>
              </section>
              <section className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200">
                <h2 className="text-xs font-black text-indigo-600 uppercase mb-4 tracking-widest">Nội dung chi tiết (Phần 3 - HTML)</h2>
                <textarea name="content" rows={18} value={input.content} onChange={handleInputChange} placeholder="Dán mã nguồn HTML bài viết vào đây..." className={`${inputClass} leading-relaxed text-sm`}></textarea>
              </section>
            </div>
          </div>
        ) : activeTab === TabType.HISTORY ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Lịch sử kiểm tra</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{history.length} bản ghi đã lưu</p>
            </div>
            
            {history.length === 0 ? (
              <div className="bg-white rounded-[40px] p-20 flex flex-col items-center justify-center text-center shadow-xl border border-slate-200">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa có lịch sử phân tích</h3>
                <p className="text-slate-400 max-w-xs text-sm">Hãy thực hiện kiểm tra đầu tiên để bắt đầu lưu lại các báo cáo SEO của bạn.</p>
                <button 
                  onClick={() => setActiveTab(TabType.INPUT)}
                  className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-full font-black text-sm shadow-lg hover:bg-indigo-700 transition-colors"
                >
                  BẮT ĐẦU NGAY
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => loadFromHistory(item)}
                    className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200 hover:border-indigo-500 hover:shadow-indigo-100 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4">
                      <div className="text-2xl font-black" style={{ color: getScoreColor(item.analysis.overallScore) }}>{item.analysis.overallScore}</div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{new Date(item.timestamp).toLocaleString('vi-VN')}</span>
                        <h4 className="text-lg font-bold text-slate-900 truncate pr-10 mt-1">{item.input.mainKeyword}</h4>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">On: <span className="text-slate-800">{item.analysis.subScores?.onpage}</span></div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Out: <span className="text-slate-800">{item.analysis.subScores?.outline}</span></div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Wri: <span className="text-slate-800">{item.analysis.subScores?.writing}</span></div>
                      </div>
                      <div className="pt-2 flex justify-between items-center">
                        <span className="text-xs font-black text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">Xem báo cáo →</span>
                        <button 
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : isLoading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-10 animate-in fade-in duration-500">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <div className="text-center space-y-5">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Rà soát dữ liệu Semantic</h2>
              <div className="h-2 w-64 bg-slate-200 rounded-full overflow-hidden mx-auto shadow-inner">
                <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}></div>
              </div>
              <p className="text-indigo-600 font-bold text-lg h-8 italic">"{loadingMessages[loadingStep]}"</p>
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
            {/* Header Kết quả (Score & Strategic Summary) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white p-8 md:p-10 rounded-[40px] shadow-2xl shadow-slate-300/50 border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-40"></div>
              
              {/* Vòng tròn điểm số */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center space-y-6 relative z-10 border-b lg:border-b-0 lg:border-r border-slate-100 pb-8 lg:pb-0">
                <div className="relative w-52 h-52">
                  <svg className="w-full h-full transform -rotate-90 overflow-visible">
                    <circle cx="104" cy="104" r="92" stroke="#f1f5f9" strokeWidth="14" fill="transparent" />
                    <circle 
                      cx="104" cy="104" r="92" 
                      stroke={getScoreColor(analysis.overallScore)} 
                      strokeWidth="14" fill="transparent"
                      strokeDasharray={578} 
                      strokeDashoffset={578 - (578 * Math.min(Math.max(analysis.overallScore, 0), 100)) / 100}
                      strokeLinecap="round" 
                      className="transition-all duration-[1500ms] ease-out drop-shadow-[0_0_8px_rgba(0,0,0,0.1)]"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl font-black tracking-tighter text-slate-900 leading-none" style={{ color: getScoreColor(analysis.overallScore) }}>{analysis.overallScore}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">SEO Score</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
                  <div className="text-center">
                    <div className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-tighter">Onpage</div>
                    <div className="font-bold text-slate-800">{analysis.subScores?.onpage ?? 0}</div>
                  </div>
                  <div className="text-center border-x border-slate-100 px-2">
                    <div className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-tighter">Outline</div>
                    <div className="font-bold text-slate-800">{analysis.subScores?.outline ?? 0}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-tighter">Writing</div>
                    <div className="font-bold text-slate-800">{analysis.subScores?.writing ?? 0}</div>
                  </div>
                </div>
              </div>

              {/* Báo cáo chiến lược */}
              <div className="lg:col-span-8 flex flex-col space-y-6 relative z-10">
                <div className="flex items-center gap-3">
                  <span className="px-4 py-1.5 rounded-full bg-indigo-900 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">AI Strategic Feedback</span>
                  <div className="h-[1px] flex-grow bg-slate-100"></div>
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Đánh giá chung</h3>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Từ khóa: {input.mainKeyword}</span>
                      <p className="text-slate-600 text-base leading-relaxed italic border-l-4 border-indigo-500 pl-4 bg-slate-50 py-3 rounded-r-2xl">
                        "{analysis.strategicReport?.summary || analysis.aiFeedback || "Đang tổng hợp nhận xét từ dữ liệu phân tích..."}"
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50/50 p-5 rounded-3xl border border-green-100 shadow-sm transition-transform hover:scale-[1.02]">
                      <h4 className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Ưu điểm nổi bật
                      </h4>
                      <ul className="space-y-2">
                        {analysis.strategicReport?.pros && analysis.strategicReport.pros.length > 0 ? (
                          analysis.strategicReport.pros.map((pro, i) => (
                            <li key={i} className="text-[13px] text-slate-700 font-medium flex gap-2"><span className="text-green-500 font-bold">✓</span> {pro}</li>
                          ))
                        ) : (
                          <li className="text-slate-400 text-xs italic">Chưa ghi nhận ưu điểm vượt trội.</li>
                        )}
                      </ul>
                    </div>
                    <div className="bg-red-50/50 p-5 rounded-3xl border border-red-100 shadow-sm transition-transform hover:scale-[1.02]">
                      <h4 className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Điểm cần cải thiện
                      </h4>
                      <ul className="space-y-2">
                        {analysis.strategicReport?.cons && analysis.strategicReport.cons.length > 0 ? (
                          analysis.strategicReport.cons.map((con, i) => (
                            <li key={i} className="text-[13px] text-slate-700 font-medium flex gap-2"><span className="text-red-500 font-bold">⚠</span> {con}</li>
                          ))
                        ) : (
                          <li className="text-slate-400 text-xs italic">Nội dung đã tối ưu rất tốt.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <ChecklistSection title="1. Kiểm tra Onpage" checks={analysis.onPage} />
              <ChecklistSection title="2. Tối ưu Dàn Ý" checks={analysis.outline} />
              <ChecklistSection title="3. Tối ưu Viết Bài" checks={analysis.writing} />
            </div>

            <div className="flex flex-col items-center py-10">
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveTab(TabType.INPUT)}
                  className="group flex items-center gap-3 px-10 py-4 bg-white hover:bg-indigo-600 border-2 border-slate-200 hover:border-indigo-600 rounded-full text-sm font-black text-slate-700 hover:text-white transition-all shadow-xl hover:shadow-indigo-200"
                >
                  <span>CHỈNH SỬA LẠI</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
                <button 
                  onClick={() => setActiveTab(TabType.HISTORY)}
                  className="px-10 py-4 bg-indigo-900 text-white rounded-full text-sm font-black shadow-xl hover:bg-black transition-all"
                >
                  XEM LỊCH SỬ
                </button>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-6 italic">SEO EXPERT PRO • SEMANTIC AUDIT SYSTEM</p>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-100 py-10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2025 SEO EXPERT PRO ENGINE v2.0</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
