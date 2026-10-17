import React, { useState, useRef, useEffect } from 'react';
import { User, LogIn, LogOut, Sliders, Sparkles, BookOpen, ChevronDown } from 'lucide-react';
import { UserProfile } from '../../shared/types.ts';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  profile: UserProfile | null;
  user: any;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenOnboarding: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  profile,
  user,
  onSignIn,
  onSignOut,
  onOpenOnboarding,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'today', label: "Today's Paper" },
    { id: 'trending', label: 'Trending' },
    { id: 'saved', label: 'Saved' },
    { id: 'archive', label: 'Archive' },
    { id: 'about', label: 'About' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E7E5E4] px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Wordmark (Top Left) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2 text-left group focus:outline-none"
          >
            <span className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#1C1917] group-hover:text-[#8C2D19] transition-colors">
              daybreak<span className="text-[#8C2D19]">.</span>
            </span>
            <span className="hidden lg:inline text-[11px] uppercase tracking-widest text-[#78716C] border-l border-[#D6D3D1] pl-2.5 font-sans font-medium">
              Morning Broadsheet
            </span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex items-center gap-1 sm:gap-6 text-sm font-medium text-[#78716C] overflow-x-auto py-1">
          {navItems.map(item => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-2 py-1 transition-all whitespace-nowrap text-sm border-b-2 ${
                  isActive
                    ? 'border-[#1C1917] text-[#1C1917] font-semibold'
                    : 'border-transparent hover:text-[#1C1917]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Account / Avatar (Top Right) */}
        <div className="flex items-center gap-3 shrink-0 relative" ref={dropdownRef}>
          {user ? (
            <div>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[#E7E5E4]/50 border border-transparent hover:border-[#D6D3D1] transition-all text-left focus:outline-none"
                aria-label="User Account"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Reader'}
                    className="w-7 h-7 rounded-full object-cover border border-[#D6D3D1]"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#1C1917] text-[#FAF9F6] text-xs font-semibold flex items-center justify-center">
                    {(user.displayName || user.email || 'R')[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline text-xs font-medium text-[#1C1917] max-w-[120px] truncate">
                  {user.displayName?.split(' ')[0] || 'Reader'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#78716C]" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#FFFFFF] border border-[#E7E5E4] rounded-lg shadow-lg py-2 z-50 text-xs">
                  <div className="px-4 py-2 border-b border-[#E7E5E4]">
                    <p className="font-semibold text-[#1C1917] truncate">{user.displayName || 'Reader'}</p>
                    <p className="text-[#78716C] truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      onSelectTab('settings');
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-[#1C1917] hover:bg-[#FAF9F6] flex items-center gap-2"
                  >
                    <Sliders className="w-4 h-4 text-[#78716C]" />
                    <span>Settings & Preferences</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenOnboarding();
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-[#1C1917] hover:bg-[#FAF9F6] flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-[#78716C]" />
                    <span>Adjust News Interests</span>
                  </button>

                  <div className="border-t border-[#E7E5E4] my-1" />

                  <button
                    onClick={() => {
                      onSignOut();
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-[#8C2D19] hover:bg-[#FAF9F6] flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded bg-[#1C1917] text-[#FAF9F6] hover:bg-[#2C2927] text-xs font-medium transition-colors shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
