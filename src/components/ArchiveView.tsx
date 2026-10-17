import React, { useState } from 'react';
import { Download, Search, Calendar, FileText, ArrowRight } from 'lucide-react';
import { Edition } from '../../shared/types.ts';

interface ArchiveViewProps {
  archive: Edition[];
  onOpenEdition: (edition: Edition) => void;
  onDownloadPdf: (edition: Edition) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  archive,
  onOpenEdition,
  onDownloadPdf,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = archive.filter(edition => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesDate = edition.formattedDate.toLowerCase().includes(q);
    const matchesHeadline = edition.headline.toLowerCase().includes(q);
    const matchesTopics = edition.items.some(i => i.section.toLowerCase().includes(q));
    return matchesDate || matchesHeadline || matchesTopics;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      {/* Masthead header */}
      <div className="border-b border-[#E5DFD3] pb-6 mb-8">
        <span className="text-xs uppercase tracking-widest text-[#B65B3D] font-bold block mb-1">
          Edition Archive
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#252B27]">
          Yesterday, <span className="italic font-normal">worth keeping.</span>
        </h1>
        <p className="text-sm text-[#616962] mt-1">
          Every edition, exactly as you read it. Stored snapshots remain immutable.
        </p>

        {/* Search input */}
        <div className="mt-5 relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#616962]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Find an edition by topic, date, or headline..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#E5DFD3] rounded focus:outline-none focus:border-[#B65B3D]"
          />
        </div>
      </div>

      {/* Archive Grid */}
      {filtered.length > 0 ? (
        <div className="space-y-6">
          {filtered.map(edition => {
            const leadItem = edition.items[0];
            return (
              <div
                key={edition.id}
                className="bg-white border border-[#E5DFD3] rounded-lg p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* Miniature newspaper cover thumbnail */}
                  <div className="w-20 h-24 sm:w-24 sm:h-28 rounded bg-[#FCFAF6] border border-[#E5DFD3] p-2 flex flex-col justify-between shrink-0 shadow-2xs">
                    <div>
                      <div className="text-[7px] font-bold text-[#B65B3D] uppercase">Daybreak</div>
                      <div className="text-[6px] text-[#616962]">{edition.editionDate}</div>
                      <div className="w-full h-px bg-[#E5DFD3] my-1" />
                    </div>
                    {leadItem?.imageUrl ? (
                      <div className="w-full h-12 rounded overflow-hidden">
                        <img
                          src={leadItem.imageUrl}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="text-[6px] text-[#616962] font-serif line-clamp-3">
                        {edition.headline}
                      </div>
                    )}
                    <div className="text-[6px] text-[#616962] text-right">Rev {edition.revision}</div>
                  </div>

                  {/* Edition details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#616962] uppercase tracking-wider">
                      <span className="text-[#252B27]">{edition.formattedDate}</span>
                      <span>·</span>
                      <span>{edition.storyCount} stories</span>
                      <span>·</span>
                      <span>{edition.readingTimeMinutes} min read</span>
                    </div>

                    <h2
                      onClick={() => onOpenEdition(edition)}
                      className="text-lg sm:text-xl font-serif font-bold text-[#252B27] hover:text-[#B65B3D] cursor-pointer transition-colors"
                    >
                      {edition.headline}
                    </h2>

                    <p className="text-xs text-[#616962] line-clamp-2 leading-relaxed">
                      {leadItem?.briefSummary || 'A preserved snapshot of your morning reporting.'}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Array.from(new Set(edition.items.map(i => i.section))).map(sec => (
                        <span
                          key={sec}
                          className="text-[10px] uppercase tracking-wider text-[#616962] bg-[#F7F5EF] px-2 py-0.5 rounded"
                        >
                          {sec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-[#E5DFD3]">
                  <button
                    onClick={() => onOpenEdition(edition)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#B65B3D] text-white hover:bg-[#9D4B31] text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <span>Open edition</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDownloadPdf(edition)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-[#E5DFD3] bg-white text-[#252B27] hover:bg-[#FCFAF6] text-xs font-semibold shadow-2xs transition-colors"
                    title="Download newspaper PDF for this date"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center border border-[#E5DFD3] rounded-lg bg-white/60">
          <Calendar className="w-8 h-8 text-[#616962] mx-auto mb-2 opacity-50" />
          <h3 className="font-serif font-bold text-lg text-[#252B27] mb-1">No archived editions found</h3>
          <p className="text-xs text-[#616962]">
            As you read Daybreak each morning, your past papers will be preserved here as immutable historical editions.
          </p>
        </div>
      )}
    </div>
  );
};
