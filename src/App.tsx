import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { HomeView } from './components/HomeView.tsx';
import { TodayPaperView } from './components/TodayPaperView.tsx';
import { SearchResultsView } from './components/SearchResultsView.tsx';
import { TrendingView } from './components/TrendingView.tsx';
import { SavedView } from './components/SavedView.tsx';
import { ArchiveView } from './components/ArchiveView.tsx';
import { AboutView } from './components/AboutView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { LegalViews } from './components/LegalViews.tsx';
import { NotFoundView } from './components/NotFoundView.tsx';
import { StoryReaderModal } from './components/StoryReaderModal.tsx';
import { NewspaperPdfPreviewModal } from './components/NewspaperPdfPreviewModal.tsx';
import { OnboardingModal } from './components/OnboardingModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  getUserProfileFromFirestore,
  saveUserProfileToFirestore,
  getUserSavedStoriesFromFirestore,
  saveStoryToFirestore,
  removeStoryFromFirestore,
  getUserEditionsFromFirestore,
  saveEditionToFirestore,
} from './firebase.ts';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  Article,
  Edition,
  EditionItem,
  QueryInterpretation,
  SavedArticleRecord,
  UserProfile,
} from '../shared/types.ts';
import { RotateCcw, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Content state
  const [todayEdition, setTodayEdition] = useState<Edition | null>(null);
  const [archive, setArchive] = useState<Edition[]>([]);
  const [savedList, setSavedList] = useState<SavedArticleRecord[]>([]);
  const [savedItemIds, setSavedItemIds] = useState<Set<string>>(new Set());
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [searchInterpretation, setSearchInterpretation] = useState<QueryInterpretation | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Interaction tracking state
  const [likedItemIds, setLikedItemIds] = useState<Set<string>>(new Set());
  const [dislikedItemIds, setDislikedItemIds] = useState<Set<string>>(new Set());
  const [skippedItemIds, setSkippedItemIds] = useState<Set<string>>(new Set());

  // Modals state
  const [activeStory, setActiveStory] = useState<any | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authReason, setAuthReason] = useState<string>('');
  const [isRefreshingEdition, setIsRefreshingEdition] = useState<boolean>(false);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; onUndo?: () => void } | null>(null);

  const showToast = (message: string, onUndo?: () => void) => {
    setToast({ message, onUndo });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Helper to attach authorization header
  const getAuthHeaders = useCallback(async () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        // Fallback
      }
    }
    return headers;
  }, []);

  // Fetch trending articles for home and trending tabs
  const loadTrending = async () => {
    try {
      const res = await fetch('/api/trending');
      const data = await res.json();
      if (data.articles) {
        setTrendingArticles(data.articles);
      }
    } catch (err) {
      console.warn('Failed to load trending articles:', err);
    }
  };

  // Fetch today's edition
  const loadTodayEdition = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/editions/today', { headers });
      const data = await res.json();
      if (data.edition) {
        setTodayEdition(data.edition);
      }
    } catch (err) {
      console.warn('Failed to load today edition:', err);
    }
  };

  // Fetch saved articles
  const loadSavedArticles = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/saved', { headers });
      const data = await res.json();
      if (data.saved) {
        setSavedList(data.saved);
        setSavedItemIds(new Set(data.saved.map((s: SavedArticleRecord) => s.articleId || s.id)));
        return;
      }
    } catch (err) {
      console.warn('Failed to load saved from api:', err);
    }

    if (auth.currentUser) {
      try {
        const fsSaved = await getUserSavedStoriesFromFirestore(auth.currentUser.uid);
        if (fsSaved.length > 0) {
          setSavedList(fsSaved);
          setSavedItemIds(new Set(fsSaved.map((s: SavedArticleRecord) => s.articleId || s.id)));
        }
      } catch (e) {}
    }
  };

  // Fetch edition archive
  const loadArchive = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/editions/archive', { headers });
      const data = await res.json();
      if (data.archive && data.archive.length > 0) {
        setArchive(data.archive);
        return;
      }
    } catch (err) {
      console.warn('Failed to load archive from api:', err);
    }

    if (auth.currentUser) {
      try {
        const fsArchive = await getUserEditionsFromFirestore(auth.currentUser.uid);
        if (fsArchive.length > 0) {
          setArchive(fsArchive);
        }
      } catch (e) {}
    }
  };

  // Initialize and observe Firebase Authentication
  useEffect(() => {
    loadTrending();

    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();

          let userProf = await getUserProfileFromFirestore(currentUser.uid);
          
          // If Firestore didn't have it (e.g. database unprovisioned), check server's persisted store
          if (!userProf) {
            try {
              const res = await fetch('/api/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const data = await res.json();
              if (data.profile && data.profile.createdAt) {
                userProf = data.profile;
              }
            } catch (e) {
              // Ignore
            }
          }

          if (!userProf) {
            userProf = {
              id: currentUser.uid,
              name: currentUser.displayName || 'Reader',
              email: currentUser.email || undefined,
              photoURL: currentUser.photoURL || undefined,
              readingMinutes: 10,
              readingDepth: 'Standard',
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
              deliveryTime: '07:00',
              discoveryEnabled: true,
              explicitTopics: ['Technology', 'Science', 'World', 'Climate & Environment'],
              specificInterests: [],
              region: 'Global',
              learnedPreferences: {},
              searchSignals: {},
              likes: [],
              dislikes: [],
              skipped: [],
              onboardingCompleted: false,
              createdAt: new Date().toISOString(),
            };
            saveUserProfileToFirestore(currentUser.uid, userProf).catch((fsErr) => {
              console.warn('[Auth] Firestore profile init skipped (unprovisioned):', fsErr);
            });

            try {
              await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(userProf),
              });
            } catch (e) {
              console.warn('[Auth] Backend profile sync failed:', e);
            }

            if (!userProf.onboardingCompleted) {
              setShowOnboarding(true);
            }
          }

          setProfile(userProf);

          loadSavedArticles();
          loadArchive();
          loadTodayEdition();
        } catch (err) {
          console.error('Error handling auth state:', err);
        }
      } else {
        try {
          const res = await fetch('/api/profile');
          const data = await res.json();
          if (data.profile) {
            setProfile(data.profile);
          }
        } catch (e) {
          console.warn('Failed to load guest profile:', e);
        }
        loadSavedArticles();
        loadArchive();
        loadTodayEdition();
      }
    });

    return () => unsubscribe();
  }, []);

  // Search Action
  const handlePerformSearch = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearchQuery(trimmed);
    setCurrentTab('search');
    setIsSearching(true);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/search', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: trimmed }),
      });
      const data = await res.json();
      if (data.articles) {
        setSearchResults(data.articles);
        setSearchInterpretation(data.interpretation);
      }
    } catch (err) {
      console.error('Search failed:', err);
      showToast('Search encountered an error. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Follow a search interest
  const handleFollowInterest = async (interest: string) => {
    if (!user) {
      setAuthReason('Sign in to follow this interest in tomorrow’s broadsheet edition.');
      setShowAuthModal(true);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/profile/follow-interest', {
        method: 'POST',
        headers,
        body: JSON.stringify({ interest }),
      });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        if (auth.currentUser) {
          await saveUserProfileToFirestore(auth.currentUser.uid, {
            specificInterests: data.profile.specificInterests,
          });
        }
        showToast(`Now following "${interest}" in your daily broadsheet.`);
      }
    } catch (err) {
      console.error('Failed to follow interest:', err);
    }
  };

  // Toggle bookmark save
  const handleToggleSave = async (item: any) => {
    const itemId = item.id || item.articleId;
    const articleId = item.articleId || item.id;
    const isCurrentlySaved = Boolean(
      (item.id && savedItemIds.has(item.id)) ||
      (item.articleId && savedItemIds.has(item.articleId))
    );

    const editionItem: EditionItem = {
      id: item.id || `art-${Date.now()}`,
      articleId: articleId,
      sortOrder: item.sortOrder || 1,
      section: item.section || item.topic || 'World',
      headline: item.headline,
      briefSummary: item.briefSummary || item.excerpt,
      takeaways: item.takeaways || [item.excerpt],
      selectionReason: item.selectionReason || `Saved story from ${item.publisher}`,
      publisher: item.publisher,
      sourceUrl: item.sourceUrl || item.canonicalUrl,
      imageUrl: item.imageUrl,
      publishedAt: item.publishedAt || new Date().toISOString(),
    };

    if (isCurrentlySaved) {
      setSavedItemIds(prev => {
        const next = new Set(prev);
        if (item.id) next.delete(item.id);
        if (item.articleId) next.delete(item.articleId);
        return next;
      });
      setSavedList(prev => prev.filter(s => {
        const matchId = Boolean(item.id && (s.id === item.id || s.item?.id === item.id));
        const matchArtId = Boolean(item.articleId && (s.articleId === item.articleId || s.item?.articleId === item.articleId));
        return !(matchId || matchArtId);
      }));
      showToast('Removed from saved stories.');
      if (user) {
        removeStoryFromFirestore(user.uid, itemId).catch(fsErr => {
          console.warn('[Storage] Firestore cloud remove timed out/failed:', fsErr);
        });
      }
    } else {
      setSavedItemIds(prev => {
        const next = new Set(prev);
        if (item.id) next.add(item.id);
        if (item.articleId) next.add(item.articleId);
        return next;
      });
      const newRecord: SavedArticleRecord = {
        id: itemId,
        userId: user ? user.uid : 'guest',
        articleId: editionItem.articleId,
        item: editionItem,
        savedAt: new Date().toISOString(),
      };
      setSavedList(prev => [newRecord, ...prev.filter(s => s.id !== itemId && s.articleId !== editionItem.articleId)]);
      showToast('Saved to your reading library.');
      if (user) {
        saveStoryToFirestore(user.uid, editionItem).catch(fsErr => {
          console.warn('[Storage] Firestore cloud save timed out/failed:', fsErr);
        });
      }
    }

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/saved/${itemId}/toggle`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ item: editionItem }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast(`⚠️ Server save warning: ${errData.error || 'Database write rejected'}`);
      }
    } catch (e) {
      console.warn('Failed to toggle save on backend:', e);
      showToast('⚠️ Could not connect to backend server for permanent save.');
    }
  };

  // Like / Dislike Feedback (Mutually exclusive & reversible)
  const handleLikeStory = async (item: any) => {
    if (!user) {
      setAuthReason('Sign in to personalize your morning broadsheet with feedback.');
      setShowAuthModal(true);
      return;
    }

    const artId = item.articleId || item.id;
    if (!artId) return;

    const isCurrentlyLiked = Boolean(
      (item.articleId && likedItemIds.has(item.articleId)) ||
      (item.id && likedItemIds.has(item.id))
    );

    if (isCurrentlyLiked) {
      setLikedItemIds(prev => {
        const next = new Set(prev);
        if (item.articleId) next.delete(item.articleId);
        if (item.id) next.delete(item.id);
        return next;
      });
      showToast('Like removed.');
    } else {
      setLikedItemIds(prev => {
        const next = new Set(prev);
        if (item.articleId) next.add(item.articleId);
        if (item.id) next.add(item.id);
        return next;
      });
      setDislikedItemIds(prev => {
        const next = new Set(prev);
        if (item.articleId) next.delete(item.articleId);
        if (item.id) next.delete(item.id);
        return next;
      });
      showToast('Daybreak will feature more stories like this.');

      try {
        const headers = await getAuthHeaders();
        await fetch('/api/interactions', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            articleId: artId,
            topic: item.section || item.topic || 'World',
            action: 'more_like_this',
          }),
        });
      } catch (e) {}
    }
  };

  const handleDislikeStory = async (item: any) => {
    if (!user) {
      setAuthReason('Sign in to personalize your morning broadsheet with feedback.');
      setShowAuthModal(true);
      return;
    }

    const artId = item.articleId || item.id;
    if (!artId) return;

    const isCurrentlyDisliked = Boolean(
      (item.articleId && dislikedItemIds.has(item.articleId)) ||
      (item.id && dislikedItemIds.has(item.id))
    );

    if (isCurrentlyDisliked) {
      setDislikedItemIds(prev => {
        const next = new Set(prev);
        if (item.articleId) next.delete(item.articleId);
        if (item.id) next.delete(item.id);
        return next;
      });
      showToast('Dislike removed.');
    } else {
      setDislikedItemIds(prev => {
        const next = new Set(prev);
        if (item.articleId) next.add(item.articleId);
        if (item.id) next.add(item.id);
        return next;
      });
      setLikedItemIds(prev => {
        const next = new Set(prev);
        if (item.articleId) next.delete(item.articleId);
        if (item.id) next.delete(item.id);
        return next;
      });
      showToast('Daybreak will reduce stories on this subject.');

      try {
        const headers = await getAuthHeaders();
        await fetch('/api/interactions', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            articleId: artId,
            topic: item.section || item.topic || 'World',
            action: 'less_like_this',
          }),
        });
      } catch (e) {}
    }
  };

  // Skip Story (with instant Undo)
  const handleSkipStory = async (item: any) => {
    const artId = item.id || item.articleId;
    setSkippedItemIds(prev => new Set([...prev, artId]));

    showToast('Story hidden from today’s edition.', () => {
      setSkippedItemIds(prev => {
        const next = new Set(prev);
        next.delete(artId);
        return next;
      });
    });

    if (user) {
      try {
        const headers = await getAuthHeaders();
        await fetch('/api/interactions', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            articleId: item.articleId || item.id,
            topic: item.section || item.topic || 'World',
            action: 'skip',
          }),
        });
      } catch (e) {}
    }
  };

  // Open story reader & log read action
  const handleOpenReader = (item: any) => {
    setActiveStory(item);
    if (user) {
      getAuthHeaders().then(headers => {
        fetch('/api/interactions', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            articleId: item.articleId || item.id,
            topic: item.section || item.topic || 'World',
            action: 'read',
          }),
        }).catch(() => {});
      });
    }
  };

  // Download PDF
  const handleDownloadPdf = async (editionId?: string, date?: string) => {
    const targetId = editionId || todayEdition?.id || 'today';
    const downloadUrl = `/api/editions/${targetId}/pdf`;
    try {
      showToast('Preparing your authentic broadsheet PDF...');
      const headers = await getAuthHeaders();
      const res = await fetch(downloadUrl, { headers });
      if (!res.ok) {
        throw new Error(`PDF response ${res.status}`);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `daybreak-${date || todayEdition?.editionDate || 'edition'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
      showToast('Morning broadsheet downloaded successfully.');
    } catch (err) {
      console.warn('[PDF] Fetch download error, falling back to window open:', err);
      window.open(downloadUrl, '_blank');
    }
  };

  // Save personal reflection
  const handleSaveReflection = async (note: string) => {
    if (!todayEdition) return;
    try {
      const headers = await getAuthHeaders();
      await fetch('/api/reflections', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          editionId: todayEdition.id,
          note,
        }),
      });
      setTodayEdition(prev => (prev ? { ...prev, reflectionNote: note } : prev));
      if (user) {
        await saveEditionToFirestore(user.uid, {
          ...todayEdition,
          reflectionNote: note,
        });
      }
    } catch (e) {
      console.error('Failed to save reflection:', e);
    }
  };

  // Regenerate today edition explicitly
  const handleRefreshEdition = async () => {
    setIsRefreshingEdition(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/editions/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ isRegeneration: true }),
      });
      const data = await res.json();
      if (data.edition) {
        setTodayEdition(data.edition);
        if (user) {
          await saveEditionToFirestore(user.uid, data.edition);
        }
        showToast('Generated fresh edition with your latest signals.');
      }
    } catch (err) {
      console.error('Regeneration error:', err);
    } finally {
      setIsRefreshingEdition(false);
    }
  };

  // Update profile
  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    // Optimistically update local profile state immediately
    setProfile(prev => (prev ? { ...prev, ...updates } : (updates as UserProfile)));

    let backendOk = false;
    let firestoreOk = false;
    let errorMessage = '';

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          backendOk = true;
        }
      } else {
        const data = await res.json().catch(() => ({}));
        errorMessage = data.error || 'Server rejected updates';
      }
    } catch (err: any) {
      console.error('Update profile failed:', err);
      errorMessage = err.message || 'Connection error';
    }

    if (user) {
      try {
        await saveUserProfileToFirestore(user.uid, updates);
        firestoreOk = true;
      } catch (fsErr) {
        console.warn('[Storage] Firestore profile write failed:', fsErr);
      }
    }

    if (!backendOk && user && !firestoreOk) {
      showToast(`⚠️ Preferences not saved: ${errorMessage || 'Database write failed'}`);
      throw new Error(errorMessage || 'Failed to persist preferences');
    } else if (user && !firestoreOk) {
      showToast('⚠️ Preferences saved to server; Firestore cloud write timed out.');
    } else {
      showToast('Preferences saved successfully.');
    }
  };

  // Reset learned preferences
  const handleResetLearning = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/profile/reset-learning', {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        if (user) {
          try {
            await saveUserProfileToFirestore(user.uid, {
              learnedPreferences: {},
              searchSignals: {},
              likes: [],
              dislikes: [],
              skipped: [],
            });
          } catch (fsErr) {
            console.warn('[Storage] Firestore reset failed:', fsErr);
            showToast('⚠️ Reset on server; Firestore cloud write timed out.');
          }
        }
        setLikedItemIds(new Set());
        setDislikedItemIds(new Set());
        setSkippedItemIds(new Set());
        showToast('All learned feedback and search signals have been reset.');
      }
    } catch (err) {
      console.error('Reset failed:', err);
      showToast('⚠️ Failed to reset preferences. Please try again.');
    }
  };

  // Navigation route handler
  const renderCurrentView = () => {
    switch (currentTab) {
      case 'home':
        return (
          <HomeView
            onSearch={handlePerformSearch}
            trendingArticles={trendingArticles}
            todayEdition={todayEdition}
            profile={profile}
            onSelectTab={setCurrentTab}
            onOpenReader={handleOpenReader}
            onToggleSave={handleToggleSave}
            savedItemIds={savedItemIds}
            onOpenPdfPreview={() => setShowPdfPreview(true)}
            onDownloadPdf={() => handleDownloadPdf()}
          />
        );

      case 'today':
        return (
          <TodayPaperView
            edition={todayEdition}
            profile={profile}
            onOpenReader={handleOpenReader}
            onToggleSave={handleToggleSave}
            savedItemIds={savedItemIds}
            onSkipItem={handleSkipStory}
            skippedItemIds={skippedItemIds}
            onLikeStory={handleLikeStory}
            onDislikeStory={handleDislikeStory}
            likedItemIds={likedItemIds}
            dislikedItemIds={dislikedItemIds}
            onRefreshEdition={handleRefreshEdition}
            isRefreshing={isRefreshingEdition}
            onOpenPdfPreview={() => setShowPdfPreview(true)}
            onDownloadPdf={() => handleDownloadPdf()}
            onSaveReflection={handleSaveReflection}
          />
        );

      case 'search':
        return (
          <SearchResultsView
            query={searchQuery}
            interpretation={searchInterpretation}
            articles={searchResults}
            isLoading={isSearching}
            onSearch={handlePerformSearch}
            onFollowInterest={handleFollowInterest}
            isFollowingInterest={Boolean(profile?.specificInterests?.includes(searchQuery))}
            profile={profile}
            onOpenReader={handleOpenReader}
            onToggleSave={handleToggleSave}
            savedItemIds={savedItemIds}
            onLikeStory={handleLikeStory}
            onDislikeStory={handleDislikeStory}
            onSkipStory={handleSkipStory}
            likedItemIds={likedItemIds}
            dislikedItemIds={dislikedItemIds}
            skippedItemIds={skippedItemIds}
          />
        );

      case 'trending':
        return (
          <TrendingView
            articles={trendingArticles}
            onOpenReader={handleOpenReader}
            onToggleSave={handleToggleSave}
            savedItemIds={savedItemIds}
          />
        );

      case 'saved':
        return (
          <SavedView
            savedList={savedList}
            onOpenReader={handleOpenReader}
            onRemoveSaved={handleToggleSave}
            onSelectTab={setCurrentTab}
          />
        );

      case 'archive':
        return (
          <ArchiveView
            archive={archive}
            onOpenEdition={ed => {
              setTodayEdition(ed);
              setCurrentTab('today');
            }}
            onDownloadEditionPdf={(id, date) => handleDownloadPdf(id, date)}
            onSelectTab={setCurrentTab}
          />
        );

      case 'about':
        return <AboutView />;

      case 'settings':
        return (
          <SettingsView
            profile={profile}
            user={user}
            onUpdateProfile={handleUpdateProfile}
            onResetLearning={handleResetLearning}
            onSignOut={signOutUser}
            onSelectTab={setCurrentTab}
          />
        );

      case 'privacy':
        return <LegalViews type="privacy" onSelectTab={setCurrentTab} />;

      case 'terms':
        return <LegalViews type="terms" onSelectTab={setCurrentTab} />;

      default:
        return <NotFoundView onGoHome={() => setCurrentTab('home')} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1917] flex flex-col font-sans selection:bg-[#8C2D19] selection:text-[#FAF9F6] animate-page-fade-in">
      {/* Masthead Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        profile={profile}
        user={user}
        onSignIn={() => {
          setAuthReason('');
          setShowAuthModal(true);
        }}
        onSignOut={signOutUser}
        onOpenOnboarding={() => setShowOnboarding(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {renderCurrentView()}
      </main>

      {/* Footer */}
      <Footer onSelectTab={setCurrentTab} />

      {/* Modals */}
      <StoryReaderModal
        item={activeStory}
        onClose={() => setActiveStory(null)}
        onToggleSave={handleToggleSave}
        isSaved={Boolean(activeStory && (savedItemIds.has(activeStory.id) || savedItemIds.has(activeStory.articleId)))}
        onLikeStory={handleLikeStory}
        onDislikeStory={handleDislikeStory}
        onSkipStory={handleSkipStory}
        isLiked={Boolean(activeStory && ((activeStory.articleId && likedItemIds.has(activeStory.articleId)) || (activeStory.id && likedItemIds.has(activeStory.id))))}
        isDisliked={Boolean(activeStory && ((activeStory.articleId && dislikedItemIds.has(activeStory.articleId)) || (activeStory.id && dislikedItemIds.has(activeStory.id))))}
      />

      <NewspaperPdfPreviewModal
        edition={todayEdition}
        readerName={profile?.name || user?.displayName || 'Reader'}
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        onDownloadPdf={() => handleDownloadPdf()}
      />

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleUpdateProfile}
        initialProfile={profile}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSignIn={async () => {
          await signInWithGoogle();
        }}
        onDemoSignIn={() => {
          const demoUser = {
            uid: 'demo-reader-' + Date.now().toString(36),
            displayName: 'Demo Reader',
            email: 'demo-reader@daybreak.local',
          };
          setUser(demoUser as any);
          const demoProfile: UserProfile = {
            id: demoUser.uid,
            name: demoUser.displayName,
            email: demoUser.email,
            readingMinutes: 10,
            readingDepth: 'Standard',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            deliveryTime: '07:00',
            discoveryEnabled: true,
            explicitTopics: ['Technology', 'Science', 'World', 'Climate & Environment'],
            specificInterests: ['AI Startups', 'Pakistan cricket'],
            region: 'Global',
            learnedPreferences: {},
            searchSignals: {},
            likes: [],
            dislikes: [],
            skipped: [],
            onboardingCompleted: true,
            createdAt: new Date().toISOString(),
          };
          setProfile(demoProfile);
          showToast('Signed in as Demo Reader. All personalized broadsheet features enabled!');
        }}
        reasonMessage={authReason}
      />

      {/* Toast Feedback with Undo */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C1917] text-[#FAF9F6] px-4 py-3 rounded-lg shadow-xl text-xs flex items-center gap-3 border border-[#3E3A36] animate-toast-in">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <span>{toast.message}</span>
          {toast.onUndo && (
            <button
              onClick={() => {
                toast.onUndo?.();
                setToast(null);
              }}
              className="ml-2 text-[#FAF9F6] hover:text-[#8C2D19] font-semibold underline flex items-center gap-1 focus:outline-none"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
