import React from 'react';
import { Newspaper, ArrowLeft } from 'lucide-react';

interface NotFoundViewProps {
  onGoHome: () => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ onGoHome }) => {
  return (
    <div className="py-24 text-center max-w-md mx-auto px-4 space-y-5">
      <div className="w-16 h-16 rounded-full bg-[#FFFFFF] border-2 border-[#1C1917] flex items-center justify-center mx-auto text-[#1C1917]">
        <Newspaper className="w-8 h-8" />
      </div>

      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#8C2D19]">
          404 · Unprinted Page
        </span>
        <h1 className="text-3xl font-serif font-bold text-[#1C1917]">
          Article or Route Not Found
        </h1>
        <p className="text-xs text-[#78716C] leading-relaxed pt-1">
          The dispatch or section you were seeking does not appear in today’s edition records.
        </p>
      </div>

      <div className="pt-3">
        <button
          onClick={onGoHome}
          className="px-5 py-2.5 bg-[#1C1917] text-[#FAF9F6] hover:bg-[#8C2D19] rounded text-xs font-medium transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Front Page</span>
        </button>
      </div>
    </div>
  );
};
