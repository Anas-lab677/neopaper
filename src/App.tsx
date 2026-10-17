import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { EditionView } from './components/EditionView.tsx';
import { ArchiveView } from './components/ArchiveView.tsx';
import { SavedView } from './components/SavedView.tsx';
import { InterestsView } from './components/InterestsView.tsx';
import { StoryReaderModal } from './components/StoryReaderModal.tsx';
import { NewspaperPdfPreviewModal } from './components/NewspaperPdfPreviewModal.tsx';
import { OnboardingModal } from './components/OnboardingModal.tsx';
import { FeedManagerModal } from './components/FeedManagerModal.tsx';
import { Edition, EditionItem, SavedArticleRecord, UserProfile } from '../shared/types.ts';
import { CheckCircle2, RotateCcw } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'today' | 'archive' | 'saved' | 'interests'>('today');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayEdition, setTodayEdition] = useState<Edition | null>(null);
  const [archive, setArchive] = useState<Edition[]>([]);
  const [savedList, setSavedList] = useState<SavedArticleRecord[]>([]);

  // Reader state
  const [activeStory, setActiveStory] = useState<EditionItem | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showFeedManager, setShowFeedManager] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // User actions
  const [skippedItemIds, setSkippedItemIds] = useState<Set<string>>(new Set());
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'more' | 'less'>>({});
  const [toast, setToast] = useState<{ message: string; onUndo?: () => void } | null>(null);

  const showToast = (message: string, onUndo?: () => void) => {
    setToast({ message, onUndo });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Initial load
  const loadInitialData = async () => {
    try {
      const [profRes, edRes, arcRes, savRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/editions/today'),
        fetch('/api/editions/archive'),
        fetch('/api/saved'),
      ]);

      const profData = await profRes.json();
      const edData = await edRes.json();
      const arcData = await arcRes.json();
      const savData = await savRes.json();

      if (profData.profile) setProfile(profData.profile);
      if (edData.edition) setTodayEdition(edData.edition);
      if (arcData.archive) setArchive(arcData.archive);
      if (savData.saved) setSavedList(savData.saved);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Switch demo reader (Reader A "Sara" vs Reader B "David")
  const handleSwitchDemo = async (profileId: 'reader-a' | 'reader-b') => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/profile/switch-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        // Refresh today's edition for the new reader profile
        const edRes = await fetch('/api/editions/today');
        const edData = await edRes.json();
        if (edData.edition) setTodayEdition(edData.edition);

        // Refresh archive and saved lists
        const arcRes = await fetch('/api/editions/archive');
        const arcData = await arcRes.json();
        if (arcData.archive) setArchive(arcData.archive);

        const savRes = await fetch('/api/saved');
        const savData = await savRes.json();
        if (savData.saved) setSavedList(savData.saved);

        setSkippedItemIds(new Set());
        setFeedbackMap({});
        showToast(`Switched demo profile to ${data.profile.name}.`);
      }
    } catch (err) {
      console.error('Failed to switch demo:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Regenerate today's edition with latest feedback
  const handleRefreshEdition = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/editions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRegeneration: true }),
      });
      const data = await res.json();
      if (data.edition) {
        setTodayEdition(data.edition);
        setSkippedItemIds(new Set());
        showToast('Fresh edition created with your updated signals.');
      }
    } catch (err) {
      console.error('Failed to regenerate edition:', err);
      showToast('Could not refresh edition. Last saved paper preserved.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Toggle saving an article
  const handleToggleSave = async (item: EditionItem) => {
    try {
      const res = await fetch(`/api/saved/${item.id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.isSaved) {
          setSavedList(prev => [
            {
              id: `saved-${item.id}`,
              userId: profile?.id || 'reader-a',
              articleId: item.articleId,
              item: { ...item, isSaved: true },
              savedAt: new Date().toISOString(),
            },
            ...prev,
          ]);
          showToast(`Saved "${item.headline.slice(0, 32)}..." to your collection.`);
        } else {
          setSavedList(prev => prev.filter(s => s.item.id !== item.id));
          showToast('Removed from saved stories.', () => handleToggleSave(item));
        }
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  // Skip a story with instant undo option
  const handleSkipItem = (item: EditionItem) => {
    setSkippedItemIds(prev => new Set(prev).add(item.id));
    // Record interaction on server
    fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articleId: item.articleId,
        topic: item.section,
        action: 'skip',
      }),
    });

    showToast(`Skipped "${item.headline.slice(0, 30)}..." from today's paper.`, () => {
      setSkippedItemIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    });
  };

  // Feedback: More like this / Less like this
  const handleFeedback = async (item: EditionItem, type: 'more' | 'less') => {
    const isTogglingOff = feedbackMap[item.id] === type;
    const newType = isTogglingOff ? null : type;

    setFeedbackMap(prev => ({
      ...prev,
      [item.id]: newType as any,
    }));

    if (newType) {
      await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: item.articleId,
          topic: item.section,
          action: type === 'more' ? 'more_like_this' : 'less_like_this',
        }),
      });

      // Update local profile state
      const profRes = await fetch('/api/profile');
      const profData = await profRes.json();
      if (profData.profile) setProfile(profData.profile);

      showToast(
        type === 'more'
          ? `Noted: We'll include more stories like this in upcoming editions.`
          : `Noted: We'll reduce stories like this in upcoming editions.`
      );
    }
  };

  // Save reflection
  const handleSaveReflection = async (note: string) => {
    if (!todayEdition) return;
    try {
      await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editionId: todayEdition.id,
          note,
        }),
      });
      setTodayEdition(prev => (prev ? { ...prev, reflectionNote: note } : prev));
    } catch (err) {
      console.error('Failed to save reflection:', err);
    }
  };

  // Save profile preferences
  const handleSaveProfile = async (updates: Partial<UserProfile>) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        // Refresh edition to reflect changes
        await handleRefreshEdition();
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };

  // Reset learned preferences
  const handleResetLearning = async () => {
    try {
      const res = await fetch('/api/profile/reset-learning', { method: 'POST' });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        showToast('Learned preferences reset to baseline. Explicit topics preserved.');
      }
    } catch (err) {
      console.error('Failed to reset learning:', err);
    }
  };

  // PDF download
  const handleDownloadPdf = (edition?: Edition) => {
    const target = edition || todayEdition;
    if (!target) return;
    const downloadUrl = `/api/editions/${target.id}/pdf`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `daybreak-${target.editionDate}-rev${target.revision}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloading Daybreak PDF for ${target.formattedDate}...`);
  };

  const savedItemIds = new Set(savedList.map(s => s.item.id));

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#252B27] flex flex-col font-sans selection:bg-[#B65B3D]/20">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        profile={profile}
        onSwitchDemo={handleSwitchDemo}
        onOpenFeedManager={() => setShowFeedManager(true)}
        onOpenOnboarding={() => setShowOnboarding(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentTab === 'today' && (
          <EditionView
            edition={todayEdition}
            profile={profile}
            onOpenReader={setActiveStory}
            onToggleSave={handleToggleSave}
            savedItemIds={savedItemIds}
            onSkipItem={handleSkipItem}
            skippedItemIds={skippedItemIds}
            onFeedback={handleFeedback}
            feedbackMap={feedbackMap}
            onRefreshEdition={handleRefreshEdition}
            isRefreshing={isRefreshing}
            onOpenPdfPreview={() => setShowPdfPreview(true)}
            onDownloadPdf={() => handleDownloadPdf()}
            onSaveReflection={handleSaveReflection}
          />
        )}

        {currentTab === 'archive' && (
          <ArchiveView
            archive={archive}
            onOpenEdition={edition => {
              setTodayEdition(edition);
              setCurrentTab('today');
            }}
            onDownloadPdf={handleDownloadPdf}
          />
        )}

        {currentTab === 'saved' && (
          <SavedView
            savedList={savedList}
            onOpenReader={setActiveStory}
            onRemoveSaved={handleToggleSave}
          />
        )}

        {currentTab === 'interests' && (
          <InterestsView
            profile={profile}
            onSaveProfile={handleSaveProfile}
            onResetLearning={handleResetLearning}
          />
        )}
      </main>

      {/* Distraction-Free Story Reader Dialog */}
      <StoryReaderModal
        item={activeStory}
        onClose={() => setActiveStory(null)}
        onToggleSave={handleToggleSave}
        isSaved={activeStory ? savedItemIds.has(activeStory.id) : false}
        onSkip={handleSkipItem}
        onFeedback={handleFeedback}
        currentFeedback={activeStory ? feedbackMap[activeStory.id] : null}
      />

      {/* Interactive Newspaper PDF Previewer */}
      <NewspaperPdfPreviewModal
        edition={todayEdition}
        readerName={profile?.name || 'Reader'}
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        onDownloadPdf={() => handleDownloadPdf()}
      />

      {/* 3-Step Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        initialProfile={profile}
        onComplete={async updates => {
          await handleSaveProfile(updates);
        }}
      />

      {/* RSS Allowlist & Feed Manager Modal */}
      <FeedManagerModal
        isOpen={showFeedManager}
        onClose={() => setShowFeedManager(false)}
        onFeedsUpdated={() => {
          handleRefreshEdition();
        }}
      />

      {/* Floating Undo / Success Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#252B27] text-white px-4 py-3 rounded-lg shadow-xl text-xs flex items-center gap-3 animate-fade-in border border-stone-700">
          <CheckCircle2 className="w-4 h-4 text-[#7D8B72] shrink-0" />
          <span className="leading-snug">{toast.message}</span>
          {toast.onUndo && (
            <button
              onClick={() => {
                toast.onUndo?.();
                setToast(null);
              }}
              className="ml-2 font-bold text-[#B65B3D] hover:underline flex items-center gap-1 shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Undo</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
