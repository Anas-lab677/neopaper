import React, { useState, useEffect } from 'react';
import { X, Rss, Plus, CheckCircle, AlertCircle, RefreshCw, Power } from 'lucide-react';
import { FeedSource, Topic } from '../../shared/types.ts';

interface FeedManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFeedsUpdated: () => void;
}

export const FeedManagerModal: React.FC<FeedManagerModalProps> = ({
  isOpen,
  onClose,
  onFeedsUpdated,
}) => {
  const [feeds, setFeeds] = useState<FeedSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState<Topic>('Technology');
  const [isAdding, setIsAdding] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchFeeds = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/feeds');
      const data = await res.json();
      if (data.feeds) {
        setFeeds(data.feeds);
      }
    } catch (err) {
      console.error('Failed to load feeds:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFeeds();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleFeed = async (feed: FeedSource) => {
    try {
      const res = await fetch('/api/feeds/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: feed.id, active: !feed.active }),
      });
      const data = await res.json();
      if (data.success) {
        setFeeds(prev =>
          prev.map(f => (f.id === feed.id ? { ...f, active: !feed.active } : f))
        );
        onFeedsUpdated();
        setStatusMessage(
          `Feed "${feed.name}" is now ${!feed.active ? 'active' : 'disabled'}.`
        );
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to toggle feed:', err);
    }
  };

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;

    setIsAdding(true);
    try {
      const res = await fetch('/api/feeds/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          url: newUrl.trim(),
          category: newCategory,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeeds(prev => [...prev, data.feed]);
        setNewName('');
        setNewUrl('');
        setStatusMessage(`Added new feed "${data.feed.name}" to allowlist.`);
        onFeedsUpdated();
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to add feed:', err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#252B27]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#F7F5EF] border border-[#E5DFD3] rounded-lg shadow-2xl max-w-3xl w-full p-6 sm:p-8 my-auto relative">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5DFD3] mb-6">
          <div className="flex items-center gap-2">
            <Rss className="w-5 h-5 text-[#B65B3D]" />
            <div>
              <h2 className="text-xl font-serif font-bold text-[#252B27]">
                Verified Publisher Allowlist
              </h2>
              <p className="text-xs text-[#616962]">
                Configure real server RSS & Atom feeds, inspect status, or simulate failure.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#616962] hover:text-[#252B27] p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMessage && (
          <div className="mb-4 p-2.5 rounded bg-[#EDF2EB] border border-[#7D8B72]/30 text-xs text-[#252B27] flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#7D8B72]" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Allowlist Feed Table */}
        <div className="mb-6 max-h-72 overflow-y-auto border border-[#E5DFD3] rounded bg-white divide-y divide-[#E5DFD3]">
          {feeds.map(feed => (
            <div
              key={feed.id}
              className={`p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                !feed.active ? 'bg-slate-50 opacity-60' : ''
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#252B27]">{feed.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#616962] px-1.5 py-0.5 rounded bg-[#F7F5EF]">
                    {feed.category}
                  </span>
                  {feed.active ? (
                    <span className="text-[10px] text-[#7D8B72] flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#616962]">Disabled</span>
                  )}
                </div>
                <div className="text-[#616962] font-mono text-[11px] truncate max-w-sm sm:max-w-md">
                  {feed.url}
                </div>
                {feed.errorMessage && (
                  <div className="text-[11px] text-[#B65B3D] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Error: {feed.errorMessage}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleToggleFeed(feed)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                    feed.active
                      ? 'border-[#B65B3D] text-[#B65B3D] hover:bg-[#B65B3D]/10'
                      : 'border-[#7D8B72] text-[#7D8B72] hover:bg-[#7D8B72]/10'
                  }`}
                  title={feed.active ? 'Disable this feed' : 'Enable this feed'}
                >
                  <Power className="w-3 h-3" />
                  <span>{feed.active ? 'Disable' : 'Enable'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add custom feed form */}
        <div className="border-t border-[#E5DFD3] pt-5">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-[#616962] mb-3">
            Add a New Publisher RSS Feed
          </h3>
          <form onSubmit={handleAddFeed} className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Publisher Name (e.g. Wired)"
              className="sm:col-span-4 px-3 py-2 bg-white border border-[#E5DFD3] rounded focus:outline-none focus:border-[#B65B3D]"
              required
            />
            <input
              type="url"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="https://.../rss.xml"
              className="sm:col-span-5 px-3 py-2 bg-white border border-[#E5DFD3] rounded focus:outline-none focus:border-[#B65B3D]"
              required
            />
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as Topic)}
              className="sm:col-span-2 px-2 py-2 bg-white border border-[#E5DFD3] rounded"
            >
              <option value="Technology">Technology</option>
              <option value="Science">Science</option>
              <option value="Climate">Climate</option>
              <option value="Business">Business</option>
              <option value="World">World</option>
              <option value="Culture">Culture</option>
              <option value="Sports">Sports</option>
            </select>
            <button
              type="submit"
              disabled={isAdding}
              className="sm:col-span-1 px-3 py-2 rounded bg-[#252B27] text-white hover:bg-black font-medium flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
