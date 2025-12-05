import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { VALUE_CHAIN_CONTEXT } from '../constants';

interface Props {
  activeStepId: string;
}

export const ValueChainRenderer: React.FC<Props> = ({ activeStepId }) => {
  const [viewingStep, setViewingStep] = useState(activeStepId);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 my-3 font-sans shadow-sm w-full">
      <div className="flex flex-col mb-3 gap-1">
        <div className="font-bold text-slate-700 text-sm flex items-center gap-1">
          <Layers size={16} className="text-blue-600" /> 
          AI-반도체 가치사슬 (Value Chain)
        </div>
        <div className="text-xs text-slate-400 font-normal">
          번호를 클릭하여 다른 단계를 확인해보세요.
        </div>
      </div>

      <div className="flex w-full h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 mb-3">
        {VALUE_CHAIN_CONTEXT.map((step, index) => {
          const isActive = step.id === activeStepId;
          const isViewing = step.id === viewingStep;
          
          let bgClass = 'bg-slate-100 hover:bg-slate-200 text-slate-400';
          if (isActive) bgClass = 'bg-blue-600 text-white';
          if (isViewing && !isActive) bgClass = 'bg-blue-100 text-blue-600 ring-2 ring-inset ring-blue-300';

          return (
            <button 
              key={step.id} 
              onClick={() => setViewingStep(step.id)}
              className={`flex-1 flex flex-col items-center justify-center transition-all duration-200 ${bgClass} ${index !== 0 ? 'border-l border-slate-200' : ''}`}
              title={step.label}
            >
              <span className="text-xs sm:text-sm font-bold">{index + 1}</span>
            </button>
          );
        })}
      </div>

      <div className={`p-3 rounded-lg text-xs leading-relaxed border transition-colors duration-300 ${viewingStep === activeStepId ? 'bg-blue-50 text-blue-800 border-blue-100' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
        <div className="font-bold mb-1 flex items-center gap-1 text-sm">
           {viewingStep === activeStepId && "📍 현재 단계: "} 
           {VALUE_CHAIN_CONTEXT.find(s => s.id === viewingStep)?.label}
        </div>
        <div className="font-semibold mb-1 opacity-90">
          {VALUE_CHAIN_CONTEXT.find(s => s.id === viewingStep)?.summary}
        </div>
        <div className="opacity-80">
          {VALUE_CHAIN_CONTEXT.find(s => s.id === viewingStep)?.description}
        </div>
      </div>
    </div>
  );
};