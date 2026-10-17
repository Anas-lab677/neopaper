import React, { useState } from 'react';
import { Bookmark, ExternalLink, Trash2, Search, ArrowRight } from 'lucide-react';
import { EditionItem, SavedArticleRecord } from '../../shared/types.ts';

interface SavedViewProps {
  savedList: SavedArticleRecord[];
  onOpenReader: (item: EditionItem) => void;
  onRemoveSaved: (item: EditionItem) => void;
}

export const SavedView: React.FC<SavedViewProps> = ({
  savedList,
  onOpenReader,
  onRemoveSaved,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');

  const filtered = savedList.filter(record => {
    const item = record.item;
    if (topicFilter !== 'all' && item.section !== topicFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = item.headline.toLowerCase().includes(q);
      const matchesPub = item.publisher.toLowerCase().includes(q);
      const matchesBrief = item.briefSummary.toLowerCase().includes(q);
      return matchesTitle || matchesPub || matchesBrief;
    }
    return true;
  });

  const topics = Array.from(new Set(savedList.map(s => s.item.section)));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="border-b border-[#E5DFD3] pb-6 mb-8">
        <span className="text-xs uppercase tracking-widest text-[#B65B3D] font-bold block mb-1">
          Saved Stories
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#252B27]">
          For a <span className="italic font-normal">slower moment.</span>
        </h1>
        <p className="text-sm text-[#616962] mt-1">
          The stories you chose to keep. Saving a story won't change your original editions.
        </p>

        {/* Search & Topic Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#616962]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search saved stories..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E5DFD3] rounded focus:outline-none focus:border-[#B65B3D]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setTopicFilter('all')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                topicFilter === 'all'
                  ? 'bg-[#B65B3D] text-white font-medium'
                  : 'bg-white border border-[#E5DFD3] text-[#616962] hover:text-[#252B27]'
              }`}
            >
              All
            </button>
            {topics.map(t => (
              <button
                key={t}
                onClick={() => setTopicFilter(t)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  topicFilter === t
                    ? 'bg-[#B65B3D] text-white font-medium'
                    : 'bg-white border border-[#E5DFD3] text-[#616962] hover:text-[#252B27]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stories list */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map(record => {
            const item = record.item;
            return (
              <div
                key={record.id}
                className="bg-white border border-[#E5DFD3] rounded-lg p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-shadow flex flex-col sm:flex-row items-start justify-between gap-5"
              >
                {/* Thumbnail if present */}
                {item.imageUrl && (
                  <div
                    onClick={() => onOpenReader(item)}
                    className="w-full sm:w-36 h-28 rounded overflow-hidden bg-[#E5DFD3]/40 shrink-0 cursor-pointer"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.headline}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#B65B3D] uppercase tracking-wider">
                    <span>{item.section}</span>
                    <span className="text-[#E5DFD3]">·</span>
                    <span className="text-[#616962] font-normal">{item.publisher}</span>
                    <span className="text-[#E5DFD3]">·</span>
                    <span className="text-[#616962] font-normal">
                      Saved {new Date(record.savedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3
                    onClick={() => onOpenReader(item)}
                    className="text-lg font-serif font-bold text-[#252B27] hover:text-[#B65B3D] cursor-pointer transition-colors"
                  >
                    {item.headline}
                  </h3>

                  <p className="font-serif text-xs sm:text-sm text-[#252B27] leading-relaxed line-clamp-2">
                    {item.briefSummary}
                  </p>

                  <div className="pt-2 flex items-center gap-4 text-xs font-medium">
                    <button
                      onClick={() => onOpenReader(item)}
                      className="text-[#B65B3D] hover:underline flex items-center gap-1"
                    >
                      <span>Read brief →</span>
                    </button>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#616962] hover:text-[#252B27] flex items-center gap-1"
                    >
                      <span>Original reporting</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Remove action */}
                <button
                  onClick={() => onRemoveSaved(item)}
                  className="p-2 text-[#616962] hover:text-[#B65B3D] self-end sm:self-center transition-colors"
                  title="Remove from saved stories"
                >
                  <Bookmark className="w-5 h-5 fill-current text-[#B65B3D]" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center border border-[#E5DFD3] rounded-lg bg-white/60 max-w-md mx-auto">
          <Bookmark className="w-10 h-10 text-[#616962] mx-auto mb-3 opacity-30" />
          <h3 className="font-serif font-bold text-xl text-[#252B27] mb-1">
            Keep a good story for later.
          </h3>
          <p className="text-xs text-[#616962] leading-relaxed px-6 mb-4">
            Tap the bookmark icon on any story in today's paper. You'll find it here whenever you have time for a slower read.
          </p>
        </div>
      )}
    </div>
  );
};
