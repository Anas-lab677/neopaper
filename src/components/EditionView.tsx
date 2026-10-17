import React, { useState } from 'react';
import {
  FileText,
  Download,
  Search,
  Bookmark,
  EyeOff,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  Send,
  Leaf,
  CheckCircle2,
} from 'lucide-react';
import { Edition, EditionItem, Topic, UserProfile } from '../../shared/types.ts';

interface EditionViewProps {
  edition: Edition | null;
  profile: UserProfile | null;
  onOpenReader: (item: EditionItem) => void;
  onToggleSave: (item: EditionItem) => void;
  savedItemIds: Set<string>;
  onSkipItem: (item: EditionItem) => void;
  skippedItemIds: Set<string>;
  onFeedback: (item: EditionItem, type: 'more' | 'less') => void;
  feedbackMap: Record<string, 'more' | 'less'>;
  onRefreshEdition: () => Promise<void>;
  isRefreshing: boolean;
  onOpenPdfPreview: () => void;
  onDownloadPdf: () => void;
  onSaveReflection: (note: string) => Promise<void>;
}

export const EditionView: React.FC<EditionViewProps> = ({
  edition,
  profile,
  onOpenReader,
  onToggleSave,
  savedItemIds,
  onSkipItem,
  skippedItemIds,
  onFeedback,
  feedbackMap,
  onRefreshEdition,
  isRefreshing,
  onOpenPdfPreview,
  onDownloadPdf,
  onSaveReflection,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all');
  const [reflectionInput, setReflectionInput] = useState(edition?.reflectionNote || '');
  const [reflectionSaved, setReflectionSaved] = useState(false);

  if (!edition) {
    return (
      <div className="py-20 text-center max-w-md mx-auto px-4">
        <div className="w-12 h-12 rounded-full bg-[#B65B3D]/10 text-[#B65B3D] flex items-center justify-center mx-auto mb-4 animate-pulse">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <h3 className="text-2xl font-serif font-bold text-[#252B27] mb-2">Preparing your edition</h3>
        <p className="text-sm text-[#616962]">
          Gathering verified reporting from your selected topics...
        </p>
      </div>
    );
  }

  // Check if any publishers experienced partial errors
  const failedPublishers = Object.entries(edition.publisherStatus || {}).filter(
    ([_, stat]) => !stat.ok
  );

  // Filter items (skip temporary hidden stories from view)
  const visibleItems = edition.items.filter(item => {
    if (skippedItemIds.has(item.id)) return false;
    if (selectedTopicFilter !== 'all' && item.section !== selectedTopicFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = item.headline.toLowerCase().includes(q);
      const matchesBrief = item.briefSummary.toLowerCase().includes(q);
      const matchesPub = item.publisher.toLowerCase().includes(q);
      return matchesTitle || matchesBrief || matchesPub;
    }
    return true;
  });

  const leadItem = visibleItems[0];
  const secondaryItems = visibleItems.slice(1);

  // Available topic filters from current edition items
  const availableTopics = Array.from(new Set(edition.items.map(i => i.section)));

  const handleReflectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionInput.trim()) return;
    await onSaveReflection(reflectionInput.trim());
    setReflectionSaved(true);
    setTimeout(() => setReflectionSaved(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      {/* 1. Header Deck & Personalized Greeting */}
      <div className="border-b border-[#E5DFD3] pb-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#616962] font-semibold mb-1">
              <span>{edition.formattedDate}</span>
              <span className="mx-2">·</span>
              <span>Your {edition.readingTimeMinutes}-minute edition</span>
              <span className="mx-2">·</span>
              <span>Rev {edition.revision}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#252B27] tracking-tight">
              Good morning, {profile?.name || 'Reader'}.
            </h1>
            <p className="font-serif italic text-base sm:text-lg text-[#616962] mt-1">
              A little perspective for your day.
            </p>
          </div>

          {/* Action strip: Preview newspaper & Download PDF */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenPdfPreview}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded border border-[#E5DFD3] bg-white text-[#252B27] hover:bg-[#FCFAF6] transition-colors shadow-xs"
            >
              <FileText className="w-4 h-4 text-[#B65B3D]" />
              <span>Preview newspaper</span>
            </button>

            <button
              onClick={onDownloadPdf}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-[#B65B3D] text-white hover:bg-[#9D4B31] transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={onRefreshEdition}
              disabled={isRefreshing}
              className="p-2 text-xs rounded border border-[#E5DFD3] bg-white text-[#616962] hover:text-[#252B27] transition-colors disabled:opacity-50"
              title="Regenerate fresh edition with latest signals"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 2. Partial feed notice banner if any publisher failed */}
        {failedPublishers.length > 0 && (
          <div className="mt-4 p-3 rounded bg-[#FFF7ED] border border-[#FDBA74] flex items-center justify-between gap-3 text-xs text-[#9A3412]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#C2410C]" />
              <span>
                <strong>Some publishers are unavailable:</strong> {failedPublishers.map(([name]) => name).join(', ')}. Your paper includes {edition.items.length} stories from active sources.
              </span>
            </div>
            <button
              onClick={onRefreshEdition}
              className="px-2.5 py-1 rounded bg-[#C2410C] text-white hover:bg-[#9A3412] font-medium shrink-0"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {/* 3. Search & In-edition Topic Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-8">
        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedTopicFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
              selectedTopicFilter === 'all'
                ? 'bg-[#252B27] text-white font-semibold'
                : 'bg-white border border-[#E5DFD3] text-[#616962] hover:text-[#252B27]'
            }`}
          >
            For you
          </button>
          {availableTopics.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTopicFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                selectedTopicFilter === t
                  ? 'bg-[#252B27] text-white font-semibold'
                : 'bg-white border border-[#E5DFD3] text-[#616962] hover:text-[#252B27]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search within edition */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#616962]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search today's stories..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E5DFD3] rounded focus:outline-none focus:border-[#B65B3D]"
          />
        </div>
      </div>

      {/* 4. Lead Story (Visually prominent anchor) */}
      {leadItem && (
        <article className="border-b-2 border-[#252B27] pb-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#B65B3D] uppercase tracking-wider">
                <span>{leadItem.section}</span>
                <span className="text-[#E5DFD3]">·</span>
                <span className="text-[#616962] font-normal">{leadItem.publisher}</span>
                <span className="text-[#E5DFD3]">·</span>
                <span className="text-[#616962] font-normal">
                  {new Date(leadItem.publishedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>

              <h2
                onClick={() => onOpenReader(leadItem)}
                className="text-2xl sm:text-4xl font-serif font-bold text-[#252B27] leading-tight hover:text-[#B65B3D] cursor-pointer transition-colors"
              >
                {leadItem.headline}
              </h2>

              <p className="font-serif text-base sm:text-lg text-[#252B27] leading-relaxed">
                {leadItem.briefSummary}
              </p>

              {/* Selection reason */}
              <div className="text-xs text-[#7D8B72] font-medium flex items-center gap-1.5 pt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7D8B72]" />
                <span>{leadItem.selectionReason}</span>
              </div>

              {/* Actions strip */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => onOpenReader(leadItem)}
                  className="text-xs font-semibold text-[#B65B3D] hover:underline flex items-center gap-1"
                >
                  <span>Read brief →</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleSave(leadItem)}
                    className={`p-1.5 rounded border text-xs transition-colors ${
                      savedItemIds.has(leadItem.id)
                        ? 'bg-[#B65B3D] text-white border-[#B65B3D]'
                        : 'bg-white text-[#616962] border-[#E5DFD3] hover:text-[#252B27]'
                    }`}
                    title={savedItemIds.has(leadItem.id) ? 'Saved' : 'Save story'}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onFeedback(leadItem, 'more')}
                    className={`p-1.5 rounded border text-xs transition-colors ${
                      feedbackMap[leadItem.id] === 'more'
                        ? 'bg-[#7D8B72] text-white border-[#7D8B72]'
                        : 'bg-white text-[#616962] border-[#E5DFD3] hover:text-[#252B27]'
                    }`}
                    title="More like this"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onFeedback(leadItem, 'less')}
                    className={`p-1.5 rounded border text-xs transition-colors ${
                      feedbackMap[leadItem.id] === 'less'
                        ? 'bg-[#B65B3D] text-white border-[#B65B3D]'
                        : 'bg-white text-[#616962] border-[#E5DFD3] hover:text-[#252B27]'
                    }`}
                    title="Less like this"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onSkipItem(leadItem)}
                    className="p-1.5 rounded border border-[#E5DFD3] bg-white text-[#616962] hover:text-[#B65B3D]"
                    title="Skip from today's paper"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Lead Story Image */}
            {leadItem.imageUrl && (
              <div
                onClick={() => onOpenReader(leadItem)}
                className="lg:col-span-5 h-64 sm:h-72 rounded overflow-hidden bg-[#E5DFD3]/40 cursor-pointer group"
              >
                <img
                  src={leadItem.imageUrl}
                  alt={leadItem.headline}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
          </div>
        </article>
      )}

      {/* 5. Secondary Stories Grid (Clean hairline dividers) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {secondaryItems.map(item => {
          const isDiscovery = item.section === 'Discovery';
          return (
            <article
              key={item.id}
              className={`flex flex-col justify-between border-b border-[#E5DFD3] pb-6 ${
                isDiscovery ? 'bg-[#FCFAF6] p-4 rounded border border-[#E5DFD3]' : ''
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
                  <span className={isDiscovery ? 'text-[#7D8B72] flex items-center gap-1' : 'text-[#B65B3D]'}>
                    {isDiscovery && <Leaf className="w-3 h-3" />}
                    {item.section}
                  </span>
                  <span className="text-[#616962] font-normal">{item.publisher}</span>
                </div>

                <h3
                  onClick={() => onOpenReader(item)}
                  className="font-serif font-bold text-lg sm:text-xl text-[#252B27] leading-snug hover:text-[#B65B3D] cursor-pointer transition-colors line-clamp-3"
                >
                  {item.headline}
                </h3>

                {item.imageUrl && !isDiscovery && (
                  <div
                    onClick={() => onOpenReader(item)}
                    className="w-full h-36 rounded overflow-hidden bg-[#E5DFD3]/40 my-2 cursor-pointer"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.headline}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                )}

                <p className="font-serif text-sm text-[#252B27] leading-relaxed line-clamp-3">
                  {item.briefSummary}
                </p>

                <p className="text-[11px] text-[#7D8B72] italic line-clamp-1">
                  {item.selectionReason}
                </p>
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#E5DFD3]/60">
                <button
                  onClick={() => onOpenReader(item)}
                  className="text-xs font-semibold text-[#B65B3D] hover:underline"
                >
                  Read brief →
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onToggleSave(item)}
                    className={`p-1 rounded text-xs transition-colors ${
                      savedItemIds.has(item.id)
                        ? 'text-[#B65B3D]'
                        : 'text-[#616962] hover:text-[#252B27]'
                    }`}
                    title="Save story"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onFeedback(item, 'more')}
                    className={`p-1 rounded text-xs transition-colors ${
                      feedbackMap[item.id] === 'more'
                        ? 'text-[#7D8B72] font-bold'
                        : 'text-[#616962] hover:text-[#252B27]'
                    }`}
                    title="More like this"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onFeedback(item, 'less')}
                    className={`p-1 rounded text-xs transition-colors ${
                      feedbackMap[item.id] === 'less'
                        ? 'text-[#B65B3D] font-bold'
                        : 'text-[#616962] hover:text-[#252B27]'
                    }`}
                    title="Less like this"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onSkipItem(item)}
                    className="p-1 text-[#616962] hover:text-[#B65B3D]"
                    title="Skip story"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* 6. Closing Ritual: "Three Things to Take Into Today" & Reflection */}
      <section className="border-t-2 border-[#252B27] pt-8 mt-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#7D8B72] block mb-1">
              End of Edition Recap
            </span>
            <h2 className="text-3xl font-serif font-bold text-[#252B27]">
              Three things to take into <span className="italic font-normal">today.</span>
            </h2>
            <p className="text-sm text-[#616962] mt-1">
              Key takeaways distilled from your morning's reporting.
            </p>
          </div>

          <div className="space-y-4 mb-10">
            {edition.recapTakeaways.map((rt, idx) => (
              <div
                key={rt.id}
                className="p-4 rounded border border-[#E5DFD3] bg-white shadow-2xs flex items-start gap-4"
              >
                <span className="w-7 h-7 rounded-full bg-[#EDF2EB] text-[#7D8B72] text-xs font-bold flex items-center justify-center shrink-0">
                  0{idx + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-serif font-semibold text-sm text-[#252B27]">
                      {rt.title}
                    </span>
                    <span className="text-[#E5DFD3]">·</span>
                    <span className="text-[11px] text-[#616962]">{rt.publisher}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#252B27] leading-relaxed">
                    {rt.takeaway}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Daily Reflection Box */}
          <div className="p-6 rounded-lg bg-[#FCFAF6] border border-[#E5DFD3] text-center mb-8">
            <h3 className="font-serif italic text-lg sm:text-xl text-[#252B27] mb-1">
              “What is one thing you want to remember today?”
            </h3>
            <p className="text-xs text-[#616962] mb-4">
              A private reflection saved to your journal to help you retain what you learned.
            </p>

            <form onSubmit={handleReflectionSubmit} className="flex gap-2 max-w-lg mx-auto">
              <input
                type="text"
                value={reflectionInput}
                onChange={e => setReflectionInput(e.target.value)}
                placeholder="Write your thought for the day..."
                className="flex-1 px-3 py-2 text-xs bg-white border border-[#E5DFD3] rounded focus:outline-none focus:border-[#B65B3D]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#252B27] hover:bg-black text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors"
              >
                <span>Save</span>
                <Send className="w-3 h-3" />
              </button>
            </form>

            {reflectionSaved && (
              <p className="text-xs text-[#7D8B72] font-medium mt-2 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Reflection saved to your private journal.</span>
              </p>
            )}
          </div>

          {/* Ending Masthead Signature */}
          <div className="text-center py-6 text-xs text-[#616962]">
            <p className="font-serif italic text-sm text-[#252B27] mb-1">
              You have finished today's paper.
            </p>
            <p>A little perspective. A world of possibility. Your morning, made personal.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
