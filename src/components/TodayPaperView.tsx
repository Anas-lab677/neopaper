import React, { useState, useCallback } from 'react';
import {
  FileText,
  Download,
  Bookmark,
  EyeOff,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Clock,
  ArrowRight,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Edition, EditionItem, Topic, UserProfile } from '../../shared/types.ts';

interface TodayPaperViewProps {
  edition: Edition | null;
  profile: UserProfile | null;
  onOpenReader: (item: EditionItem) => void;
  onToggleSave: (item: EditionItem) => void;
  savedItemIds: Set<string>;
  onSkipItem: (item: EditionItem) => void;
  skippedItemIds: Set<string>;
  onLikeStory: (item: EditionItem) => void;
  onDislikeStory: (item: EditionItem) => void;
  likedItemIds: Set<string>;
  dislikedItemIds: Set<string>;
  onRefreshEdition: () => Promise<void>;
  isRefreshing: boolean;
  onOpenPdfPreview: () => void;
  onDownloadPdf: () => void;
  onSaveReflection: (note: string) => Promise<void>;
}

export const TodayPaperView: React.FC<TodayPaperViewProps> = ({
  edition,
  profile,
  onOpenReader,
  onToggleSave,
  savedItemIds,
  onSkipItem,
  skippedItemIds,
  onLikeStory,
  onDislikeStory,
  likedItemIds,
  dislikedItemIds,
  onRefreshEdition,
  isRefreshing,
  onOpenPdfPreview,
  onDownloadPdf,
  onSaveReflection,
}) => {
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');
  const [reflectionInput, setReflectionInput] = useState(edition?.reflectionNote || '');
  const [reflectionSaved, setReflectionSaved] = useState(false);

  if (!edition) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#1C1917] border-t-transparent animate-spin mx-auto mb-4" />
        <h3 className="text-2xl font-serif font-bold text-[#1C1917] mb-2">
          Assembling Today’s Paper
        </h3>
        <p className="text-xs text-[#78716C] leading-relaxed">
          Gathering verified reporting from your followed topics, checking source feeds, and generating your morning broadsheet...
        </p>
      </div>
    );
  }

  const visibleItems = edition.items.filter((item: EditionItem) => {
    if (skippedItemIds.has(item.id)) return false;
    if (selectedSectionFilter !== 'all' && item.section !== selectedSectionFilter) return false;
    return true;
  });

  const leadStory = visibleItems[0];
  const secondaryStories = visibleItems.slice(1);
  const sections: string[] = Array.from(new Set(edition.items.map((i: EditionItem) => String(i.section))));

  const handleSaveReflection = async () => {
    if (reflectionInput.trim()) {
      await onSaveReflection(reflectionInput.trim());
      setReflectionSaved(true);
      setTimeout(() => setReflectionSaved(false), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      {/* TWO-COLUMN LAYOUT (Sketch 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Edition Masthead, Navigation & PDF Controls (Desktop: 4 cols) */}
        <aside className="lg:col-span-4 space-y-6 bg-[#FFFFFF] border border-[#E7E5E4] rounded-lg p-5 sticky top-20">
          {/* Masthead details */}
          <div className="space-y-3 pb-4 border-b border-[#E7E5E4]">
            <div className="flex items-center justify-between text-[11px] text-[#78716C]">
              <span className="font-semibold text-[#8C2D19] uppercase tracking-wider">
                Vol. {edition.editionDate.replace(/-/g, '.')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {edition.readingTimeMinutes} min read
              </span>
            </div>

            <h2 className="text-2xl font-serif font-bold text-[#1C1917] leading-tight">
              {edition.greeting}
            </h2>

            <p className="text-xs text-[#78716C]">
              {edition.formattedDate} · Rev {edition.revision}
            </p>

            <div className="text-[11px] text-[#A8A29E] bg-[#FAF9F6] p-2.5 rounded border border-[#E7E5E4]">
              🔒 Saved Daily Edition: This broadsheet remains permanently preserved for this date.
            </div>
          </div>

          {/* PDF Broadsheet Actions */}
          <div className="space-y-2 pb-4 border-b border-[#E7E5E4]">
            <span className="text-[10px] font-semibold text-[#1C1917] uppercase tracking-wider block mb-1">
              Broadsheet Edition
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onOpenPdfPreview}
                className="py-2 px-3 bg-[#1C1917] text-[#FAF9F6] hover:bg-[#8C2D19] rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Preview PDF</span>
              </button>
              <button
                onClick={onDownloadPdf}
                className="py-2 px-3 bg-[#FAF9F6] border border-[#D6D3D1] hover:border-[#1C1917] text-[#1C1917] rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Section Navigation Index */}
          <div className="space-y-2 pb-4 border-b border-[#E7E5E4]">
            <span className="text-[10px] font-semibold text-[#1C1917] uppercase tracking-wider block mb-1">
              Sections Index
            </span>
            <div className="flex flex-col gap-1 text-xs">
              <button
                onClick={() => setSelectedSectionFilter('all')}
                className={`text-left px-2.5 py-1.5 rounded transition-colors ${
                  selectedSectionFilter === 'all'
                    ? 'bg-[#1C1917] text-[#FAF9F6] font-medium'
                    : 'text-[#78716C] hover:bg-[#FAF9F6] hover:text-[#1C1917]'
                }`}
              >
                Complete Edition ({edition.items.length})
              </button>
              {sections.map((sec: string) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSectionFilter(sec)}
                  className={`text-left px-2.5 py-1.5 rounded transition-colors ${
                    selectedSectionFilter === sec
                      ? 'bg-[#1C1917] text-[#FAF9F6] font-medium'
                      : 'text-[#78716C] hover:bg-[#FAF9F6] hover:text-[#1C1917]'
                  }`}
                >
                  {sec} ({edition.items.filter((i: EditionItem) => String(i.section) === sec).length})
                </button>
              ))}
            </div>
          </div>

          {/* Reader Reflection Ritual */}
          <div className="space-y-2">
            <span className="text-[10px] font-semibold text-[#1C1917] uppercase tracking-wider block">
              Today's Personal Note
            </span>
            <p className="text-[11px] text-[#78716C]">
              Jot down one key realization from this morning’s reading:
            </p>
            <textarea
              value={reflectionInput}
              onChange={e => setReflectionInput(e.target.value)}
              rows={3}
              placeholder="What stood out to you today?"
              className="w-full text-xs p-2.5 border border-[#D6D3D1] rounded bg-[#FAF9F6] focus:border-[#1C1917] focus:outline-none"
            />
            <div className="flex items-center justify-between">
              <button
                onClick={handleSaveReflection}
                className="py-1 px-3 bg-[#1C1917] text-[#FAF9F6] hover:bg-[#8C2D19] rounded text-[11px] font-medium transition-colors flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                <span>Save Note</span>
              </button>
              {reflectionSaved && (
                <span className="text-[11px] text-green-700 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Saved
                </span>
              )}
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: Broadsheet Content (Desktop: 8 cols) */}
        <main className="lg:col-span-8 space-y-8">
          {/* YOUR MORNING IN 3: Source-grounded takeaways */}
          {edition.recapTakeaways && edition.recapTakeaways.length > 0 && (
            <section className="bg-[#FFFFFF] border-2 border-[#1C1917] rounded-lg p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 rounded bg-[#8C2D19] text-[#FAF9F6] text-[10px] uppercase tracking-wider font-semibold">
                  Editorial Brief
                </span>
                <h3 className="text-lg font-serif font-bold text-[#1C1917]">
                  Your Morning in 3 Key Takeaways
                </h3>
              </div>

              <div className="space-y-3">
                {edition.recapTakeaways.slice(0, 3).map((takeaway, idx: number) => (
                  <div key={takeaway.id || idx} className="flex items-start gap-3 text-xs leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-[#FAF9F6] border border-[#D6D3D1] text-[#1C1917] font-semibold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-[#1C1917] font-medium">{takeaway.takeaway}</p>
                      <span className="text-[10px] text-[#78716C]">{takeaway.publisher}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FEATURED LEAD STORY (Sketch 2) */}
          {leadStory && (
            <article className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-lg p-6 sm:p-8 hover:border-[#1C1917] transition-all group">
              <div className="space-y-4">
                {leadStory.imageUrl && (
                  <div className="w-full h-64 sm:h-80 overflow-hidden rounded bg-[#FAF9F6]">
                    <img
                      src={leadStory.imageUrl}
                      alt={leadStory.headline}
                      className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-300"
                      loading="lazy"
                      onError={e => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-[#78716C]">
                  <span className="font-semibold text-[#8C2D19] uppercase tracking-wider text-[11px]">
                    Lead Story · {leadStory.section}
                  </span>
                  <span>{leadStory.publisher}</span>
                </div>

                <h1
                  onClick={() => onOpenReader(leadStory)}
                  className="text-2xl sm:text-4xl font-serif font-bold text-[#1C1917] group-hover:text-[#8C2D19] transition-colors leading-tight cursor-pointer"
                >
                  {leadStory.headline}
                </h1>

                <p className="text-sm text-[#78716C] leading-relaxed">
                  {leadStory.briefSummary}
                </p>

                {leadStory.selectionReason && (
                  <p className="text-[11px] text-[#78716C] bg-[#FAF9F6] border border-[#E7E5E4] px-2.5 py-1 rounded inline-block">
                    {leadStory.selectionReason}
                  </p>
                )}
              </div>

              <div className="pt-5 mt-5 border-t border-[#E7E5E4] flex items-center justify-between text-xs">
                <button
                  onClick={() => onOpenReader(leadStory)}
                  className="font-medium text-[#1C1917] hover:text-[#8C2D19] flex items-center gap-1.5"
                >
                  <span>Read full story summary</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleSave(leadStory); }}
                    className={`p-1.5 rounded transition-colors ${
                      savedItemIds.has(leadStory.id) || savedItemIds.has(leadStory.articleId)
                        ? 'text-[#8C2D19] bg-[#8C2D19]/10'
                        : 'text-[#78716C] hover:text-[#1C1917]'
                    }`}
                    title="Bookmark story"
                  >
                    <Bookmark className="w-4 h-4" fill={savedItemIds.has(leadStory.id) || savedItemIds.has(leadStory.articleId) ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); onLikeStory(leadStory); }}
                    className={`p-1.5 rounded transition-colors ${
                      likedItemIds.has(leadStory.articleId) ? 'text-green-700 bg-green-50 animate-like-pop' : 'text-[#78716C] hover:text-[#1C1917]'
                    }`}
                    title="More like this"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" fill={likedItemIds.has(leadStory.articleId) ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); onDislikeStory(leadStory); }}
                    className={`p-1.5 rounded transition-colors ${
                      dislikedItemIds.has(leadStory.articleId) ? 'text-red-700 bg-red-50 animate-like-pop' : 'text-[#78716C] hover:text-[#1C1917]'
                    }`}
                    title="Fewer like this"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" fill={dislikedItemIds.has(leadStory.articleId) ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); onSkipItem(leadStory); }}
                    className="p-1.5 text-[#78716C] hover:text-[#1C1917] rounded"
                    title="Skip story"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={leadStory.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-[#78716C] hover:text-[#1C1917]"
                    title="Original reporting at publisher"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </article>
          )}

          {/* SECONDARY STORIES GRID (Sketch 2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {secondaryStories.map((item: EditionItem, idx: number) => {
              const isSaved = savedItemIds.has(item.id) || savedItemIds.has(item.articleId);
              const isLiked = likedItemIds.has(item.articleId);
              const isDisliked = dislikedItemIds.has(item.articleId);

              return (
                <article
                  key={item.id || idx}
                  className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-lg p-5 flex flex-col justify-between hover:border-[#1C1917] transition-all group"
                >
                  <div className="space-y-3">
                    {item.imageUrl && (
                      <div className="w-full h-44 overflow-hidden rounded bg-[#FAF9F6] mb-2">
                        <img
                          src={item.imageUrl}
                          alt={item.headline}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          loading="lazy"
                          onError={e => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-[#78716C]">
                      <span className="font-semibold text-[#8C2D19] uppercase tracking-wider text-[10px]">
                        {item.section}
                      </span>
                      <span className="text-[11px] font-medium">{item.publisher}</span>
                    </div>

                    <h3
                      onClick={() => onOpenReader(item)}
                      className="text-lg font-serif font-bold text-[#1C1917] group-hover:text-[#8C2D19] transition-colors leading-snug cursor-pointer"
                    >
                      {item.headline}
                    </h3>

                    <p className="text-xs text-[#78716C] line-clamp-3 leading-relaxed">
                      {item.briefSummary}
                    </p>

                    {item.selectionReason && (
                      <div className="pt-2">
                        <span className="inline-block text-[10px] text-[#78716C] bg-[#FAF9F6] border border-[#E7E5E4] px-2 py-0.5 rounded">
                          {item.selectionReason}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#E7E5E4] flex items-center justify-between text-xs">
                    <button
                      onClick={() => onOpenReader(item)}
                      className="font-medium text-[#1C1917] hover:text-[#8C2D19] flex items-center gap-1"
                    >
                      <span>Read summary</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleSave(item); }}
                        className={`p-1.5 rounded transition-colors ${
                          isSaved ? 'text-[#8C2D19] bg-[#8C2D19]/10' : 'text-[#78716C] hover:text-[#1C1917]'
                        }`}
                        title="Bookmark story"
                      >
                        <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); onLikeStory(item); }}
                        className={`p-1.5 rounded transition-colors ${
                          isLiked ? 'text-green-700 bg-green-50 animate-like-pop' : 'text-[#78716C] hover:text-[#1C1917]'
                        }`}
                        title="More like this"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" fill={isLiked ? 'currentColor' : 'none'} />
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); onDislikeStory(item); }}
                        className={`p-1.5 rounded transition-colors ${
                          isDisliked ? 'text-red-700 bg-red-50 animate-like-pop' : 'text-[#78716C] hover:text-[#1C1917]'
                        }`}
                        title="Fewer like this"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" fill={isDisliked ? 'currentColor' : 'none'} />
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); onSkipItem(item); }}
                        className="p-1.5 text-[#78716C] hover:text-[#1C1917] rounded"
                        title="Skip story"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>

                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-[#78716C] hover:text-[#1C1917]"
                        title="Original reporting at publisher"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};
