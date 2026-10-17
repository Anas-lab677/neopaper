import React from 'react';
import { Newspaper, Rss, UserCheck } from 'lucide-react';
import { UserProfile } from '../../shared/types.ts';

interface HeaderProps {
  currentTab: 'today' | 'archive' | 'saved' | 'interests';
  onSelectTab: (tab: 'today' | 'archive' | 'saved' | 'interests') => void;
  profile: UserProfile | null;
  onSwitchDemo: (id: 'reader-a' | 'reader-b') => void;
  onOpenFeedManager: () => void;
  onOpenOnboarding: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  profile,
  onSwitchDemo,
  onOpenFeedManager,
  onOpenOnboarding,
}) => {
  return (
    <header className="border-b border-[#E5DFD3] bg-[#F7F5EF] sticky top-0 z-30 px-4 sm:px-8 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Brand wordmark & Sunrise emblem */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('today')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            {/* Sunrise emblem */}
            <div className="w-8 h-8 rounded-full bg-[#B65B3D]/10 flex items-center justify-center text-[#B65B3D] transition-transform group-hover:scale-105">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V5a1 1 0 0 1 1-1zm6.364 2.636a1 1 0 0 1 0 1.414l-1.414 1.414a1 1 0 1 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0zM20 11a1 1 0 0 1 1 1 1 1 0 0 1-1 1h-2a1 1 0 0 1 0-2h2zm-8 4c3.314 0 6 2.686 6 6H6c0-3.314 2.686-6 6-6zm-6.95-6.95a1 1 0 0 1 1.414 0l1.414 1.414a1 1 0 0 1-1.414 1.414L4.05 9.464a1 1 0 0 1 0-1.414zM4 11a1 1 0 0 1 1 1 1 1 0 0 1-1 1H2a1 1 0 0 1 0-2h2z" />
              </svg>
            </div>
            <div>
              <span className="text-2xl font-serif font-bold tracking-tight text-[#252B27]">
                daybreak<span className="text-[#B65B3D]">.</span>
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Single-line, unboxed) */}
        <nav className="flex items-center gap-2 sm:gap-6 text-sm font-medium text-[#616962]">
          <button
            onClick={() => onSelectTab('today')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              currentTab === 'today'
                ? 'border-[#B65B3D] text-[#252B27] font-semibold'
                : 'border-transparent hover:text-[#252B27]'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => onSelectTab('archive')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              currentTab === 'archive'
                ? 'border-[#B65B3D] text-[#252B27] font-semibold'
                : 'border-transparent hover:text-[#252B27]'
            }`}
          >
            Archive
          </button>
          <button
            onClick={() => onSelectTab('saved')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              currentTab === 'saved'
                ? 'border-[#B65B3D] text-[#252B27] font-semibold'
                : 'border-transparent hover:text-[#252B27]'
            }`}
          >
            Saved
          </button>
          <button
            onClick={() => onSelectTab('interests')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              currentTab === 'interests'
                ? 'border-[#B65B3D] text-[#252B27] font-semibold'
                : 'border-transparent hover:text-[#252B27]'
            }`}
          >
            Your interests
          </button>
        </nav>

        {/* Zone 3: Actions & Demo Profile Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Feed Health & Allowlist Manager */}
          <button
            onClick={onOpenFeedManager}
            title="Inspect publisher RSS feeds and status"
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#616962] hover:text-[#252B27] border border-[#E5DFD3] rounded bg-white/60 hover:bg-white transition-colors"
          >
            <Rss className="w-3.5 h-3.5 text-[#B65B3D]" />
            <span>Feeds & Sources</span>
          </button>

          {/* Quick Demo Switcher (Sara / David) for Judges */}
          <div className="inline-flex items-center rounded border border-[#E5DFD3] bg-white/80 p-0.5 text-xs">
            <button
              onClick={() => onSwitchDemo('reader-a')}
              className={`px-2 py-1 rounded transition-colors ${
                profile?.id === 'reader-a'
                  ? 'bg-[#B65B3D] text-white font-medium shadow-sm'
                  : 'text-[#616962] hover:text-[#252B27]'
              }`}
              title="Reader A: Technology & Science focus"
            >
              Sara
            </button>
            <button
              onClick={() => onSwitchDemo('reader-b')}
              className={`px-2 py-1 rounded transition-colors ${
                profile?.id === 'reader-b'
                  ? 'bg-[#B65B3D] text-white font-medium shadow-sm'
                  : 'text-[#616962] hover:text-[#252B27]'
              }`}
              title="Reader B: Business & Sports focus"
            >
              David
            </button>
          </div>

          {/* Onboarding Restart */}
          <button
            onClick={onOpenOnboarding}
            className="w-8 h-8 rounded-full border border-[#E5DFD3] bg-[#FCFAF6] hover:bg-white flex items-center justify-center text-xs font-serif font-bold text-[#252B27]"
            title="Account & preferences"
          >
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'S'}
          </button>
        </div>
      </div>
    </header>
  );
};
