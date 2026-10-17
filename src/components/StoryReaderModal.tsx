import React from 'react';
import { X, ExternalLink, Bookmark, ThumbsUp, ThumbsDown, EyeOff, Check, ShieldCheck } from 'lucide-react';

interface StoryReaderModalProps {
  item: any;
  onClose: () => void;
  onToggleSave: (item: any) => void;
  isSaved: boolean;
  onLikeStory: (item: any) => void;
  onDislikeStory: (item: any) => void;
  onSkipStory: (item: any) => void;
  isLiked?: boolean;
  isDisliked?: boolean;
}

export const StoryReaderModal: React.FC<StoryReaderModalProps> = ({
  item,
  onClose,
  onToggleSave,
  isSaved,
  onLikeStory,
  onDislikeStory,
  onSkipStory,
  isLiked,
  isDisliked,
}) => {
  if (!item) return null;

  const formattedDate = item.publishedAt
    ? new Date(item.publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const takeaways: string[] = item.takeaways && item.takeaways.length > 0
    ? item.takeaways
    : [item.briefSummary || item.excerpt];

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1917]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-lg shadow-2xl max-w-2xl w-full p-6 sm:p-8 my-auto relative max-h-[92vh] flex flex-col justify-between">
        {/* Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E7E5E4] mb-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8C2D19] uppercase tracking-wider">
            <span>{item.section || item.topic}</span>
            <span className="text-[#D6D3D1]">·</span>
            <span className="text-[#78716C] font-normal">{item.publisher}</span>
            {formattedDate && (
              <>
                <span className="text-[#D6D3D1]">·</span>
                <span className="text-[#78716C] font-normal">{formattedDate}</span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#78716C] hover:text-[#1C1917] p-1.5 rounded focus:outline-none"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Story Body */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-5">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917] leading-snug">
            {item.headline}
          </h1>

          {/* Optional Image */}
          {item.imageUrl && (
            <div className="w-full h-56 sm:h-64 overflow-hidden rounded bg-[#FAF9F6] border border-[#E7E5E4]">
              <img
                src={item.imageUrl}
                alt={item.headline}
                className="w-full h-full object-cover"
                onError={e => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Brief Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917]">
              Editorial Brief
            </h4>
            <p className="text-sm text-[#292524] leading-relaxed">
              {item.briefSummary || item.excerpt}
            </p>
          </div>

          {/* 3 Verifiable Things / Factual Takeaways */}
          <div className="bg-[#FAF9F6] border border-[#E7E5E4] rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8C2D19] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Three Verifiable Key Takeaways</span>
            </div>

            <div className="space-y-2.5 text-xs text-[#1C1917]">
              {takeaways.map((takeaway, idx) => (
                <div key={idx} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="w-4 h-4 rounded-full bg-[#E7E5E4] text-[#1C1917] font-semibold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p>{takeaway}</p>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-[#A8A29E] pt-1">
              Grounded strictly in source dispatches from {item.publisher}.
            </p>
          </div>

          {/* Selection Reason */}
          {item.selectionReason && (
            <p className="text-xs text-[#78716C] bg-[#FAF9F6] p-2.5 rounded border border-[#E7E5E4]">
              <strong className="text-[#1C1917]">Why this story:</strong> {item.selectionReason}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-5 border-t border-[#E7E5E4] flex items-center justify-between gap-3 text-xs">
          <a
            href={item.sourceUrl || item.canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8C2D19] hover:underline flex items-center gap-1.5 font-medium"
          >
            <span>Read full story at {item.publisher}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(item)}
              className={`p-2 rounded transition-colors flex items-center gap-1 ${
                isSaved ? 'text-[#8C2D19] bg-[#8C2D19]/10' : 'text-[#78716C] hover:text-[#1C1917] bg-[#FAF9F6]'
              }`}
              title="Bookmark story"
            >
              <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
              <span className="text-[11px]">{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              onClick={() => onLikeStory(item)}
              className={`p-2 rounded transition-colors ${
                isLiked ? 'text-green-700 bg-green-50' : 'text-[#78716C] hover:text-[#1C1917] bg-[#FAF9F6]'
              }`}
              title="More like this"
            >
              <ThumbsUp className="w-3.5 h-3.5" fill={isLiked ? 'currentColor' : 'none'} />
            </button>

            <button
              onClick={() => onDislikeStory(item)}
              className={`p-2 rounded transition-colors ${
                isDisliked ? 'text-red-700 bg-red-50' : 'text-[#78716C] hover:text-[#1C1917] bg-[#FAF9F6]'
              }`}
              title="Fewer like this"
            >
              <ThumbsDown className="w-3.5 h-3.5" fill={isDisliked ? 'currentColor' : 'none'} />
            </button>

            <button
              onClick={() => {
                onSkipStory(item);
                onClose();
              }}
              className="p-2 text-[#78716C] hover:text-[#1C1917] bg-[#FAF9F6] rounded"
              title="Skip story"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
