import React, { useState } from 'react';
import {
  Search,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  EyeOff,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Check,
  AlertCircle,
  HelpCircle,
  Clock,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import { Article, QueryInterpretation, UserProfile } from '../../shared/types.ts';

interface SearchResultsViewProps {
  query: string;
  interpretation: QueryInterpretation | null;
  articles: Article[];
  isLoading: boolean;
  onSearch: (newQuery: string) => void;
  onFollowInterest: (interest: string) => void;
  isFollowingInterest: boolean;
  profile: UserProfile | null;
  onOpenReader: (article: Article) => void;
  onToggleSave: (article: Article) => void;
  savedItemIds: Set<string>;
  onLikeStory: (article: Article) => void;
  onDislikeStory: (article: Article) => void;
  onSkipStory: (article: Article) => void;
  likedItemIds: Set<string>;
  dislikedItemIds: Set<string>;
  skippedItemIds: Set<string>;
}

export const SearchResultsView: React.FC<SearchResultsViewProps> = ({
  query,
  interpretation,
  articles,
  isLoading,
  onSearch,
  onFollowInterest,
  isFollowingInterest,
  profile,
  onOpenReader,
  onToggleSave,
  savedItemIds,
  onLikeStory,
  onDislikeStory,
  onSkipStory,
  likedItemIds,
  dislikedItemIds,
  skippedItemIds,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [isEditingInterp, setIsEditingInterp] = useState(false);
  const [customInterpQuery, setCustomInterpQuery] = useState(query);

  const visibleArticles = articles.filter(art => {
    if (skippedItemIds.has(art.id)) return false;
    if (selectedTopic !== 'all' && art.topic !== selectedTopic) return false;
    return true;
  });

  const availableTopics = Array.from(new Set(articles.map(a => a.topic)));

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInterpQuery.trim()) {
      setIsEditingInterp(false);
      onSearch(customInterpQuery.trim());
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      {/* Header Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#78716C] mb-6 border-b border-[#E7E5E4] pb-3">
        <span>Daybreak Search</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#1C1917] font-medium truncate max-w-md">“{query}”</span>
        <span className="text-[#A8A29E] ml-auto">
          {articles.length} verified reporting results found
        </span>
      </div>

      {/* TWO-COLUMN LAYOUT (Sketch 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Results Navigation & Interpretation Details (Desktop: 4 cols) */}
        <aside className="lg:col-span-4 space-y-6 bg-[#FFFFFF] border border-[#E7E5E4] rounded-lg p-5 sticky top-20">
          {/* Query Summary & Follow */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-semibold text-[#8C2D19] uppercase tracking-wider">
                Inquiry Breakdown
              </span>
              <button
                onClick={() => setIsEditingInterp(!isEditingInterp)}
                className="text-[11px] text-[#78716C] hover:text-[#1C1917] underline"
              >
                {isEditingInterp ? 'Cancel' : 'Edit Query'}
              </button>
            </div>

            {isEditingInterp ? (
              <form onSubmit={handleEditSubmit} className="space-y-3 mt-2">
                <input
                  type="text"
                  value={customInterpQuery}
                  onChange={e => setCustomInterpQuery(e.target.value)}
                  className="w-full text-xs p-2.5 border border-[#1C1917] rounded bg-[#FAF9F6] focus:outline-none"
                  placeholder="Refine topics or keywords..."
                />
                <button
                  type="submit"
                  className="w-full py-1.5 bg-[#1C1917] text-[#FAF9F6] text-xs rounded hover:bg-[#8C2D19] transition-colors"
                >
                  Update Results
                </button>
              </form>
            ) : (
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1C1917] leading-tight mb-2">
                  “{query}”
                </h3>
                {interpretation?.summary && (
                  <p className="text-xs text-[#78716C] leading-relaxed mb-4">
                    {interpretation.summary}
                  </p>
                )}
              </div>
            )}

            {/* Follow Interest Button */}
            <div className="pt-3 border-t border-[#E7E5E4]">
              <button
                onClick={() => onFollowInterest(query)}
                disabled={isFollowingInterest}
                className={`w-full py-2 px-3 rounded text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  isFollowingInterest
                    ? 'bg-[#E7E5E4] text-[#78716C] cursor-default'
                    : 'bg-[#1C1917] text-[#FAF9F6] hover:bg-[#8C2D19]'
                }`}
              >
                {isFollowingInterest ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    <span>Followed in Your Morning Paper</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#FAF9F6]" />
                    <span>Follow this interest in morning papers</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-[#A8A29E] mt-1.5 text-center">
                Future daily editions will include reporting matching this signal.
              </p>
            </div>
          </div>

          {/* Ambiguity or Clarification Note */}
          {interpretation?.isAmbiguous && (
            <div className="p-3 bg-[#FAF9F6] border border-[#D6D3D1] rounded text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#8C2D19] font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Interpretation Note</span>
              </div>
              <p className="text-[#78716C] text-[11px] leading-relaxed">
                {interpretation.clarificationNote || 'This query can have multiple meanings. We prioritized the most common news entity.'}
              </p>
            </div>
          )}

          {/* Parsed Signals */}
          {interpretation && (
            <div className="space-y-3 pt-3 border-t border-[#E7E5E4] text-xs">
              <span className="font-semibold text-[#1C1917] uppercase tracking-wider text-[10px]">
                Detected Signals
              </span>

              {interpretation.parsedTopics.length > 0 && (
                <div>
                  <span className="text-[#A8A29E] text-[11px] block mb-1">Topics:</span>
                  <div className="flex flex-wrap gap-1">
                    {interpretation.parsedTopics.map((t: string) => (
                      <span key={t} className="px-2 py-0.5 rounded bg-[#FAF9F6] border border-[#E7E5E4] text-[11px] text-[#1C1917]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {interpretation.parsedPlaces.length > 0 && (
                <div>
                  <span className="text-[#A8A29E] text-[11px] block mb-1">Places:</span>
                  <div className="flex flex-wrap gap-1">
                    {interpretation.parsedPlaces.map((p: string) => (
                      <span key={p} className="px-2 py-0.5 rounded bg-[#FAF9F6] border border-[#E7E5E4] text-[11px] text-[#8C2D19] font-medium">
                        📍 {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {interpretation.parsedEntities.length > 0 && (
                <div>
                  <span className="text-[#A8A29E] text-[11px] block mb-1">Entities:</span>
                  <div className="flex flex-wrap gap-1">
                    {interpretation.parsedEntities.map((e: string) => (
                      <span key={e} className="px-2 py-0.5 rounded bg-[#FAF9F6] border border-[#E7E5E4] text-[11px] text-[#1C1917]">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section Filter */}
          {availableTopics.length > 1 && (
            <div className="pt-3 border-t border-[#E7E5E4] space-y-2">
              <span className="text-[10px] font-semibold text-[#1C1917] uppercase tracking-wider block">
                Filter by Section
              </span>
              <div className="flex flex-col gap-1 text-xs">
                <button
                  onClick={() => setSelectedTopic('all')}
                  className={`text-left px-2.5 py-1.5 rounded transition-colors ${
                    selectedTopic === 'all'
                      ? 'bg-[#1C1917] text-[#FAF9F6] font-medium'
                      : 'text-[#78716C] hover:bg-[#FAF9F6] hover:text-[#1C1917]'
                  }`}
                >
                  All Sections ({articles.length})
                </button>
                {availableTopics.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTopic(t)}
                    className={`text-left px-2.5 py-1.5 rounded transition-colors ${
                      selectedTopic === t
                        ? 'bg-[#1C1917] text-[#FAF9F6] font-medium'
                        : 'text-[#78716C] hover:bg-[#FAF9F6] hover:text-[#1C1917]'
                    }`}
                  >
                    {t} ({articles.filter(a => a.topic === t).length})
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT COLUMN: Story Cards in Responsive Grid (Desktop: 8 cols) */}
        <main className="lg:col-span-8 space-y-6">
          {isLoading ? (
            <div className="py-20 text-center bg-[#FFFFFF] border border-[#E7E5E4] rounded-lg p-8">
              <div className="w-10 h-10 border-2 border-[#1C1917] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-serif font-bold text-[#1C1917] mb-1">
                Searching verified reporting...
              </h3>
              <p className="text-xs text-[#78716C]">
                Scanning supported RSS sources and news feeds for “{query}”
              </p>
            </div>
          ) : visibleArticles.length === 0 ? (
            <div className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-lg p-8 sm:p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#D6D3D1] text-[#78716C] flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#1C1917]">
                No verified reporting found for “{query}”
              </h3>
              <p className="text-sm text-[#78716C] max-w-lg mx-auto leading-relaxed">
                Daybreak never invents news or hallucinates claims merely to satisfy a request. Currently, no matching reporting was returned from our supported global publishers.
              </p>

              {interpretation?.suggestedQueries && interpretation.suggestedQueries.length > 0 && (
                <div className="pt-4">
                  <span className="text-xs text-[#78716C] block mb-2">Try a broader inquiry:</span>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {interpretation.suggestedQueries.map((sq: string) => (
                      <button
                        key={sq}
                        onClick={() => onSearch(sq)}
                        className="px-3 py-1.5 rounded bg-[#FAF9F6] border border-[#D6D3D1] hover:border-[#1C1917] text-xs text-[#1C1917] transition-all"
                      >
                        {sq}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visibleArticles.map((art, idx) => {
                const isSaved = savedItemIds.has(art.id);
                const isLiked = likedItemIds.has(art.id);
                const isDisliked = dislikedItemIds.has(art.id);

                return (
                  <article
                    key={`${art.id || 'art'}-${idx}`}
                    className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-lg p-5 flex flex-col justify-between hover:border-[#1C1917] transition-all group"
                  >
                    <div className="space-y-3">
                      {art.imageUrl && (
                        <div className="w-full h-44 overflow-hidden rounded bg-[#FAF9F6] mb-2">
                          <img
                            src={art.imageUrl}
                            alt={art.headline}
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
                          {art.topic}
                        </span>
                        <span className="text-[11px] font-medium">{art.publisher}</span>
                      </div>

                      <h3
                        onClick={() => onOpenReader(art)}
                        className="text-lg font-serif font-bold text-[#1C1917] group-hover:text-[#8C2D19] transition-colors leading-snug cursor-pointer"
                      >
                        {art.headline}
                      </h3>

                      <p className="text-xs text-[#78716C] line-clamp-3 leading-relaxed">
                        {art.briefSummary || art.excerpt}
                      </p>

                      {art.relevanceReason && (
                        <div className="pt-2">
                          <span className="inline-block text-[10px] text-[#78716C] bg-[#FAF9F6] border border-[#E7E5E4] px-2 py-0.5 rounded">
                            {art.relevanceReason}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#E7E5E4] flex items-center justify-between text-xs">
                      <button
                        onClick={() => onOpenReader(art)}
                        className="font-medium text-[#1C1917] hover:text-[#8C2D19] flex items-center gap-1"
                      >
                        <span>Read summary</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleSave(art); }}
                          className={`p-1.5 rounded transition-colors ${
                            isSaved ? 'text-[#8C2D19] bg-[#8C2D19]/10' : 'text-[#78716C] hover:text-[#1C1917]'
                          }`}
                          title={isSaved ? 'Remove bookmark' : 'Bookmark story'}
                        >
                          <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                        </button>

                        <button
                          onClick={(e) => { e.stopPropagation(); onLikeStory(art); }}
                          className={`p-1.5 rounded transition-colors ${
                            isLiked ? 'text-green-700 bg-green-50 animate-like-pop' : 'text-[#78716C] hover:text-[#1C1917]'
                          }`}
                          title="More stories like this"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" fill={isLiked ? 'currentColor' : 'none'} />
                        </button>

                        <button
                          onClick={(e) => { e.stopPropagation(); onDislikeStory(art); }}
                          className={`p-1.5 rounded transition-colors ${
                            isDisliked ? 'text-red-700 bg-red-50 animate-like-pop' : 'text-[#78716C] hover:text-[#1C1917]'
                          }`}
                          title="Fewer stories like this"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" fill={isDisliked ? 'currentColor' : 'none'} />
                        </button>

                        <button
                          onClick={(e) => { e.stopPropagation(); onSkipStory(art); }}
                          className="p-1.5 text-[#78716C] hover:text-[#1C1917] rounded"
                          title="Skip story"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={art.canonicalUrl}
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
          )}
        </main>
      </div>
    </div>
  );
};
