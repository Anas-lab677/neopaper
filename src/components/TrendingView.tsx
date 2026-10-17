import React, { useState } from 'react';
import { Search, Bookmark, ExternalLink, ArrowRight, Sparkles } from 'lucide-react';
import { Article, Topic } from '../../shared/types.ts';

interface TrendingViewProps {
  articles: Article[];
  onOpenReader: (article: Article) => void;
  onToggleSave: (article: Article) => void;
  savedItemIds: Set<string>;
}

export const TrendingView: React.FC<TrendingViewProps> = ({
  articles,
  onOpenReader,
  onToggleSave,
  savedItemIds,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [filterText, setFilterText] = useState('');

  const topics: (Topic | 'all')[] = [
    'all',
    'World',
    'Technology',
    'Science',
    'Climate & Environment',
    'Business',
    'Arts & Culture',
    'Sports',
    'Good News',
  ];

  const filteredArticles = articles.filter(art => {
    if (selectedTopic !== 'all' && art.topic !== selectedTopic) return false;
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      return (
        art.headline.toLowerCase().includes(q) ||
        art.excerpt.toLowerCase().includes(q) ||
        art.publisher.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#1C1917] pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8C2D19] font-semibold">Live Wire</span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1C1917] tracking-tight">
            Trending Stories Across the Wire
          </h1>
          <p className="text-xs text-[#78716C] mt-1">
            Real reporting aggregated in real time from Daybreak's verified publisher allowlist.
          </p>
        </div>

        {/* Filter Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-2.5" />
          <input
            type="text"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            placeholder="Filter trending stories..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-[#FFFFFF] border border-[#D6D3D1] rounded focus:border-[#1C1917] focus:outline-none"
          />
        </div>
      </div>

      {/* Topic Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
        {topics.map(t => {
          const isActive = selectedTopic === t;
          return (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#1C1917] text-[#FAF9F6] border-[#1C1917] font-medium'
                  : 'bg-[#FFFFFF] border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917] hover:border-[#1C1917]'
              }`}
            >
              {t === 'all' ? 'All Wire Stories' : t}
            </button>
          );
        })}
      </div>

      {/* Grid of Articles */}
      {filteredArticles.length === 0 ? (
        <div className="py-20 text-center bg-[#FFFFFF] border border-[#E7E5E4] rounded-lg">
          <p className="text-sm text-[#78716C]">No trending stories match your current filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((art, idx) => {
            const isSaved = savedItemIds.has(art.id);
            return (
              <article
                key={`${art.id || 'art'}-${idx}`}
                className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-lg p-5 flex flex-col justify-between hover:border-[#1C1917] transition-all group animate-fade-in-up"
                style={{ animationDelay: `${idx * 60}ms` }}
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
                </div>

                <div className="pt-4 mt-4 border-t border-[#E7E5E4] flex items-center justify-between text-xs">
                  <button
                    onClick={() => onOpenReader(art)}
                    className="font-medium text-[#1C1917] hover:text-[#8C2D19] flex items-center gap-1"
                  >
                    <span>Read summary</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleSave(art); }}
                      className={`p-1.5 rounded transition-colors ${
                        isSaved ? 'text-[#8C2D19] bg-[#8C2D19]/10' : 'text-[#78716C] hover:text-[#1C1917]'
                      }`}
                      title="Bookmark story"
                    >
                      <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                    <a
                      href={art.canonicalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-[#78716C] hover:text-[#1C1917]"
                      title="Read original at publisher"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
