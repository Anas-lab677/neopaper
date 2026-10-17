import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Sparkles, BookOpen, Clock, FileText, Bookmark, ThumbsUp, ThumbsDown, ExternalLink, TrendingUp } from 'lucide-react';
import { Article, Edition, UserProfile } from '../../shared/types.ts';

interface HomeViewProps {
  onSearch: (query: string) => void;
  trendingArticles: Article[];
  todayEdition: Edition | null;
  profile: UserProfile | null;
  onSelectTab: (tab: string) => void;
  onOpenReader: (article: any) => void;
  onToggleSave: (article: any) => void;
  savedItemIds: Set<string>;
  onOpenPdfPreview: () => void;
  onDownloadPdf: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSearch,
  trendingArticles,
  todayEdition,
  profile,
  onSelectTab,
  onOpenReader,
  onToggleSave,
  savedItemIds,
  onOpenPdfPreview,
  onDownloadPdf,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  // Intersection Observer for scroll-reveal animations
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section-id');
            if (id) {
              setVisibleSections(prev => new Set([...prev, id]));
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    const sections = document.querySelectorAll('[data-section-id]');
    sections.forEach(sec => observerRef.current?.observe(sec));

    return () => observerRef.current?.disconnect();
  }, [trendingArticles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  const samplePills = [
    'AI startups',
    'Pakistan cricket',
    'Floods in Karachi',
    'Clean energy transition',
    'Space exploration',
    'Global markets',
  ];

  // Extract unique topics from trending articles for the ticker
  const trendingTopics = Array.from(
    new Set(trendingArticles.map(a => a.topic).filter(Boolean))
  );
  // Add some headline snippets too for a richer ticker
  const tickerItems = [
    ...trendingTopics,
    ...trendingArticles.slice(0, 8).map(a => a.headline?.slice(0, 60) + (a.headline?.length > 60 ? '…' : '')),
  ].filter(Boolean);

  const getSectionClass = (id: string) =>
    `transition-all duration-700 ${visibleSections.has(id) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`;

  return (
    <div className="space-y-16 pb-12">
      {/* HERO SECTION with fade-in */}
      <section
        data-section-id="hero"
        className={`pt-12 sm:pt-20 pb-8 px-4 text-center max-w-4xl mx-auto animate-fade-in-up`}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D6D3D1] bg-[#FFFFFF] text-[11px] uppercase tracking-wider text-[#78716C] mb-6 font-medium">
          <span>Broadsheet Edition</span>
          <span>·</span>
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-serif font-bold text-[#1C1917] tracking-tight leading-tight mb-4">
          What news matters to you?
        </h1>

        <p className="text-base sm:text-lg text-[#78716C] max-w-2xl mx-auto mb-10 leading-relaxed font-sans font-normal">
          Type the topics, places, and events you want to follow. Daybreak gathers verified reporting across global publishers into one calm personal broadsheet.
        </p>

        {/* Search / Input Field */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-6">
          <div className="relative flex items-center bg-[#FFFFFF] border-2 border-[#1C1917] rounded-lg shadow-sm hover:shadow-md transition-shadow p-1.5">
            <Search className="w-5 h-5 text-[#78716C] ml-3 shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Try 'AI startups, Pakistan cricket, and floods in Karachi'"
              className="w-full px-3 py-3 text-sm sm:text-base text-[#1C1917] placeholder:text-[#A8A29E] bg-transparent focus:outline-none"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-[#1C1917] text-[#FAF9F6] hover:bg-[#8C2D19] rounded-md text-xs sm:text-sm font-medium transition-colors shrink-0 flex items-center gap-2"
            >
              <span>Build Paper</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Suggestion Interest Pills */}
        <div className="flex items-center justify-center flex-wrap gap-2 text-xs text-[#78716C]">
          <span className="text-[#A8A29E] mr-1">Popular inquiries:</span>
          {samplePills.map(pill => (
            <button
              key={pill}
              type="button"
              onClick={() => {
                setSearchInput(pill);
                onSearch(pill);
              }}
              className="px-2.5 py-1 rounded bg-[#FFFFFF] border border-[#E7E5E4] hover:border-[#1C1917] hover:text-[#1C1917] transition-all text-[11px]"
            >
              {pill}
            </button>
          ))}
        </div>
      </section>

      {/* HORIZONTAL SCROLLING TRENDING TICKER */}
      {tickerItems.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-[#8C2D19]" />
            <span className="text-[11px] font-semibold text-[#8C2D19] uppercase tracking-wider">
              Trending Now
            </span>
            <div className="flex-1 h-px bg-[#E7E5E4]" />
          </div>
          <div className="trending-ticker-container rounded-lg bg-[#FFFFFF] border border-[#E7E5E4] py-3">
            <div className="trending-ticker-track">
              {/* Duplicate the items for seamless loop */}
              {[...tickerItems, ...tickerItems].map((item, idx) => (
                <button
                  key={`ticker-${idx}`}
                  onClick={() => {
                    setSearchInput(item);
                    onSearch(item);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 mx-1.5 rounded-full border border-[#E7E5E4] bg-[#FAF9F6] hover:bg-[#1C1917] hover:text-[#FAF9F6] hover:border-[#1C1917] text-[11px] text-[#78716C] whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8C2D19] shrink-0" />
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TODAY'S PAPER BANNER BRIDGE */}
      <section
        data-section-id="paper-banner"
        className={`max-w-5xl mx-auto px-4 ${getSectionClass('paper-banner')}`}
      >
        <div className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-lg p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <span className="text-xs font-semibold text-[#8C2D19] uppercase tracking-wider">Today's Morning Broadsheet</span>
              <span className="text-xs text-[#A8A29E]">·</span>
              <span className="text-xs text-[#78716C]">{todayEdition ? `${todayEdition.storyCount} stories` : 'Ready'}</span>
              <span className="text-xs text-[#A8A29E]">·</span>
              <span className="text-xs text-[#78716C] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {todayEdition ? `${todayEdition.readingTimeMinutes} min read` : '10 min read'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917]">
              {todayEdition?.headline || 'Your Curated Morning Edition'}
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C] max-w-xl">
              Constructed from your followed topics with source-grounded key takeaways and matching printable newspaper PDF.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
            <button
              onClick={() => onSelectTab('today')}
              className="px-5 py-2.5 bg-[#1C1917] text-[#FAF9F6] hover:bg-[#8C2D19] rounded text-xs font-medium transition-colors flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Read Today's Paper</span>
            </button>
            <button
              onClick={onOpenPdfPreview}
              className="px-4 py-2.5 bg-[#FAF9F6] border border-[#D6D3D1] hover:border-[#1C1917] text-[#1C1917] rounded text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>PDF Broadsheet</span>
            </button>
          </div>
        </div>
      </section>

      {/* REAL TRENDING STORIES */}
      <section
        data-section-id="trending-stories"
        className={`max-w-6xl mx-auto px-4 ${getSectionClass('trending-stories')}`}
      >
        <div className="border-b border-[#1C1917] pb-3 mb-8 flex items-end justify-between">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#8C2D19] font-semibold">Live Wire</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917] tracking-tight">
              Trending Stories From Verified Publishers
            </h2>
          </div>
          <button
            onClick={() => onSelectTab('trending')}
            className="text-xs font-medium text-[#1C1917] hover:text-[#8C2D19] flex items-center gap-1"
          >
            <span>View all wire stories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stories Grid — each card has staggered animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingArticles.slice(0, 6).map((art, idx) => {
            const isSaved = savedItemIds.has(art.id);
            return (
              <article
                key={`${art.id || 'art'}-${idx}`}
                className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-lg p-5 flex flex-col justify-between hover:border-[#1C1917] transition-all group animate-fade-in-up"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="space-y-3">
                  {/* Real Image only if usable */}
                  {art.imageUrl && (
                    <div className="w-full h-44 overflow-hidden rounded bg-[#FAF9F6] mb-3">
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

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-[#78716C]">
                    <span className="font-semibold text-[#8C2D19] uppercase tracking-wider text-[10px]">
                      {art.topic}
                    </span>
                    <span className="text-[11px]">{art.publisher}</span>
                  </div>

                  {/* Headline */}
                  <h3
                    onClick={() => onOpenReader(art)}
                    className="text-lg font-serif font-bold text-[#1C1917] group-hover:text-[#8C2D19] transition-colors leading-snug cursor-pointer"
                  >
                    {art.headline}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-xs text-[#78716C] line-clamp-3 leading-relaxed">
                    {art.briefSummary || art.excerpt}
                  </p>
                </div>

                {/* Footer Controls */}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSave(art);
                      }}
                      className={`p-1.5 rounded transition-colors ${
                        isSaved ? 'text-[#8C2D19] bg-[#8C2D19]/10' : 'text-[#78716C] hover:text-[#1C1917]'
                      }`}
                      title={isSaved ? 'Remove bookmark' : 'Save article'}
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
      </section>

      {/* EDITORIAL STANDARDS SECTION */}
      <section
        data-section-id="editorial-standards"
        className={`max-w-5xl mx-auto px-4 ${getSectionClass('editorial-standards')}`}
      >
        <div className="border-t border-b border-[#E7E5E4] py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wider text-[#8C2D19] font-semibold">01 · Finite Broadsheet</span>
              <h4 className="text-lg font-serif font-bold text-[#1C1917]">No Infinite Feeds</h4>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Daybreak has a clear beginning and end. Once you read today's edition, you are done. Your attention is preserved.
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wider text-[#8C2D19] font-semibold">02 · Strict Attribution</span>
              <h4 className="text-lg font-serif font-bold text-[#1C1917]">Zero Hallucinated News</h4>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Summaries are grounded strictly in verified publisher RSS reporting. We never fabricate events to satisfy a query.
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wider text-[#8C2D19] font-semibold">03 · Physical Layout</span>
              <h4 className="text-lg font-serif font-bold text-[#1C1917]">Printable Morning PDF</h4>
              <p className="text-xs text-[#78716C] leading-relaxed">
                The exact web stories, summaries, and order export into a high-fidelity two-page broadsheet ready for your printer or tablet.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
