import React, { useState } from 'react';
import { X, Download, FileText, ExternalLink, Eye, Newspaper } from 'lucide-react';
import type { Edition } from '../../shared/types.ts';

interface NewspaperPdfPreviewModalProps {
  edition: Edition | null;
  readerName: string;
  isOpen: boolean;
  onClose: () => void;
  onDownloadPdf: () => void;
}

export function NewspaperPdfPreviewModal({
  edition,
  readerName,
  isOpen,
  onClose,
  onDownloadPdf,
}: NewspaperPdfPreviewModalProps) {
  const [viewMode, setViewMode] = useState<'pdf' | 'broadsheet'>('pdf');

  if (!isOpen || !edition) return null;

  const pdfUrl = `/api/editions/${edition.id || 'today'}/pdf`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl mx-4 bg-[#FAF9F6] rounded-xl shadow-2xl border border-[#E7E5E4] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E5E4] bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#8C2D19]/10 text-[#8C2D19]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2
                className="text-xl font-bold text-[#1C1917]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Daybreak Morning Broadsheet
              </h2>
              <p className="text-xs text-[#78716C]">
                {edition.formattedDate || edition.editionDate} · Edition Rev {edition.revision || 1} · {edition.storyCount || edition.items?.length || 0} Stories
              </p>
            </div>
          </div>

          {/* View Mode Toggle & Close */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center bg-[#F5F5F4] p-1 rounded-lg border border-[#E7E5E4] text-xs">
              <button
                onClick={() => setViewMode('pdf')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors ${
                  viewMode === 'pdf'
                    ? 'bg-white text-[#1C1917] shadow-sm'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>PDF Document</span>
              </button>
              <button
                onClick={() => setViewMode('broadsheet')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-medium transition-colors ${
                  viewMode === 'broadsheet'
                    ? 'bg-white text-[#1C1917] shadow-sm'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                <Newspaper className="w-3.5 h-3.5" />
                <span>Broadsheet Layout</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#E7E5E4] text-[#78716C] hover:text-[#1C1917] transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto bg-[#F5F5F4]/60">
          {viewMode === 'pdf' ? (
            <div className="w-full h-[62vh] min-h-[420px] rounded-lg border border-[#D6D3D1] overflow-hidden bg-white shadow-inner flex flex-col">
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0`}
                className="w-full h-full border-none"
                title="Newspaper PDF Broadsheet Preview"
              />
            </div>
          ) : (
            <div className="border border-[#D6D3D1] rounded-lg p-6 sm:p-8 bg-white shadow-sm max-w-3xl mx-auto font-serif">
              {/* Masthead */}
              <div className="text-center border-b-2 border-[#1C1917] pb-4 mb-6">
                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-[#78716C] mb-2 font-sans">
                  <span>{edition.formattedDate || edition.editionDate}</span>
                  <span>Volume I · Rev {edition.revision || 1}</span>
                  <span>Personal Edition</span>
                </div>
                <h1
                  className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1C1917] my-2"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  DAYBREAK
                </h1>
                <p className="text-xs uppercase tracking-widest text-[#78716C] font-sans">
                  The Personalized Morning Broadsheet & Finite Daily Reader
                </p>
                <div className="flex items-center justify-center gap-3 mt-3 text-xs text-[#78716C] font-sans border-t border-[#E7E5E4] pt-2">
                  <span>Prepared for <strong>{readerName}</strong></span>
                  <span>·</span>
                  <span>~{edition.readingTimeMinutes || 10} min read</span>
                  <span>·</span>
                  <span>{edition.items?.length || 0} Stories</span>
                </div>
              </div>

              {/* Morning in 3 Recap */}
              {edition.recapTakeaways && edition.recapTakeaways.length > 0 && (
                <div className="mb-6 p-4 bg-[#FAF9F6] border border-[#E7E5E4] rounded font-sans">
                  <span className="text-xs font-bold text-[#8C2D19] uppercase tracking-wider block mb-2">
                    Morning in 3 · Essential Realities
                  </span>
                  <div className="space-y-2">
                    {edition.recapTakeaways.map((rt, i) => (
                      <div key={i} className="flex gap-2 text-xs text-[#292524]">
                        <span className="font-bold text-[#8C2D19]">{i + 1}.</span>
                        <span><strong>{rt.title}:</strong> {rt.takeaway}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Story Articles */}
              <div className="space-y-6 divide-y divide-[#E7E5E4]">
                {edition.items?.map((item, idx) => (
                  <article key={item.id || idx} className={idx > 0 ? 'pt-4' : ''}>
                    <div className="flex items-center gap-2 text-[11px] font-sans font-bold uppercase text-[#8C2D19] mb-1">
                      <span>{item.section || 'WORLD'}</span>
                      <span>·</span>
                      <span className="text-[#78716C] font-normal">{item.publisher}</span>
                    </div>
                    <h3
                      className={`font-bold text-[#1C1917] leading-tight ${
                        idx === 0 ? 'text-xl sm:text-2xl mb-2' : 'text-base sm:text-lg mb-1'
                      }`}
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      {item.headline}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#44403C] leading-relaxed mb-2 font-sans">
                      {item.briefSummary}
                    </p>
                    {item.takeaways && item.takeaways.length > 0 && (
                      <ul className="text-xs text-[#57534E] space-y-1 font-sans pl-3 list-disc list-inside">
                        {item.takeaways.map((tk, tIdx) => (
                          <li key={tIdx}>{tk}</li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>

              {/* Reflection */}
              {edition.reflectionNote && (
                <div className="mt-6 p-4 bg-[#FAF9F6] border border-[#D6D3D1] rounded italic text-xs text-[#292524] font-sans">
                  <span className="font-bold not-italic text-[#8C2D19] block mb-1">Your Reflection Note:</span>
                  “{edition.reflectionNote}”
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E7E5E4] bg-white">
          <button
            onClick={() => window.open(pdfUrl, '_blank')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#78716C] hover:text-[#1C1917] hover:bg-[#F5F5F4] rounded-lg transition-colors border border-[#E7E5E4]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open PDF in Tab</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#78716C] hover:text-[#1C1917] rounded-lg hover:bg-[#F5F5F4] transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onDownloadPdf();
                onClose();
              }}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#FAF9F6] bg-[#8C2D19] rounded-lg hover:bg-[#7A2616] transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Broadsheet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
