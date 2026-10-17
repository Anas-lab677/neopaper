import React from 'react';
import { X, Download, FileText } from 'lucide-react';
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
  if (!isOpen || !edition) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl mx-4 bg-[#FAF9F6] rounded-xl shadow-2xl border border-[#E7E5E4] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E5E4]">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#8C2D19]" />
            <div>
              <h2 className="text-lg font-semibold text-[#1C1917]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                PDF Preview
              </h2>
              <p className="text-xs text-[#78716C]">
                {edition.formattedDate} · Rev {edition.revision}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#E7E5E4] text-[#78716C] hover:text-[#1C1917] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="border border-[#E7E5E4] rounded-lg p-6 bg-white shadow-inner">
            {/* Simulated newspaper header */}
            <div className="text-center border-b-2 border-[#1C1917] pb-4 mb-4">
              <h1
                className="text-3xl font-bold text-[#1C1917] tracking-wide"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                DAYBREAK
              </h1>
              <p className="text-xs text-[#78716C] mt-1 tracking-widest uppercase">
                Your Personal Morning Paper
              </p>
              <div className="flex items-center justify-center gap-4 mt-2 text-xs text-[#78716C]">
                <span>{edition.formattedDate}</span>
                <span>·</span>
                <span>For {readerName}</span>
                <span>·</span>
                <span>{edition.storyCount} Stories</span>
              </div>
            </div>

            {/* Story previews */}
            <div className="space-y-3">
              {edition.items.slice(0, 6).map((item, i) => (
                <div key={item.id} className="flex gap-3 items-start">
                  <span className="text-xs font-bold text-[#8C2D19] mt-0.5 shrink-0 w-4 text-right">
                    {i + 1}.
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[#1C1917] leading-tight">{item.headline}</p>
                    <p className="text-xs text-[#78716C] mt-0.5">{item.publisher} · {item.section}</p>
                  </div>
                </div>
              ))}
              {edition.items.length > 6 && (
                <p className="text-xs text-[#78716C] italic text-center pt-2">
                  + {edition.items.length - 6} more stories in full PDF…
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E7E5E4] bg-[#F5F5F4]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#78716C] hover:text-[#1C1917] rounded-lg hover:bg-[#E7E5E4] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onDownloadPdf();
              onClose();
            }}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#FAF9F6] bg-[#8C2D19] rounded-lg hover:bg-[#7A2616] transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
