import React from 'react';

interface Props {
  content: string;
}

export const MarkdownRenderer: React.FC<Props> = ({ content }) => {
  if (!content) return null;
  const lines = content.split('\n');

  const renderTextWithBold = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-indigo-900 bg-indigo-50 px-1 rounded">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-4 text-slate-700 leading-relaxed">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-bold text-slate-800 mt-6 mb-2 border-l-4 border-blue-500 pl-3">{trimmed.replace('### ', '')}</h3>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-extrabold text-slate-900 mt-8 mb-4 pb-2 border-b border-slate-200">{trimmed.replace('## ', '')}</h2>;
        }
        if (trimmed.startsWith('- ')) {
          return (
            <div key={index} className="flex gap-2 ml-1 mb-2">
              <span className="text-blue-500 font-bold">•</span>
              <span className="flex-1">{renderTextWithBold(trimmed.replace('- ', ''))}</span>
            </div>
          );
        }
        if (trimmed === '') return <div key={index} className="h-2" />;
        return <p key={index}>{renderTextWithBold(line)}</p>;
      })}
    </div>
  );
};