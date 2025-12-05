import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Save, Lock, AlertCircle, LogOut } from 'lucide-react';
import { ReadingMaterial, ValueChainStep } from '../types';
import { VALUE_CHAIN_CONTEXT } from '../constants';
import { saveMaterial, deleteMaterial } from '../services/firebaseService';

// --- Login Modal ---
interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) { setPassword(''); setError(''); }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
          <Lock size={20}/> 관리자 로그인
        </h3>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => { setPassword(e.target.value); setError(''); }} 
          onKeyDown={(e) => e.key === 'Enter' && onLogin(password)} 
          placeholder="비밀번호 (1234)" 
          className="w-full border p-3 rounded-lg mb-2 outline-none focus:ring-2 focus:ring-blue-500 transition" 
          autoFocus 
        />
        {error && <p className="text-red-500 text-sm mb-3 flex items-center gap-1"><AlertCircle size={14}/> {error}</p>}
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition font-medium">취소</button>
          <button onClick={() => onLogin(password)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition">확인</button>
        </div>
      </div>
    </div>
  );
};

// --- Dashboard ---
interface AdminDashboardProps {
  materials: ReadingMaterial[];
  onClose: () => void;
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ materials, onClose, onRefresh }) => {
  const [view, setView] = useState<'list' | 'edit' | 'add'>('list');
  const [filterStep, setFilterStep] = useState('all');
  const [editingItem, setEditingItem] = useState<ReadingMaterial | null>(null);

  const handleDelete = async (id: string) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      await deleteMaterial(id);
      onRefresh();
    }
  };

  const handleSave = async (item: ReadingMaterial) => {
    await saveMaterial(item);
    onRefresh();
    setView('list');
  };

  const filteredMaterials = filterStep === 'all' 
    ? materials 
    : materials.filter(m => m.valueChain === filterStep);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-slate-800 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <div className="font-bold text-lg flex items-center gap-2">
          <Lock size={20} className="text-blue-400"/> 관리자 대시보드
        </div>
        <button onClick={onClose} className="flex items-center gap-1 text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition">
          <LogOut size={16}/> 나가기
        </button>
      </div>

      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {view === 'list' && (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-slate-800">자료 관리 ({filteredMaterials.length}건)</h2>
              <div className="flex gap-2 w-full md:w-auto">
                <select 
                  value={filterStep} 
                  onChange={(e) => setFilterStep(e.target.value)} 
                  className="bg-white border border-slate-300 text-slate-700 py-2 px-3 rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체 단계 보기</option>
                  {VALUE_CHAIN_CONTEXT.map(step => (
                    <option key={step.id} value={step.id}>{step.label.split(' (')[0]}</option>
                  ))}
                </select>
                <button 
                  onClick={() => { setEditingItem(null); setView('add'); }} 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow transition whitespace-nowrap"
                >
                  <Plus size={20}/> 자료 추가
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              {filteredMaterials.map(m => (
                <div key={m.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition flex flex-col md:flex-row gap-4 justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {VALUE_CHAIN_CONTEXT.find(s => s.id === m.valueChain)?.label.split(' (')[0] || m.valueChain}
                      </span>
                      <h4 className="font-bold text-lg text-slate-800">{m.title}</h4>
                    </div>
                    <p className="text-slate-500 text-sm line-clamp-2 mb-3">{m.content.replace(/[#*]/g, '').slice(0, 150)}...</p>
                    <div className="flex flex-wrap gap-1">
                      {m.majors.map(major => <span key={major} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100">{major}</span>)}
                    </div>
                  </div>
                  <div className="flex md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-3">
                    <button 
                      onClick={() => { setEditingItem(m); setView('edit'); }} 
                      className="flex-1 md:flex-none p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition flex items-center justify-center gap-1"
                      title="수정"
                    >
                      <Edit2 size={18}/> <span className="md:hidden text-sm">수정</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(m.id)} 
                      className="flex-1 md:flex-none p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition flex items-center justify-center gap-1"
                      title="삭제"
                    >
                      <Trash2 size={18}/> <span className="md:hidden text-sm">삭제</span>
                    </button>
                  </div>
                </div>
              ))}
              {filteredMaterials.length === 0 && (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  자료가 없습니다.
                </div>
              )}
            </div>
          </div>
        )}

        {(view === 'add' || view === 'edit') && (
          <Editor 
            initialData={view === 'edit' ? editingItem : undefined} 
            onSave={handleSave} 
            onCancel={() => setView('list')} 
          />
        )}
      </div>
    </div>
  );
};

// --- Editor Component ---
const Editor: React.FC<{ 
  initialData?: ReadingMaterial | null, 
  onSave: (data: ReadingMaterial) => void, 
  onCancel: () => void 
}> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<ReadingMaterial>(initialData || {
    id: Date.now().toString(),
    title: '',
    valueChain: 'step1',
    majors: [],
    keywords: [],
    content: ''
  });

  const handleChange = (field: keyof ReadingMaterial, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: 'majors' | 'keywords', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value.split(',').map(s => s.trim()) }));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
        <h3 className="text-xl font-bold text-slate-800">{initialData ? '자료 수정' : '새 자료 추가'}</h3>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24}/></button>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">제목</label>
            <input 
              value={formData.title} 
              onChange={e => handleChange('title', e.target.value)} 
              className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="제목 입력"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">가치사슬 단계</label>
            <select 
              value={formData.valueChain} 
              onChange={e => handleChange('valueChain', e.target.value)} 
              className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              {VALUE_CHAIN_CONTEXT.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div>
           <label className="block text-sm font-bold text-slate-700 mb-1">관련 전공 (쉼표 , 로 구분)</label>
           <input 
              value={formData.majors.join(', ')} 
              onChange={e => handleArrayChange('majors', e.target.value)} 
              className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="예: 컴퓨터공학, 경영학"
            />
        </div>

        <div>
           <label className="block text-sm font-bold text-slate-700 mb-1">키워드 (쉼표 , 로 구분)</label>
           <input 
              value={formData.keywords.join(', ')} 
              onChange={e => handleArrayChange('keywords', e.target.value)} 
              className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="예: AI, 윤리, 환경"
            />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">본문 (Markdown)</label>
          <textarea 
            value={formData.content} 
            onChange={e => handleChange('content', e.target.value)} 
            className="w-full h-64 border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm leading-relaxed resize-y" 
            placeholder="# 제목\n\n내용을 작성하세요..." 
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button onClick={onCancel} className="px-5 py-2.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-bold transition">취소</button>
          <button 
            onClick={() => {
              if(!formData.title || !formData.content) return alert('제목과 본문을 입력해주세요.');
              onSave(formData);
            }} 
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2 transition"
          >
            <Save size={18}/> 저장
          </button>
        </div>
      </div>
    </div>
  );
};