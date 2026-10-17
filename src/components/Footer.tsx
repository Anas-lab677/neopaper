import React from 'react';
import { Newspaper, Shield, FileText, Compass, ExternalLink } from 'lucide-react';

interface FooterProps {
  onSelectTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="bg-[#FFFFFF] border-t border-[#E7E5E4] mt-20 text-[#78716C] text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand & Editorial Mission */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-serif font-bold text-[#1C1917] tracking-tight">
                daybreak<span className="text-[#8C2D19]">.</span>
              </span>
            </div>
            <p className="text-xs text-[#78716C] leading-relaxed">
              A calm, finite daily morning newspaper tailored to your curiosity. Grounded strictly in verified reporting from trusted global publishers.
            </p>
            <p className="text-[11px] text-[#A8A29E]">
              Printable broadsheet edition rendered each morning.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[#1C1917] uppercase tracking-wider">The Paper</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onSelectTab('home')}
                  className="hover:text-[#1C1917] transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('today')}
                  className="hover:text-[#1C1917] transition-colors"
                >
                  Today's Paper
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('trending')}
                  className="hover:text-[#1C1917] transition-colors"
                >
                  Trending Stories
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('saved')}
                  className="hover:text-[#1C1917] transition-colors"
                >
                  Saved Stories
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('archive')}
                  className="hover:text-[#1C1917] transition-colors"
                >
                  Edition Archive
                </button>
              </li>
            </ul>
          </div>

          {/* Editorial & About */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[#1C1917] uppercase tracking-wider">Editorial Standards</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onSelectTab('about')}
                  className="hover:text-[#1C1917] transition-colors"
                >
                  About Daybreak
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('about')}
                  className="hover:text-[#1C1917] transition-colors"
                >
                  Source Allowlist & Attribution
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('about')}
                  className="hover:text-[#1C1917] transition-colors"
                >
                  Anti-Hallucination Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('settings')}
                  className="hover:text-[#1C1917] transition-colors"
                >
                  Personalization & Learned Signals
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Account */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[#1C1917] uppercase tracking-wider">Account & Legal</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onSelectTab('settings')}
                  className="hover:text-[#1C1917] transition-colors"
                >
                  Settings & Preferences
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('privacy')}
                  className="hover:text-[#1C1917] transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('terms')}
                  className="hover:text-[#1C1917] transition-colors"
                >
                  Terms and Conditions
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Rule & Copyright */}
        <div className="pt-8 border-t border-[#E7E5E4] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-[#78716C]">
            © {new Date().getFullYear()} Daybreak. All rights reserved. Original reporting remains the intellectual property of respective publishers.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-[#A8A29E]">
            <span>Finite Morning Broadsheet</span>
            <span>·</span>
            <span>Zero Algorithmic Doomscroll</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
