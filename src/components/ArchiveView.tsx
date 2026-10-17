import React from 'react';
import { Calendar, FileText, Download, Clock, ArrowRight, BookOpen } from 'lucide-react';
import { Edition, EditionItem } from '../../shared/types.ts';

interface ArchiveViewProps {
  archive: Edition[];
  onOpenEdition: (edition: Edition) => void;
  onDownloadEditionPdf: (editionId: string, date: string) => void;
  onSelectTab: (tab: string) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  archive,
  onOpenEdition,
  onDownloadEditionPdf,
  onSelectTab,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#1C1917] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8C2D19] font-semibold">Broadsheet History</span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1C1917] tracking-tight">
            Your Edition Archive
          </h1>
          <p className="text-xs text-[#78716C] mt-1">
            Every daily broadsheet generated for your account remains permanently saved and printable.
          </p>
        </div>

        {archive.length > 0 && (
          <span className="text-xs text-[#78716C]">
            {archive.length} {archive.length === 1 ? 'edition' : 'editions'} preserved
          </span>
        )}
      </div>

      {/* Empty State for Fresh Real Account */}
      {archive.length === 0 ? (
        <div className="py-24 text-center bg-[#FFFFFF] border border-[#E7E5E4] rounded-lg p-8 max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#D6D3D1] text-[#78716C] flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#1C1917]">
            No archived editions yet
          </h3>
          <p className="text-xs text-[#78716C] leading-relaxed">
            As you receive and read your daily editions, Daybreak preserves each completed morning paper in this archive with its exact layout, order, and PDF.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onSelectTab('today')}
              className="px-5 py-2.5 bg-[#1C1917] text-[#FAF9F6] hover:bg-[#8C2D19] rounded text-xs font-medium transition-colors inline-flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Read Today's Paper</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archive.map(ed => (
            <div
              key={ed.id}
              className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-lg p-6 flex flex-col justify-between hover:border-[#1C1917] transition-all space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#78716C]">
                  <span className="font-semibold text-[#8C2D19] uppercase tracking-wider text-[10px]">
                    {ed.formattedDate}
                  </span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3" />
                    {ed.readingTimeMinutes} min
                  </span>
                </div>

                <h3 className="text-xl font-serif font-bold text-[#1C1917] leading-snug">
                  {ed.headline}
                </h3>

                <p className="text-xs text-[#78716C]">
                  Includes {ed.storyCount} stories across {Array.from(new Set(ed.items.map((i: EditionItem) => String(i.section)))).join(', ')}.
                </p>

                {ed.reflectionNote && (
                  <div className="p-2.5 bg-[#FAF9F6] border border-[#E7E5E4] rounded text-[11px] text-[#78716C] italic">
                    “{ed.reflectionNote}”
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#E7E5E4] flex items-center justify-between gap-3 text-xs">
                <button
                  onClick={() => onOpenEdition(ed)}
                  className="font-medium text-[#1C1917] hover:text-[#8C2D19] flex items-center gap-1"
                >
                  <span>Open Paper</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onDownloadEditionPdf(ed.id, ed.editionDate)}
                  className="px-3 py-1.5 bg-[#FAF9F6] border border-[#D6D3D1] hover:border-[#1C1917] text-[#1C1917] rounded text-[11px] font-medium transition-colors flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
