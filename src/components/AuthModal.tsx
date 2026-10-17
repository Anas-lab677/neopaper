import React, { useState, useEffect } from 'react';
import { X, Sparkles, Shield, Bookmark, Newspaper } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => Promise<void>;
  reasonMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
  reasonMessage,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoogleClick = async () => {
    setIsSigningIn(true);
    setErrorMsg(null);
    try {
      await onSignIn();
      onClose();
    } catch (err: any) {
      console.error('Sign in error:', err);
      const code = err.code || '';
      if (code.includes('unauthorized-domain')) {
        setErrorMsg('This domain is not in Firebase Authorized Domains. Please add it to your Firebase console.');
      } else if (code.includes('popup-blocked')) {
        setErrorMsg('The sign-in popup was blocked by your browser. Please allow popups for this site.');
      } else {
        setErrorMsg(err.message || 'Google sign-in was canceled or failed.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-[#1C1917]/60 overflow-y-auto flex items-start justify-center p-4 pt-16 sm:pt-24 transition-opacity animate-in fade-in duration-150"
    >
      <div className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-xl shadow-2xl max-w-sm sm:max-w-md w-full p-6 sm:p-7 relative space-y-4 animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          aria-label="Close sign-in modal"
          className="absolute right-4 top-4 text-[#78716C] hover:text-[#1C1917] p-1.5 rounded hover:bg-[#FAF9F6] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1.5 pt-1">
          <div className="w-10 h-10 rounded-full bg-[#FAF9F6] border border-[#D6D3D1] text-[#8C2D19] flex items-center justify-center mx-auto mb-1">
            <Newspaper className="w-5 h-5" />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-[#8C2D19] font-semibold">
            Reader Sign In
          </span>
          <h3 className="text-xl font-serif font-bold text-[#1C1917]">
            Sign in to Daybreak
          </h3>
          <p className="text-xs text-[#78716C] leading-snug px-2">
            {reasonMessage || 'Sign in to customize your followed topics, save stories, and sync your daily broadsheet.'}
          </p>
        </div>

        {errorMsg && (
          <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200">
            {errorMsg}
          </p>
        )}

        <div>
          <button
            onClick={handleGoogleClick}
            disabled={isSigningIn}
            className="w-full py-3 px-4 bg-[#1C1917] hover:bg-[#8C2D19] text-[#FAF9F6] rounded-md text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors shadow-xs"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isSigningIn ? 'Connecting with Google...' : 'Continue with Google'}</span>
          </button>
        </div>

        {/* Benefits list */}
        <div className="space-y-1.5 text-[11px] text-[#78716C] bg-[#FAF9F6] p-3 rounded border border-[#E7E5E4]">
          <div className="flex items-center gap-2">
            <Bookmark className="w-3.5 h-3.5 text-[#8C2D19] shrink-0" />
            <span>Save articles to your personal library across devices</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#8C2D19] shrink-0" />
            <span>Follow specific inquiries for tomorrow’s paper</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[#8C2D19] shrink-0" />
            <span>Preserve permanent edition archives and PDFs</span>
          </div>
        </div>

        <p className="text-[10px] text-[#A8A29E] text-center pt-1">
          Click outside or press Esc to dismiss.
        </p>
      </div>
    </div>
  );
};
