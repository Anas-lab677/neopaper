import React, { useState } from 'react';
import { Bookmark, ExternalLink, ArrowRight, Trash2, BookOpen } from 'lucide-react';
import { EditionItem, SavedArticleRecord } from '../../shared/types.ts';

interface SavedViewProps {
  savedList: SavedArticleRecord[];
  onOpenReader: (item: EditionItem) => void;
  onRemoveSaved: (item: EditionItem) => void;
  onSelectTab: (tab: string) => void;
}

export const SavedView: React.FC<SavedViewProps> = ({
  savedList,
  onOpenReader,
  onRemoveSaved,
  onSelectTab,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  const topics: string[] = Array.from(new Set(savedList.map((r: SavedArticleRecord) => String(r.item.section))));

  const filtered = savedList.filter((r: SavedArticleRecord) => {
    if (selectedTopic !== 'all' && String(r.item.section) !== selectedTopic) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#1C1917] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8C2D19] font-semibold">Personal Library</span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1C1917] tracking-tight">
            Saved Stories & Bookmarks
          </h1>
          <p className="text-xs text-[#78716C] mt-1">
            Articles you have saved from your daily broadsheets and custom inquiries.
          </p>
        </div>

        {savedList.length > 0 && (
          <span className="text-xs text-[#78716C]">
            {savedList.length} {savedList.length === 1 ? 'article' : 'articles'} in your archive
          </span>
        )}
      </div>

      {/* Filter if multiple sections */}
      {topics.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
          <button
            onClick={() => setSelectedTopic('all')}
            className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition-all ${
              selectedTopic === 'all'
                ? 'bg-[#1C1917] text-[#FAF9F6] border-[#1C1917] font-medium'
                : 'bg-[#FFFFFF] border-[#E7E5E4] text-[#78716C] hover:border-[#1C1917]'
            }`}
          >
            All Bookmarks ({savedList.length})
          </button>
          {topics.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition-all ${
                selectedTopic === t
                  ? 'bg-[#1C1917] text-[#FAF9F6] border-[#1C1917] font-medium'
                  : 'bg-[#FFFFFF] border-[#E7E5E4] text-[#78716C] hover:border-[#1C1917]'
              }`}
            >
              {t} ({savedList.filter(r => String(r.item.section) === t).length})
            </button>
          ))}
        </div>
      )}

      {/* Empty State for Fresh Real Account */}
      {savedList.length === 0 ? (
        <div className="py-24 text-center bg-[#FFFFFF] border border-[#E7E5E4] rounded-lg p-8 max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#D6D3D1] text-[#78716C] flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#1C1917]">
            Your library is empty
          </h3>
          <p className="text-xs text-[#78716C] leading-relaxed">
            You haven't bookmarked any stories yet. As you read your daily paper or run inquiries, click the bookmark icon to save articles here for long-term reading.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onSelectTab('today')}
              className="px-5 py-2.5 bg-[#1C1917] text-[#FAF9F6] hover:bg-[#8C2D19] rounded text-xs font-medium transition-colors inline-flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore Today's Paper</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(record => {
            const item = record.item;
            return (
              <article
                key={record.id}
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

                  <p className="text-[10px] text-[#A8A29E]">
                    Saved on {new Date(record.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#E7E5E4] flex items-center justify-between text-xs">
                  <button
                    onClick={() => onOpenReader(item)}
                    className="font-medium text-[#1C1917] hover:text-[#8C2D19] flex items-center gap-1"
                  >
                    <span>Read summary</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onRemoveSaved(item)}
                      className="p-1.5 text-[#78716C] hover:text-[#8C2D19] rounded transition-colors"
                      title="Remove from bookmarks"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <a
                      href={item.sourceUrl}
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
