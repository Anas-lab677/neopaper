import React, { useState } from 'react';
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import { Edition } from '../../shared/types.ts';

interface NewspaperPdfPreviewModalProps {
  edition: Edition | null;
  readerName: string;
  isOpen: boolean;
  onClose: () => void;
  onDownloadPdf: () => void;
}

export const NewspaperPdfPreviewModal: React.FC<NewspaperPdfPreviewModalProps> = ({
  edition,
  readerName,
  isOpen,
  onClose,
  onDownloadPdf,
}) => {
  const [currentPage, setCurrentPage] = useState<1 | 2>(1);
  const [zoom, setZoom] = useState<number>(100);

  if (!isOpen || !edition) return null;

  const totalPages = edition.items.length > 5 ? 2 : 1;
  const leadStory = edition.items[0];
  const page1Stories = edition.items.slice(1, 5);
  const page2Stories = edition.items.slice(5);

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(140, Math.max(70, prev + delta)));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#252B27]/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
      <div className="bg-[#EBE7DD] border border-[#D5CFBF] rounded-lg shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden">
        {/* Top Control Bar */}
        <div className="bg-[#F7F5EF] border-b border-[#D5CFBF] px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-xs font-medium text-[#616962] hover:text-[#252B27] flex items-center gap-1.5 p-1 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to edition</span>
            </button>
            <span className="hidden sm:inline text-xs text-[#616962]">|</span>
            <span className="hidden sm:inline font-serif font-bold text-sm text-[#252B27]">
              Your morning, <span className="italic font-normal">on paper.</span>
            </span>
          </div>

          {/* Page & Zoom Navigation */}
          <div className="flex items-center gap-2 sm:gap-3 bg-white px-3 py-1 rounded border border-[#E5DFD3] text-xs">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1 hover:text-[#B65B3D] disabled:opacity-30 disabled:hover:text-inherit"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-[#252B27]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(2)}
              disabled={currentPage === totalPages}
              className="p-1 hover:text-[#B65B3D] disabled:opacity-30 disabled:hover:text-inherit"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-[#E5DFD3]">|</span>

            <button
              onClick={() => handleZoom(-10)}
              className="p-1 hover:text-[#B65B3D]"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center font-mono">{zoom}%</span>
            <button
              onClick={() => handleZoom(10)}
              className="p-1 hover:text-[#B65B3D]"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Download Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={onDownloadPdf}
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#B65B3D] text-white hover:bg-[#9D4B31] text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-[#616962] hover:text-[#252B27]"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body: Broadsheet Paper Canvas + Sidebar */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col lg:flex-row gap-6 items-start justify-center">
          {/* Newspaper Broadsheet Paper Sheet */}
          <div
            className="bg-[#FCFAF6] border border-[#D5CFBF] shadow-lg p-6 sm:p-10 mx-auto w-full max-w-[650px] transition-transform duration-200"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          >
            {/* Masthead */}
            <div className="border-b-2 border-t-2 border-[#252B27] py-2 mb-4">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#616962] font-semibold mb-1">
                <span>{edition.formattedDate}</span>
                <span>{readerName.toUpperCase()}'S EDITION</span>
                <span>REV {edition.revision}</span>
              </div>
              <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-serif font-black tracking-tight text-[#252B27]">
                  daybreak.
                </h1>
                <p className="text-[10px] tracking-widest text-[#616962] uppercase font-sans mt-0.5">
                  A Personal Morning Newspaper · A calmer, brighter morning
                </p>
              </div>
            </div>

            {/* PAGE 1 CONTENT */}
            {currentPage === 1 && (
              <div className="space-y-6">
                {/* Lead Story */}
                {leadStory && (
                  <div>
                    <span className="text-[10px] font-bold text-[#B65B3D] uppercase tracking-wider block mb-1">
                      FEATURED · {leadStory.section}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#252B27] leading-tight mb-2">
                      {leadStory.headline}
                    </h2>
                    <div className="text-[10px] text-[#616962] mb-3 flex items-center gap-2">
                      <span>{leadStory.publisher}</span>
                      <span>·</span>
                      <span>{leadStory.selectionReason}</span>
                    </div>

                    {leadStory.imageUrl && (
                      <div className="w-full h-44 rounded overflow-hidden mb-3 bg-[#E5DFD3]/40">
                        <img
                          src={leadStory.imageUrl}
                          alt={leadStory.headline}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <p className="font-serif text-xs text-[#252B27] leading-relaxed mb-3">
                      {leadStory.briefSummary}
                    </p>

                    {leadStory.takeaways && leadStory.takeaways.length > 0 && (
                      <div className="p-2.5 rounded bg-[#F7F5EF] border border-[#E5DFD3] text-[11px] mb-2">
                        <span className="font-semibold text-[#616962] uppercase text-[9px] block mb-1">
                          Key Takeaways
                        </span>
                        <ul className="space-y-1">
                          {leadStory.takeaways.map((tk, idx) => (
                            <li key={idx} className="text-[#252B27]">
                              • {tk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <a
                      href={leadStory.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#B65B3D] font-medium hover:underline inline-flex items-center gap-1"
                    >
                      <span>Read full story at publisher →</span>
                    </a>
                  </div>
                )}

                <div className="w-full h-px bg-[#D5CFBF]" />

                {/* 2-Column Secondary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {page1Stories.map(story => (
                    <div key={story.id} className="border-b sm:border-b-0 pb-3 sm:pb-0">
                      <span className="text-[9px] font-bold text-[#B65B3D] uppercase tracking-wider block mb-0.5">
                        {story.section}
                      </span>
                      <h3 className="font-serif font-bold text-sm text-[#252B27] leading-snug mb-1 line-clamp-2">
                        {story.headline}
                      </h3>
                      <p className="text-[10px] text-[#616962] mb-1.5">{story.publisher}</p>
                      <p className="font-serif text-[11px] text-[#252B27] leading-relaxed line-clamp-4 mb-2">
                        {story.briefSummary}
                      </p>
                      <a
                        href={story.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] text-[#B65B3D] hover:underline"
                      >
                        Read full story →
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PAGE 2 CONTENT */}
            {currentPage === 2 && (
              <div className="space-y-6">
                <h2 className="font-serif font-bold text-lg text-[#252B27] pb-2 border-b border-[#D5CFBF]">
                  More from your morning selection
                </h2>

                {page2Stories.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {page2Stories.map(story => (
                      <div key={story.id} className="border-b pb-3 border-[#E5DFD3]">
                        <span className="text-[9px] font-bold text-[#B65B3D] uppercase tracking-wider block mb-0.5">
                          {story.section}
                        </span>
                        <h3 className="font-serif font-bold text-sm text-[#252B27] leading-snug mb-1">
                          {story.headline}
                        </h3>
                        <p className="text-[10px] text-[#616962] mb-1.5">{story.publisher}</p>
                        <p className="font-serif text-[11px] text-[#252B27] leading-relaxed line-clamp-4 mb-2">
                          {story.briefSummary}
                        </p>
                        <a
                          href={story.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] text-[#B65B3D] hover:underline"
                        >
                          Read full story →
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#616962] italic">
                    All selected stories are presented on Page 1 for this reading duration.
                  </p>
                )}

                {/* Recap closing section on Page 2 */}
                <div className="border-t-2 border-[#252B27] pt-4 mt-6">
                  <h3 className="font-serif italic text-base text-[#252B27] mb-3">
                    Three things to take into today.
                  </h3>
                  <div className="space-y-2.5">
                    {edition.recapTakeaways.map((rt, idx) => (
                      <div key={rt.id} className="text-[11px]">
                        <span className="font-semibold text-[#7D8B72] block">
                          0{idx + 1}. {rt.title}
                        </span>
                        <span className="text-[#252B27] font-serif">{rt.takeaway}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 rounded bg-[#F7F5EF] border border-[#E5DFD3] text-center">
                    <p className="font-serif italic text-xs text-[#616962]">
                      {edition.reflectionNote
                        ? `Your reflection: "${edition.reflectionNote}"`
                        : '“A little perspective. A world of possibility. Your morning, made personal.”'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Page Footer */}
            <div className="border-t border-[#D5CFBF] pt-3 mt-8 flex items-center justify-between text-[9px] text-[#616962]">
              <span>Daybreak — Your Personal Morning Paper</span>
              <span>Page {currentPage} of {totalPages}</span>
            </div>
          </div>

          {/* Right Information & Fact Sheet Sidebar */}
          <div className="w-full lg:w-72 shrink-0 space-y-4">
            <div className="bg-white border border-[#D5CFBF] rounded-lg p-4">
              <span className="block text-xs font-semibold text-[#252B27] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#B65B3D]" />
                <span>Identical Snapshot</span>
              </span>
              <p className="text-xs text-[#616962] leading-relaxed">
                The PDF layout is generated from the exact same saved snapshot as the on-screen edition. Headlines, ordering, takeaways, and publisher links match 1:1.
              </p>
              <div className="mt-3 pt-3 border-t border-[#E5DFD3] text-xs text-[#252B27] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#616962]">Total Stories:</span>
                  <span className="font-semibold">{edition.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#616962]">Pages:</span>
                  <span className="font-semibold">{totalPages} pages</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#616962]">Reading Time:</span>
                  <span className="font-semibold">{edition.readingTimeMinutes} min</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#D5CFBF] rounded-lg p-4">
              <span className="block text-xs font-semibold text-[#252B27] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-[#7D8B72]" />
                <span>Interactive Links</span>
              </span>
              <p className="text-xs text-[#616962] leading-relaxed">
                All publisher credits in the downloaded PDF include active hyperlinks to original reporting so you can verify and explore source journalism.
              </p>
            </div>

            <button
              onClick={onDownloadPdf}
              className="w-full py-2.5 rounded bg-[#B65B3D] text-white hover:bg-[#9D4B31] text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Printable PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
