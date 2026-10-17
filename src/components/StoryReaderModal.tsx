import React from 'react';
import { X, ExternalLink, Bookmark, EyeOff, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { EditionItem } from '../../shared/types.ts';

interface StoryReaderModalProps {
  item: EditionItem | null;
  onClose: () => void;
  onToggleSave: (item: EditionItem) => void;
  isSaved: boolean;
  onSkip: (item: EditionItem) => void;
  onFeedback: (item: EditionItem, type: 'more' | 'less') => void;
  currentFeedback?: 'more' | 'less' | null;
}

export const StoryReaderModal: React.FC<StoryReaderModalProps> = ({
  item,
  onClose,
  onToggleSave,
  isSaved,
  onSkip,
  onFeedback,
  currentFeedback,
}) => {
  if (!item) return null;

  const formattedDate = new Date(item.publishedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#252B27]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#F7F5EF] border border-[#E5DFD3] rounded-lg shadow-2xl max-w-2xl w-full p-6 sm:p-8 my-auto relative max-h-[90vh] flex flex-col justify-between">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5DFD3] mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#B65B3D] uppercase tracking-wider">
            <span>{item.section}</span>
            <span className="text-[#E5DFD3]">·</span>
            <span className="text-[#616962] font-normal">{item.publisher}</span>
            <span className="text-[#E5DFD3]">·</span>
            <span className="text-[#616962] font-normal">{formattedDate}</span>
          </div>

          <button
            onClick={onClose}
            className="text-[#616962] hover:text-[#252B27] p-1.5 rounded focus:outline-none"
            aria-label="Back to paper"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-5">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#252B27] leading-tight">
            {item.headline}
          </h1>

          {/* Optional image if available */}
          {item.imageUrl && (
            <div className="w-full h-52 sm:h-64 rounded overflow-hidden bg-[#E5DFD3]/50">
              <img
                src={item.imageUrl}
                alt={item.headline}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Why this story pill banner */}
          <div className="px-3.5 py-2 rounded bg-[#EDF2EB] border border-[#7D8B72]/30 text-xs text-[#252B27] flex items-center gap-2">
            <span className="font-semibold text-[#7D8B72]">Why this story?</span>
            <span>{item.selectionReason}</span>
          </div>

          {/* Grounded brief */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-[#616962] font-medium">
                {item.isAiBrief ? 'Source-Grounded Brief' : 'Publisher Excerpt'}
              </span>
              <span className="text-[11px] text-[#616962] italic">
                {item.isAiBrief ? 'Synthesized via Gemini 3.8 Flash' : 'Direct publisher excerpt'}
              </span>
            </div>
            <p className="font-serif text-base sm:text-lg text-[#252B27] leading-relaxed">
              {item.briefSummary}
            </p>
          </div>

          {/* Key Takeaways */}
          {item.takeaways && item.takeaways.length > 0 && (
            <div className="bg-[#FCFAF6] border border-[#E5DFD3] rounded p-4">
              <span className="block text-xs font-semibold text-[#616962] uppercase tracking-wider mb-2">
                Supported Key Takeaways
              </span>
              <ul className="space-y-2">
                {item.takeaways.map((tk, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-[#252B27]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B65B3D] mt-1.5 shrink-0" />
                    <span>{tk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Original article external link */}
          <div className="pt-2">
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-[#252B27] text-white hover:bg-black text-xs font-semibold transition-colors"
            >
              <span>Read original article at {item.publisher}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <p className="text-[11px] text-[#616962] mt-1.5">
              Original full reporting belongs to {item.publisher}. Daybreak never copies full paywalled text.
            </p>
          </div>
        </div>

        {/* Reader Action Controls */}
        <div className="border-t border-[#E5DFD3] pt-4 mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Save bookmark */}
            <button
              onClick={() => onToggleSave(item)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                isSaved
                  ? 'bg-[#B65B3D] text-white border-[#B65B3D]'
                  : 'bg-white text-[#252B27] border-[#E5DFD3] hover:bg-[#FCFAF6]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isSaved ? 'Saved' : 'Save for later'}</span>
            </button>

            {/* Skip from current paper */}
            <button
              onClick={() => {
                onSkip(item);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-[#E5DFD3] bg-white text-[#616962] hover:text-[#B65B3D] hover:bg-[#FCFAF6] transition-colors"
              title="Hide this story from today's paper"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Skip story</span>
            </button>
          </div>

          {/* Feedback buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#616962] mr-1">Feedback:</span>
            <button
              onClick={() => onFeedback(item, 'more')}
              className={`p-1.5 rounded border text-xs flex items-center gap-1 transition-colors ${
                currentFeedback === 'more'
                  ? 'bg-[#7D8B72] text-white border-[#7D8B72]'
                  : 'bg-white text-[#616962] border-[#E5DFD3] hover:text-[#252B27]'
              }`}
              title="More stories like this"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>More like this</span>
            </button>

            <button
              onClick={() => onFeedback(item, 'less')}
              className={`p-1.5 rounded border text-xs flex items-center gap-1 transition-colors ${
                currentFeedback === 'less'
                  ? 'bg-[#B65B3D] text-white border-[#B65B3D]'
                  : 'bg-white text-[#616962] border-[#E5DFD3] hover:text-[#252B27]'
              }`}
              title="Less stories like this"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>Less like this</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
