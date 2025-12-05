import React, { useState, useEffect, useRef } from 'react';
import { BrainCircuit, Leaf, Cpu, Lock, GraduationCap, ArrowRight, Briefcase, Search, Sparkles, MessageCircle, Send, Loader2, Info, Download, CheckCircle, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Layout } from './components/Layout';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { ValueChainRenderer } from './components/ValueChainRenderer';
import { AdminLoginModal, AdminDashboard } from './components/Admin';
import { UNIVERSITY_SUBJECTS } from './constants';
import { fetchMaterials } from './services/firebaseService';
import { getCareerRecommendations, recommendAndGenerateMaterials, chatWithMentor, generateEsgFeedback } from './services/geminiService';
import { ReadingMaterial, ChatMessage, EsgThoughts, AppView } from './types';

function App() {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [loading, setLoading] = useState(false);
  
  // Admin State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  // Data State
  const [allMaterials, setAllMaterials] = useState<ReadingMaterial[]>([]);
  
  // Period 1 State (Career)
  const [p1Step, setP1Step] = useState(0);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<string>('');
  const [myJob, setMyJob] = useState('');
  const [myConnectionThought, setMyConnectionThought] = useState('');
  const [matchedMaterials, setMatchedMaterials] = useState<ReadingMaterial[]>([]);
  const [generatedMaterial, setGeneratedMaterial] = useState<ReadingMaterial | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<ReadingMaterial | null>(null);
  const [p1ChatHistory, setP1ChatHistory] = useState<ChatMessage[]>([]);
  const [p1Input, setP1Input] = useState('');

  // Period 2 State (ESG)
  const [p2Step, setP2Step] = useState(0);
  const [esgThoughts, setEsgThoughts] = useState<EsgThoughts>({ env: '', soc: '', eco: '' });
  const [p2ChatHistory, setP2ChatHistory] = useState<ChatMessage[]>([]);
  const [p2Input, setP2Input] = useState('');
  
  // Scroll refs
  const p1ChatEndRef = useRef<HTMLDivElement>(null);
  const p2ChatEndRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    refreshMaterials();
  }, []);

  const refreshMaterials = async () => {
    const data = await fetchMaterials();
    setAllMaterials(data);
  };

  // Auto-scroll chat
  useEffect(() => { p1ChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [p1ChatHistory]);
  useEffect(() => { p2ChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [p2ChatHistory]);

  // --- Handlers ---

  const handleAdminAccess = () => {
    setIsLoginModalOpen(true);
  };

  const handleAdminLogin = (password: string) => {
    if (password === '1234') {
      setIsLoginModalOpen(false);
      setView(AppView.ADMIN);
    } else {
      alert("비밀번호가 올바르지 않습니다.");
    }
  };

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const handleGetRecommendations = async () => {
    if (selectedSubjects.length === 0) return alert("수업을 최소 하나 이상 선택해주세요.");
    setLoading(true);
    const result = await getCareerRecommendations(selectedSubjects);
    setRecommendedJobs(result);
    setLoading(false);
    setP1Step(2);
  };

  const handleFindMaterials = async () => {
    if (!myJob.trim()) return alert("직업을 입력해주세요.");
    setLoading(true);
    setP1Step(4); // Move to loading screen / results
    
    // Call Gemini to match and generate
    const { recommended, generated } = await recommendAndGenerateMaterials(myJob, myConnectionThought, allMaterials);
    
    setMatchedMaterials(recommended);
    setGeneratedMaterial(generated);
    setLoading(false);
  };

  const startP1Chat = (material: ReadingMaterial) => {
    setSelectedMaterial(material);
    setP1ChatHistory([
      { 
        role: 'model', 
        text: `안녕하세요! **${myJob}** 진로에 관심이 있으시군요. \n\n우리가 함께 읽고 있는 자료는 **"${material.title}"**입니다. \n\n**${myJob}**의 관점에서 볼 때, 이 문제가 여러분의 분야에 어떤 영향을 미칠 것 같나요?`,
        type: 'value_chain_intro',
        valueChain: material.valueChain
      }
    ]);
    setP1Step(5);
  };

  const sendP1Message = async () => {
    const text = p1Input.trim();
    if (!text || !selectedMaterial) return;
    
    setP1Input(''); // Clear input
    const newHistory: ChatMessage[] = [...p1ChatHistory, { role: 'user', text }];
    setP1ChatHistory(newHistory);
    setLoading(true);

    const response = await chatWithMentor(newHistory, myJob, selectedMaterial);
    
    setP1ChatHistory(prev => [...prev, { role: 'model', text: response }]);
    setLoading(false);
  };

  const startP2Chat = async () => {
    if (!esgThoughts.env || !esgThoughts.soc || !esgThoughts.eco) {
      return alert("ESG 3가지 영역을 모두 작성해주세요.");
    }
    
    const materialTitle = selectedMaterial?.title || "일반적인 AI/반도체 상황";
    const initialHistory: ChatMessage[] = [{
      role: 'user',
      text: `저의 희망 직업(${myJob})에 대한 ESG 아이디어입니다:\n환경: ${esgThoughts.env}\n사회: ${esgThoughts.soc}\n경제/제도: ${esgThoughts.eco}`
    }];
    
    setP2ChatHistory(initialHistory);
    setP2Step(2);
    setLoading(true);

    const response = await generateEsgFeedback(myJob, materialTitle, esgThoughts, initialHistory);
    
    setP2ChatHistory(prev => [...prev, { role: 'model', text: response }]);
    setLoading(false);
  };

  const sendP2Message = async () => {
    const text = p2Input.trim();
    if (!text) return;

    setP2Input(''); // Clear input
    const newHistory: ChatMessage[] = [...p2ChatHistory, { role: 'user', text }];
    setP2ChatHistory(newHistory);
    setLoading(true);
    
    const materialTitle = selectedMaterial?.title || "Context";
    const response = await generateEsgFeedback(myJob, materialTitle, esgThoughts, newHistory);
    
    setP2ChatHistory(prev => [...prev, { role: 'model', text: response }]);
    setLoading(false);
  };

  const handleDownloadImage = async () => {
    const element = document.getElementById('final-report-card');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        backgroundColor: '#ffffff',
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `FutureCareerAI_Report_${myJob}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Image download failed:", err);
      alert("이미지 다운로드에 실패했습니다.");
    }
  };

  // --- Navigation Handlers ---

  const handleP1Back = () => {
    if (p1Step === 0) setView(AppView.LANDING);
    else if (p1Step === 1) setP1Step(0);
    else if (p1Step === 2) setP1Step(1);
    else if (p1Step === 3) recommendedJobs ? setP1Step(2) : setP1Step(0);
    else if (p1Step === 4) setP1Step(3);
    else if (p1Step === 5) setP1Step(4);
  };

  const handleP2Back = () => {
    if (p2Step === 1) {
      if (selectedMaterial && p1ChatHistory.length > 0) {
        setView(AppView.PERIOD1);
        setP1Step(5);
      } else {
        setView(AppView.LANDING);
      }
    } else if (p2Step === 2) {
      setP2Step(1);
    } else if (p2Step === 3) {
      setP2Step(2);
    }
  };

  // --- Render Views ---

  if (view === AppView.ADMIN) {
    return (
      <AdminDashboard 
        materials={allMaterials} 
        onClose={() => setView(AppView.LANDING)}
        onRefresh={refreshMaterials}
      />
    );
  }

  return (
    <>
      <AdminLoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLogin={handleAdminLogin} 
      />

      {view === AppView.LANDING && (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 relative p-6">
          <header className="absolute top-0 w-full p-6 flex justify-between items-center text-slate-700">
            <div className="flex items-center gap-2 font-bold text-xl">
              <Cpu className="text-blue-600" /> Future Career AI
            </div>
            <button 
              onClick={handleAdminAccess}
              className="p-2 hover:bg-slate-200 rounded-full transition text-slate-400"
            >
              <Lock size={20} />
            </button>
          </header>

          <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4 text-center tracking-tight break-keep">
            복잡성 시대의 진로와 <br/>
            <span className="text-blue-600 bg-blue-50 px-2 rounded-lg inline-block mt-2">AI-반도체</span>
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mt-12">
            <button 
              onClick={() => setView(AppView.PERIOD1)} 
              className="group bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col items-center"
            >
              <div className="bg-blue-100 p-4 rounded-full mb-4 group-hover:bg-blue-600 transition-colors duration-300">
                <BrainCircuit size={48} className="text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">1교시: 진로와 AI 연결</h2>
              <p className="text-slate-500 mt-2">나의 꿈과 첨단 기술 연결하기</p>
            </button>

            <button 
              onClick={() => { setView(AppView.PERIOD2); setP2Step(1); }} 
              className="group bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col items-center"
            >
              <div className="bg-green-100 p-4 rounded-full mb-4 group-hover:bg-green-600 transition-colors duration-300">
                <Leaf size={48} className="text-green-600 group-hover:text-white transition-colors" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">2교시: 지속가능발전(ESG)</h2>
              <p className="text-slate-500 mt-2">윤리적 문제와 환경 이슈 해결하기</p>
            </button>
          </div>
        </div>
      )}

      {/* --- PERIOD 1: CAREER --- */}
      {view === AppView.PERIOD1 && (
        <Layout 
          title="1교시: AI-반도체와 나의 진로" 
          color="blue" 
          job={myJob} 
          onHome={() => setView(AppView.LANDING)}
          onBack={handleP1Back}
          onAdmin={handleAdminAccess}
        >
          {p1Step === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <h3 className="text-3xl font-bold mb-8 text-slate-800 break-keep">현재 희망하는 진로(학과 또는 직업)가 있나요?</h3>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <button onClick={() => { setP1Step(3); }} className="px-10 py-5 bg-blue-600 text-white text-xl font-bold rounded-2xl shadow hover:bg-blue-700 transition">네, 있어요</button>
                <button onClick={() => { setP1Step(1); }} className="px-10 py-5 bg-white border-2 border-slate-200 text-slate-600 text-xl font-bold rounded-2xl shadow hover:bg-slate-50 transition">아니요, 아직 없어요</button>
              </div>
            </div>
          )}

          {p1Step === 1 && (
            <div className="animate-fade-in">
              <h3 className="text-2xl font-bold mb-4 text-slate-800 flex items-center gap-2 break-keep">
                <GraduationCap className="text-blue-600" /> 대학에서 들어보고 싶은 전공 수업을 골라보세요.
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {UNIVERSITY_SUBJECTS.map((item, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleSubjectToggle(item.subject)}
                    className={`p-4 rounded-xl text-left transition-all border ${selectedSubjects.includes(item.subject) ? 'bg-blue-600 text-white ring-2 ring-blue-300 border-transparent shadow-lg transform scale-105' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'}`}
                  >
                    <div className="font-bold text-lg mb-1">{item.subject}</div>
                    <div className={`text-xs ${selectedSubjects.includes(item.subject) ? 'text-blue-100' : 'text-slate-400'}`}>{item.major}</div>
                  </button>
                ))}
              </div>
              <div className="flex justify-center">
                <button 
                  onClick={handleGetRecommendations} 
                  disabled={loading}
                  className="bg-slate-800 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-slate-900 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : '나에게 맞는 진로 추천받기'} <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}

          {p1Step === 2 && (
            <div className="animate-fade-in max-w-3xl mx-auto">
               <h3 className="text-2xl font-bold mb-4 text-slate-800">AI 진로 추천 결과</h3>
               <div className="bg-white p-8 rounded-2xl shadow-lg border border-blue-100">
                 <MarkdownRenderer content={recommendedJobs} />
               </div>
               <div className="mt-6 flex justify-center">
                 <button onClick={() => setP1Step(3)} className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold">3단계(직업 설정)로 이동</button>
               </div>
            </div>
          )}

          {p1Step === 3 && (
            <div className="animate-fade-in max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-6 text-slate-800">희망하는 진로(직업)는 무엇인가요?</h3>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
                <label className="block text-sm font-bold text-slate-500 mb-2">나의 희망 직업</label>
                <input 
                  type="text" 
                  value={myJob} 
                  onChange={(e) => setMyJob(e.target.value)} 
                  className="w-full text-xl p-3 border-b-2 border-slate-200 focus:border-blue-500 outline-none transition" 
                  placeholder="예: 건축가, 의사, 패션 디자이너" 
                />
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
                <label className="block text-sm font-bold text-slate-500 mb-2">AI 또는 반도체와 어떤 관련이 있을까요? (선택사항)</label>
                <textarea 
                  value={myConnectionThought} 
                  onChange={(e) => setMyConnectionThought(e.target.value)} 
                  className="w-full h-32 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                  placeholder="예: 건축가는 AI를 활용해 설계를 생성하거나 최적화합니다..."
                />
              </div>
              <button 
                onClick={handleFindMaterials} 
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-xl hover:bg-blue-700 transition flex justify-center items-center gap-2"
              >
                관련 자료 찾기 및 생성 <Search size={20} />
              </button>
            </div>
          )}

          {p1Step === 4 && (
            <div className="animate-fade-in">
              <h3 className="text-2xl font-bold mb-6 text-slate-800">나를 위한 맞춤형 읽기 자료</h3>
              
              {loading ? (
                 <div className="text-center py-20 bg-white rounded-xl border border-blue-100 shadow-sm flex flex-col items-center justify-center animate-pulse">
                    <div className="bg-blue-100 p-4 rounded-full mb-4 text-blue-600"><Sparkles size={48} className="animate-spin" /></div>
                    <h4 className="text-xl font-bold text-slate-800 mb-2">{myJob}을(를) 위한 맞춤 기사를 생성하고 있습니다...</h4>
                    <p className="text-slate-500">여러분의 진로와 반도체 가치사슬을 연결하는 중입니다.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {generatedMaterial && (
                     <button onClick={() => startP1Chat(generatedMaterial)} className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl shadow-md border border-blue-200 text-left transition-all hover:scale-[1.01] hover:shadow-xl group">
                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10 flex items-center gap-1"><Sparkles size={10} /> AI 생성 자료</div>
                        <h4 className="text-xl font-bold text-blue-900 mb-3 group-hover:underline decoration-2 underline-offset-2">{generatedMaterial.title}</h4>
                        <div className="text-xs font-bold text-blue-500 mb-2 uppercase tracking-wide">단계: {generatedMaterial.valueChain}</div>
                        <p className="text-slate-600 text-sm line-clamp-3 mb-4 opacity-90">{generatedMaterial.content.replace(/[#*]/g, '').slice(0, 150)}...</p>
                        <div className="flex gap-2 flex-wrap">
                          {generatedMaterial.keywords.slice(0, 3).map(k => <span key={k} className="text-[10px] bg-white text-blue-600 px-2 py-1 rounded-full border border-blue-100 font-bold">#{k}</span>)}
                        </div>
                     </button>
                  )}

                  {matchedMaterials.map(item => (
                     <button key={item.id} onClick={() => startP1Chat(item)} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-left transition-all hover:border-blue-400 hover:shadow-md group">
                        <h4 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-700">{item.title}</h4>
                        <p className="text-slate-500 text-sm line-clamp-2 mb-4">{item.content.replace(/[#*]/g, '').slice(0, 100)}...</p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{item.valueChain}</span>
                          {item.majors.slice(0, 2).map(m => <span key={m} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{m}</span>)}
                        </div>
                     </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {p1Step === 5 && selectedMaterial && (
            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] animate-fade-in">
               <div className="lg:w-3/5 flex flex-col bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
                    <span className="text-xs font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full uppercase">{selectedMaterial.valueChain}</span>
                    {selectedMaterial.isGenerated && <span className="text-xs font-bold text-indigo-600 flex items-center gap-1"><Sparkles size={12}/> AI Content</span>}
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-hide">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-6">{selectedMaterial.title}</h1>
                    <MarkdownRenderer content={selectedMaterial.content} />
                  </div>
               </div>

               <div className="lg:w-2/5 flex flex-col bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden relative">
                  <div className="bg-blue-600 p-4 text-white font-bold flex items-center gap-2 shadow-md">
                     <MessageCircle size={20}/> AI 진로 멘토
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                    {p1ChatHistory.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border text-slate-800 rounded-bl-none shadow-sm'}`}>
                            {msg.type === 'value_chain_intro' && msg.valueChain && (
                              <ValueChainRenderer activeStepId={msg.valueChain} />
                            )}
                            <MarkdownRenderer content={msg.text} />
                         </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-200 flex items-center gap-2">
                          <Loader2 size={16} className="animate-spin text-blue-500" />
                          <span className="text-xs text-slate-500">멘토가 생각 중입니다...</span>
                        </div>
                      </div>
                    )}
                    <div ref={p1ChatEndRef} />
                  </div>

                  <div className="p-4 bg-white border-t border-slate-100">
                    <div className="flex gap-2">
                      <textarea 
                        value={p1Input}
                        onChange={(e) => setP1Input(e.target.value)}
                        placeholder="답변을 입력하세요... (Shift+Enter로 줄바꿈)" 
                        className="flex-1 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none h-14"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                            e.preventDefault();
                            sendP1Message();
                          }
                        }}
                      />
                      <button 
                        onClick={() => sendP1Message()}
                        className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition h-14 w-14 flex items-center justify-center"
                      >
                         <Send size={20} />
                      </button>
                    </div>
                    <button 
                      onClick={() => { setView(AppView.PERIOD2); setP2Step(1); }} 
                      className="w-full mt-3 py-2 text-xs font-bold text-slate-400 hover:text-green-600 transition flex items-center justify-center gap-1"
                    >
                      2교시(ESG)로 이동 <ArrowRight size={12}/>
                    </button>
                  </div>
               </div>
            </div>
          )}
        </Layout>
      )}

      {/* --- PERIOD 2: ESG --- */}
      {view === AppView.PERIOD2 && (
        <Layout 
          title="2교시: 지속가능발전(ESG)" 
          color="green" 
          job={myJob} 
          onHome={() => setView(AppView.LANDING)}
          onBack={handleP2Back}
          onAdmin={handleAdminAccess}
        >
          {p2Step === 1 && (
            <div className="animate-fade-in max-w-4xl mx-auto">
               <div className="bg-white p-6 rounded-xl mb-6 shadow-sm border border-slate-200">
                  <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2">
                    <Info size={20} className="text-green-600"/> ESG란 무엇인가요?
                  </h3>
                  <p className="text-slate-600 text-sm break-keep">
                    기업의 비재무적 요소인 <strong>환경(Environmental)</strong>, <strong>사회(Social)</strong>, <strong>지배구조(Governance)</strong>를 의미합니다. 
                    여러분의 직업(<strong>{myJob || '나의 진로'}</strong>)으로서 이 분야의 문제를 어떻게 해결할 수 있을까요?
                  </p>
               </div>

               <div className="bg-blue-50 p-6 rounded-xl mb-8 border border-blue-100 shadow-sm">
                  <h3 className="font-bold text-lg text-slate-800 mb-3 flex items-center gap-2">
                     <BrainCircuit size={20} className="text-blue-600" /> 1교시 활동 연결하기
                  </h3>
                  {selectedMaterial ? (
                     <div className="space-y-3">
                        <p className="text-slate-700">
                           1교시에서 <strong>"{selectedMaterial.title}"</strong> 기사를 읽으며 <span className="text-blue-600 font-bold">{selectedMaterial.valueChain}</span> 단계의 이슈를 확인했죠?
                        </p>
                        <div className="bg-white p-4 rounded-lg border border-blue-100 text-sm text-slate-600 leading-relaxed">
                           <p className="mb-2"><strong>{myJob}</strong>의 입장에서 이 기술적 이슈를 다시 바라봅시다.</p>
                           <ul className="list-disc list-inside space-y-1">
                              <li>이 기술을 사용할 때 <strong>에너지</strong>가 너무 많이 들지는 않나요? (E)</li>
                              <li>이 기술로 인해 <strong>소외되는 사람들</strong>은 없을까요? (S)</li>
                              <li>이 기술이 <strong>투명하고 공정하게</strong> 운영되려면 어떤 규칙이 필요할까요? (G)</li>
                           </ul>
                           <p className="mt-2 text-slate-500 font-medium">위 질문들에 대한 나만의 해결책을 아래 칸에 적어보세요.</p>
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-3">
                         <p className="text-slate-700">
                           <strong>{myJob || '희망 직업'}</strong> 분야에서 AI나 반도체 기술이 사용되는 모습을 상상해보세요.
                         </p>
                         <div className="bg-white p-4 rounded-lg border border-blue-100 text-sm text-slate-600 leading-relaxed">
                           <p className="mb-1 font-bold text-slate-700">다음과 같은 질문을 던져보세요:</p>
                           <ul className="list-disc list-inside space-y-1">
                              <li>내 직업 활동이 지구 환경을 아프게 하지는 않을까? (환경)</li>
                              <li>기술 발전의 혜택을 받지 못하는 사람들은 없을까? (사회)</li>
                              <li>올바른 기술 사용을 위해 어떤 법이나 약속이 필요할까? (경제/제도)</li>
                           </ul>
                        </div>
                     </div>
                  )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-green-500 hover:-translate-y-1 transition">
                     <div className="font-bold text-green-700 mb-2 flex items-center gap-2"><Leaf size={18}/> 환경 (Environment)</div>
                     <p className="text-xs text-slate-500 mb-4 h-8 break-keep">에너지나 쓰레기를 줄이는 방법은?</p>
                     <textarea 
                       className="w-full h-32 p-3 bg-green-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-300 resize-none"
                       placeholder="예: 재활용 소재 사용, 에너지 절약..."
                       value={esgThoughts.env}
                       onChange={e => setEsgThoughts({...esgThoughts, env: e.target.value})}
                     />
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-indigo-500 hover:-translate-y-1 transition">
                     <div className="font-bold text-indigo-700 mb-2 flex items-center gap-2"><Briefcase size={18}/> 사회 (Social)</div>
                     <p className="text-xs text-slate-500 mb-4 h-8 break-keep">사람들을 돕거나 안전을 지키는 방법은?</p>
                     <textarea 
                       className="w-full h-32 p-3 bg-indigo-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                       placeholder="예: 사용자 안전 교육, 인권 보호..."
                       value={esgThoughts.soc}
                       onChange={e => setEsgThoughts({...esgThoughts, soc: e.target.value})}
                     />
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-amber-500 hover:-translate-y-1 transition">
                     <div className="font-bold text-amber-700 mb-2 flex items-center gap-2"><Lock size={18}/> 경제/제도 (Economy)</div>
                     <p className="text-xs text-slate-500 mb-4 h-8 break-keep">공정성이나 투명성을 높이는 방법은?</p>
                     <textarea 
                       className="w-full h-32 p-3 bg-amber-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                       placeholder="예: 투명한 보고서 작성, 공정 무역..."
                       value={esgThoughts.eco}
                       onChange={e => setEsgThoughts({...esgThoughts, eco: e.target.value})}
                     />
                  </div>
               </div>
               
               <button 
                 onClick={startP2Chat} 
                 className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition shadow-lg flex justify-center items-center gap-2"
               >
                 ESG 컨설턴트 피드백 받기 <MessageCircle size={20} />
               </button>
            </div>
          )}

          {p2Step === 2 && (
            <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden animate-fade-in">
               <div className="bg-green-600 p-4 text-white font-bold flex justify-between items-center">
                  <div className="flex items-center gap-2"><Leaf size={20}/> ESG 컨설턴트</div>
                  <div className="flex gap-2">
                     <button onClick={() => setP2Step(3)} className="text-xs bg-white text-green-700 px-3 py-1.5 rounded font-bold hover:bg-slate-100 transition flex items-center gap-1">
                        <CheckCircle size={12}/> 활동 완료하기
                     </button>
                     <button onClick={() => setP2Step(1)} className="text-xs bg-green-700 px-3 py-1.5 rounded hover:bg-green-800 transition">수정</button>
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
                  {p2ChatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-5 rounded-2xl leading-relaxed whitespace-pre-wrap shadow-sm ${msg.role === 'user' ? 'bg-green-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'}`}>
                          <MarkdownRenderer content={msg.text} />
                        </div>
                    </div>
                  ))}
                  {loading && (
                     <div className="flex justify-start">
                       <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm border border-slate-200 flex items-center gap-2">
                         <Loader2 size={16} className="animate-spin text-green-600" />
                         <span className="text-sm text-slate-500">컨설턴트가 분석 중입니다...</span>
                       </div>
                     </div>
                  )}
                  <div ref={p2ChatEndRef} />
               </div>
               
               <div className="p-4 bg-white border-t border-slate-100">
                  <div className="flex gap-2">
                    <textarea 
                      value={p2Input}
                      onChange={(e) => setP2Input(e.target.value)}
                      placeholder="더 깊이 논의하기... (Shift+Enter로 줄바꿈)" 
                      className="flex-1 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none h-14"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                          e.preventDefault();
                          sendP2Message();
                        }
                      }}
                    />
                    <button 
                      onClick={() => sendP2Message()}
                      className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition h-14 w-14 flex items-center justify-center"
                    >
                       <Send size={20} />
                    </button>
                  </div>
               </div>
            </div>
          )}

          {p2Step === 3 && (
            <div className="animate-fade-in flex flex-col items-center">
              <h3 className="text-2xl font-bold mb-6 text-slate-800">🎉 활동이 완료되었습니다!</h3>
              
              {/* Report Card to Download */}
              <div id="final-report-card" className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 w-full max-w-2xl mb-8 print-area">
                 <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div className="flex items-center gap-2 text-xl font-black text-slate-800">
                      <Cpu className="text-blue-600" /> Future Career AI 리포트
                    </div>
                    <div className="text-sm text-slate-400 font-bold">{new Date().toLocaleDateString()}</div>
                 </div>

                 <div className="space-y-6">
                    <div>
                       <h4 className="text-sm font-bold text-slate-500 mb-1 uppercase tracking-wide">나의 진로</h4>
                       <div className="text-2xl font-bold text-blue-800">{myJob}</div>
                       <p className="text-slate-600 mt-1 text-sm bg-slate-50 p-2 rounded">{myConnectionThought || "입력된 내용 없음"}</p>
                    </div>

                    {selectedMaterial && (
                       <div>
                          <h4 className="text-sm font-bold text-slate-500 mb-1 uppercase tracking-wide">탐구한 자료</h4>
                          <div className="font-bold text-slate-800">{selectedMaterial.title}</div>
                          <div className="text-xs text-slate-500 mt-1">{selectedMaterial.valueChain} 단계 이슈</div>
                       </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 bg-green-50 p-4 rounded-xl border border-green-100">
                       <div>
                          <div className="font-bold text-green-700 text-xs mb-1">환경(E) 아이디어</div>
                          <p className="text-xs text-slate-700">{esgThoughts.env}</p>
                       </div>
                       <div>
                          <div className="font-bold text-indigo-700 text-xs mb-1">사회(S) 아이디어</div>
                          <p className="text-xs text-slate-700">{esgThoughts.soc}</p>
                       </div>
                       <div>
                          <div className="font-bold text-amber-700 text-xs mb-1">경제(G) 아이디어</div>
                          <p className="text-xs text-slate-700">{esgThoughts.eco}</p>
                       </div>
                    </div>

                    <div>
                       <h4 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">AI 멘토링 요약</h4>
                       <div className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded leading-relaxed whitespace-pre-wrap">
                          {p2ChatHistory.length > 0 ? 
                             p2ChatHistory[p2ChatHistory.length - 1].text : 
                             "진행된 대화가 없습니다."}
                       </div>
                    </div>
                 </div>

                 <div className="mt-8 pt-4 border-t text-center text-xs text-slate-400">
                    Generated by Future Career AI
                 </div>
              </div>

              <div className="flex gap-4">
                 <button 
                   onClick={handleDownloadImage}
                   className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:bg-blue-700 transition flex items-center gap-2"
                 >
                   <Download size={20}/> 이미지로 저장하기
                 </button>
                 <button 
                   onClick={() => setView(AppView.LANDING)}
                   className="bg-white text-slate-700 border border-slate-300 px-8 py-4 rounded-full font-bold shadow-sm hover:bg-slate-50 transition"
                 >
                   처음으로
                 </button>
              </div>
            </div>
          )}
        </Layout>
      )}
    </>
  );
}

export default App;