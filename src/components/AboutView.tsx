import React from 'react';
import { ShieldCheck, Newspaper, Compass, Sparkles, Filter, CheckCircle2 } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-12">
      {/* Title */}
      <div className="border-b border-[#1C1917] pb-6">
        <span className="text-xs uppercase tracking-widest text-[#8C2D19] font-semibold">Editorial Manifesto</span>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[#1C1917] tracking-tight mt-1">
          About Daybreak
        </h1>
        <p className="text-sm text-[#78716C] mt-2 leading-relaxed">
          How Daybreak collects real reporting, personalizes each morning edition, and protects your attention.
        </p>
      </div>

      {/* Section 1: The Core Idea */}
      <section className="space-y-4">
        <h2 className="text-2xl font-serif font-bold text-[#1C1917]">
          A Calm, Finite Morning Broadsheet
        </h2>
        <p className="text-sm text-[#78716C] leading-relaxed">
          Modern news apps are engineered for engagement maximization: infinite algorithmic feeds, breaking-news push alarms, and rage-inducing engagement metrics. Daybreak is built on the opposite philosophy: <strong className="text-[#1C1917]">finitude</strong>.
        </p>
        <p className="text-sm text-[#78716C] leading-relaxed">
          Once each morning, Daybreak gathers real, verified reporting matching your exact curiosity, synthesizes source-grounded summaries, and presents you with one complete broadsheet. When you finish reading, you are done. There is nothing more to refresh until tomorrow’s paper arrives.
        </p>
      </section>

      {/* Section 2: Real News Collection & Allowlist */}
      <section className="space-y-4 pt-6 border-t border-[#E7E5E4]">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-[#8C2D19]" />
          <h2 className="text-2xl font-serif font-bold text-[#1C1917]">
            Verified Publishers & Source Ingestion
          </h2>
        </div>
        <p className="text-sm text-[#78716C] leading-relaxed">
          Daybreak collects actual reporting through server-side verified RSS feeds and targeted search feeds from reputable international newsrooms, including:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 bg-[#FFFFFF] border border-[#E7E5E4] rounded">
            <span className="font-semibold text-[#1C1917] block">BBC News & Sport</span>
            <span className="text-[11px] text-[#78716C]">World, Tech, Business</span>
          </div>
          <div className="p-3 bg-[#FFFFFF] border border-[#E7E5E4] rounded">
            <span className="font-semibold text-[#1C1917] block">Le Monde (English)</span>
            <span className="text-[11px] text-[#78716C]">Europe, Culture, Climate</span>
          </div>
          <div className="p-3 bg-[#FFFFFF] border border-[#E7E5E4] rounded">
            <span className="font-semibold text-[#1C1917] block">Ars Technica</span>
            <span className="text-[11px] text-[#78716C]">Technology, Computing</span>
          </div>
          <div className="p-3 bg-[#FFFFFF] border border-[#E7E5E4] rounded">
            <span className="font-semibold text-[#1C1917] block">NASA Science & Space</span>
            <span className="text-[11px] text-[#78716C]">Astronomy & Research</span>
          </div>
          <div className="p-3 bg-[#FFFFFF] border border-[#E7E5E4] rounded">
            <span className="font-semibold text-[#1C1917] block">The Guardian</span>
            <span className="text-[11px] text-[#78716C]">Environment & Climate</span>
          </div>
          <div className="p-3 bg-[#FFFFFF] border border-[#E7E5E4] rounded">
            <span className="font-semibold text-[#1C1917] block">Regional Newsrooms</span>
            <span className="text-[11px] text-[#78716C]">Dawn, NPR, Reuters, etc.</span>
          </div>
        </div>
        <p className="text-xs text-[#78716C] leading-relaxed pt-2">
          Every story attributes its original publisher and includes a direct link to the full article. We do not bypass paywalls or scrape full proprietary texts without permission.
        </p>
      </section>

      {/* Section 3: Grounded Summaries & Anti-Hallucination */}
      <section className="space-y-4 pt-6 border-t border-[#E7E5E4]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#8C2D19]" />
          <h2 className="text-2xl font-serif font-bold text-[#1C1917]">
            Grounded Summaries & Zero Hallucination
          </h2>
        </div>
        <p className="text-sm text-[#78716C] leading-relaxed">
          Daybreak never fabricates or invents news to fulfill an obscure query. Our summaries are produced by Gemini 3.8 Flash operating under strict grounding instructions:
        </p>
        <ul className="space-y-2 text-xs text-[#78716C] list-disc pl-5">
          <li>
            <strong className="text-[#1C1917]">3 Verifiable Things:</strong> Each story summary enables the reader to learn three verifiable factual points directly mentioned in the publisher's reported text.
          </li>
          <li>
            <strong className="text-[#1C1917]">No Extrapolation:</strong> If an external feed only provides a two-sentence dispatch, the summary stays strictly constrained to those facts.
          </li>
          <li>
            <strong className="text-[#1C1917]">Transparent Failures:</strong> When no trustworthy coverage exists for a niche search, Daybreak clearly states that no verified reporting is currently available.
          </li>
        </ul>
      </section>

      {/* Section 4: Personalization & Learning Signals */}
      <section className="space-y-4 pt-6 border-t border-[#E7E5E4]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#8C2D19]" />
          <h2 className="text-2xl font-serif font-bold text-[#1C1917]">
            How Daybreak Learns From You
          </h2>
        </div>
        <p className="text-sm text-[#78716C] leading-relaxed">
          Your personal paper adapts to your curiosity over time through deliberate signals:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-[#FFFFFF] border border-[#E7E5E4] rounded space-y-1.5">
            <h4 className="font-semibold text-[#1C1917]">Explicit Inquiries</h4>
            <p className="text-[#78716C]">
              Topics and search queries you follow are prioritized directly in the next edition.
            </p>
          </div>
          <div className="p-4 bg-[#FFFFFF] border border-[#E7E5E4] rounded space-y-1.5">
            <h4 className="font-semibold text-[#1C1917]">Likes & Bookmarks</h4>
            <p className="text-[#78716C]">
              Marking "More like this" increases the weighting of that topic and similar entities.
            </p>
          </div>
          <div className="p-4 bg-[#FFFFFF] border border-[#E7E5E4] rounded space-y-1.5">
            <h4 className="font-semibold text-[#1C1917]">Soft Skips</h4>
            <p className="text-[#78716C]">
              Skipping a story applies a gentle dampening factor without deleting your chosen interest.
            </p>
          </div>
          <div className="p-4 bg-[#FFFFFF] border border-[#E7E5E4] rounded space-y-1.5">
            <h4 className="font-semibold text-[#1C1917]">Edition Immutability</h4>
            <p className="text-[#78716C]">
              Feedback only influences future papers. A broadsheet already delivered today remains untouched.
            </p>
          </div>
        </div>
        <p className="text-xs text-[#78716C] pt-2">
          You can inspect all learned preferences and reset them anytime in your Settings.
        </p>
      </section>
    </div>
  );
};
