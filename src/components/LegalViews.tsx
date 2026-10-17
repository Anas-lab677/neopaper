import React from 'react';

interface LegalViewProps {
  type: 'privacy' | 'terms';
  onSelectTab: (tab: string) => void;
}

export const LegalViews: React.FC<LegalViewProps> = ({ type, onSelectTab }) => {
  if (type === 'privacy') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12 space-y-8">
        <div className="border-b border-[#1C1917] pb-4">
          <span className="text-xs uppercase tracking-widest text-[#8C2D19] font-semibold">Legal Disclosure</span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1C1917] tracking-tight mt-1">
            Privacy Policy
          </h1>
          <p className="text-xs text-[#78716C] mt-1">Last updated: October 17, 2026</p>
        </div>

        <div className="space-y-6 text-sm text-[#78716C] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-[#1C1917]">1. Information We Collect</h2>
            <p>
              When you authenticate with Daybreak via Firebase Authentication (Google Sign-In), we store your public profile name, email address, and avatar reference solely to identify your private account session.
            </p>
            <p>
              We additionally store the news topics you select, free-text search interests you follow, reading depth preferences, geographic settings, bookmarked stories, and feedback interactions (e.g. "More like this", "Less like this", and skips).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-[#1C1917]">2. How AI & Gemini Process Content</h2>
            <p>
              Daybreak utilizes Google Gemini (gemini-3.8-flash) on the server to parse inquiry requests and extract factual grounded briefs from verified publisher RSS dispatches. We do not use your private reading history or profile data to train external public machine learning models.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-[#1C1917]">3. Third-Party Publisher Links</h2>
            <p>
              Daybreak curates dispatches from third-party publishers (such as BBC, Le Monde, Ars Technica, NASA, and regional outlets). Clicking an original reporting link directs your browser to the publisher's external domain, subject to that publisher's respective privacy policy and cookies.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-[#1C1917]">4. User Controls & Data Deletion</h2>
            <p>
              You maintain full control over your personalization profile. In your Settings, you can inspect all learned topic weights, delete specific interests, or click "Reset All Feedback" to clear accumulated signals. You may delete your saved bookmarks anytime.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-[#1C1917]">5. Contacting the Project</h2>
            <p>
              For privacy inquiries regarding Daybreak, you may submit feedback via the application repository or contact the project team at <span className="text-[#1C1917] font-mono">editorial@daybreak.news</span>.
            </p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12 space-y-8">
      <div className="border-b border-[#1C1917] pb-4">
        <span className="text-xs uppercase tracking-widest text-[#8C2D19] font-semibold">Terms of Use</span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1C1917] tracking-tight mt-1">
          Terms and Conditions
        </h1>
        <p className="text-xs text-[#78716C] mt-1">Last updated: October 17, 2026</p>
      </div>

      <div className="space-y-6 text-sm text-[#78716C] leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-serif font-bold text-[#1C1917]">1. Service Scope</h2>
          <p>
            Daybreak provides a personal morning broadsheet aggregator and inquiry reader intended for non-commercial personal information and contemplative study.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-serif font-bold text-[#1C1917]">2. Intellectual Property & Attribution</h2>
          <p>
            All original news reports, headlines, and source excerpts remain the copyright and intellectual property of their respective journalism publishers. Daybreak summarizes public feeds under fair use principles and provides prominent publisher attribution and direct links to original reporting.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-serif font-bold text-[#1C1917]">3. Accuracy & Grounding</h2>
          <p>
            While Daybreak enforces strict anti-hallucination prompt constraints, automated news synthesis depends on the availability and accuracy of upstream publisher feeds. Daybreak does not warrant the completeness or real-time immediacy of third-party reporting.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-serif font-bold text-[#1C1917]">4. Account Integrity</h2>
          <p>
            Each reader’s saved bookmarks, reflections, and generated broadsheets are isolated to their authenticated session. Users agree not to attempt to circumvent security controls or access other readers' private archives.
          </p>
        </section>
      </div>
    </div>
  );
};
