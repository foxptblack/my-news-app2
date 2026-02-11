
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import NewsCard from './components/NewsCard';
import TabSettingsModal from './components/TabSettingsModal';
import { NewsArticle, TabConfig } from './types';
import { DEFAULT_TABS, DEFAULT_MAX_TABS } from './constants';

const READ_IDS_KEY = 'news_aggregator_read_ids';
const HIDDEN_SOURCES_KEY = 'news_aggregator_hidden_sources';
const TABS_CONFIG_KEY = 'news_aggregator_tabs_config';
const MAX_TABS_CONFIG_KEY = 'news_aggregator_max_tabs';
// キャッシュの有効期限（ミリ秒）: 5分
const CACHE_DURATION = 5 * 60 * 1000;

const App: React.FC = () => {
  // Tabs State (Load from local storage or default)
  const [tabs, setTabs] = useState<TabConfig[]>(() => {
    if (typeof window !== 'undefined') {
      const savedTabs = localStorage.getItem(TABS_CONFIG_KEY);
      if (savedTabs) {
        try {
          return JSON.parse(savedTabs);
        } catch (e) {
          console.error("Tabs config parse error", e);
        }
      }
    }
    return DEFAULT_TABS;
  });

  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);
  const [newsList, setNewsList] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cache State (useRef to persist without re-renders)
  const newsCache = useRef<{ [key: string]: { data: NewsArticle[], timestamp: number } }>({});
  
  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Filter States
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [hiddenSources, setHiddenSources] = useState<Set<string>>(new Set());
  const [showHiddenArticles, setShowHiddenArticles] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Max Tabs State
  const [maxTabs, setMaxTabs] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const savedMax = localStorage.getItem(MAX_TABS_CONFIG_KEY);
      if (savedMax) {
        const parsed = parseInt(savedMax, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    }
    return DEFAULT_MAX_TABS;
  });

  // Load from LocalStorage on mount (Read/Hidden IDs)
  useEffect(() => {
    const savedRead = localStorage.getItem(READ_IDS_KEY);
    if (savedRead) {
      try {
        const parsed = JSON.parse(savedRead);
        if (Array.isArray(parsed)) setReadIds(new Set(parsed));
      } catch (e) { console.error("Read IDs parse error", e); }
    }
    
    const savedHidden = localStorage.getItem(HIDDEN_SOURCES_KEY);
    if (savedHidden) {
      try {
        const parsed = JSON.parse(savedHidden);
        if (Array.isArray(parsed)) setHiddenSources(new Set(parsed));
      } catch (e) { console.error("Hidden sources parse error", e); }
    }
  }, []);

  // Sync States to LocalStorage
  useEffect(() => {
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(Array.from(readIds)));
  }, [readIds]);

  useEffect(() => {
    localStorage.setItem(HIDDEN_SOURCES_KEY, JSON.stringify(Array.from(hiddenSources)));
  }, [hiddenSources]);

  // Sync Tabs to LocalStorage
  useEffect(() => {
    localStorage.setItem(TABS_CONFIG_KEY, JSON.stringify(tabs));
  }, [tabs]);

  // Sync Max Tabs to LocalStorage
  useEffect(() => {
    localStorage.setItem(MAX_TABS_CONFIG_KEY, maxTabs.toString());
  }, [maxTabs]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const handleSaveSettings = (newTabs: TabConfig[], newMaxTabs: number) => {
    setTabs(newTabs);
    setMaxTabs(newMaxTabs);
    // タブ設定変更時はキャッシュをクリアして再取得
    newsCache.current = {}; 
    setNewsList([]); 
    fetchNews(activeTabId, newTabs);
  };

  const markAsRead = useCallback((id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const hideSource = useCallback((source: string) => {
    setHiddenSources(prev => {
      const next = new Set(prev);
      next.add(source);
      return next;
    });
  }, []);

  const unhideSource = useCallback((source: string) => {
    setHiddenSources(prev => {
      const next = new Set(prev);
      next.delete(source);
      return next;
    });
  }, []);

  const resetHiddenSources = useCallback(() => {
    localStorage.removeItem(HIDDEN_SOURCES_KEY);
    setHiddenSources(new Set());
    setShowHiddenArticles(false);
  }, []);

  // RSS URL生成ロジック
  const getRssUrl = (keyword: string) => {
    if (keyword.startsWith('http://') || keyword.startsWith('https://')) {
      return keyword;
    }
    return `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=ja&gl=JP&ceid=JP:ja`;
  };

  // HTML文字列から最初の画像URLを抽出するヘルパー関数
  const extractImageFromHtml = (htmlContent: string): string | null => {
    if (!htmlContent) return null;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const img = doc.querySelector('img');
      return img ? img.getAttribute('src') : null;
    } catch (e) {
      console.warn('Failed to parse HTML for image extraction', e);
      return null;
    }
  };

  const fetchNews = useCallback(async (tabId: string, currentTabs: TabConfig[] = tabs) => {
    setLoading(true);
    setError(null);
    
    const activeTab = currentTabs.find(t => t.id === tabId);
    if (!activeTab) {
      setLoading(false);
      return;
    }

    // キャッシュチェック: データがあり、かつ有効期限内なら再利用
    const cached = newsCache.current[tabId];
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      console.log(`Using cached data for ${tabId}`);
      setNewsList(cached.data);
      setLoading(false);
      return;
    }

    try {
      const rssUrl = getRssUrl(activeTab.keyword);
      // countパラメータを削除して安定性を優先（無料API制限対策）
      // ※多くの無料RSSフィードは最大10件しか返しません
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      if (data.status !== 'ok') throw new Error(data.message || 'Failed to fetch RSS');

      const mappedNews: NewsArticle[] = data.items.map((item: any, index: number) => {
        // HTMLタグを除去して要約テキストを作成
        const cleanSummary = item.description 
          ? item.description.replace(/<[^>]*>?/gm, '').substring(0, 100) + '...'
          : '記事の要約はありません。';

        let title = item.title;
        let source = item.author || data.feed.title || 'Unknown Source';
        
        if (title.includes(' - ')) {
          const parts = title.split(' - ');
          source = parts.pop();
          title = parts.join(' - ');
        }

        // --- 画像URLの決定ロジック ---
        let imageUrl = null;

        // 1. RSS標準のサムネイルフィールドがあれば最優先
        if (item.thumbnail) {
          imageUrl = item.thumbnail;
        } 
        // 2. enclosure（添付ファイル）があれば次点
        else if (item.enclosure?.link) {
          imageUrl = item.enclosure.link;
        } 
        // 3. description（概要HTML）の中にimgタグがあれば抽出
        else if (item.description) {
          imageUrl = extractImageFromHtml(item.description);
        }
        // 4. content（本文HTML）の中にimgタグがあれば抽出
        // ※ rss2jsonでは 'content' プロパティで本文が返ることがある
        if (!imageUrl && item.content) {
          imageUrl = extractImageFromHtml(item.content);
        }

        // 5. 上記すべてで見つからない場合はフォールバック画像（ランダム生成）
        if (!imageUrl) {
          imageUrl = `https://picsum.photos/seed/${encodeURIComponent(item.title)}/800/450`;
        }

        const dateObj = new Date(item.pubDate);

        return {
          id: item.guid || `${tabId}-${index}-${item.pubDate}`,
          category: tabId,
          title: title,
          date: dateObj.toLocaleDateString('ja-JP'),
          pubDate: dateObj.toISOString(),
          summary: cleanSummary,
          imageUrl: imageUrl,
          source: source.trim(),
          link: item.link
        };
      })
      // ここでソートを追加: pubDateに基づいて新しい順（降順）に並び替え
      .sort((a: NewsArticle, b: NewsArticle) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 12); // ソート後に上位12件を取得

      // キャッシュに保存
      newsCache.current[tabId] = {
        data: mappedNews,
        timestamp: Date.now()
      };

      setNewsList(mappedNews);
    } catch (err) {
      console.error('Fetch error:', err);
      // エラー時でもキャッシュがあればそれを表示してあげる（フォールバック）
      if (newsCache.current[tabId]) {
        console.log('Falling back to cache due to error');
        setNewsList(newsCache.current[tabId].data);
        setError('最新の取得に失敗しましたが、以前のデータを表示しています。');
      } else {
        setError('ニュースの読み込みに失敗しました。時間をおいて再試行してください。');
      }
    } finally {
      setLoading(false);
    }
  }, [tabs]); 

  // タブ切り替え時に取得
  useEffect(() => {
    fetchNews(activeTabId);
  }, [activeTabId]); 

  const visibleNews = useMemo(() => {
    if (showHiddenArticles) return newsList;
    return newsList.filter(article => !hiddenSources.has(article.source));
  }, [newsList, hiddenSources, showHiddenArticles]);

  const activeTabLabel = tabs.find(t => t.id === activeTabId)?.label || '';

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] transition-colors duration-300 pb-20">
        <Header 
          isDarkMode={isDarkMode} 
          onToggleDarkMode={toggleDarkMode} 
          hiddenCount={hiddenSources.size}
          onResetHidden={resetHiddenSources}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
        <TabNavigation 
          tabs={tabs} 
          activeTabId={activeTabId} 
          onTabChange={setActiveTabId} 
        />

        <main className="w-full px-4 py-4">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3 gap-3">
            <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-3 bg-blue-500 rounded-full"></span>
              {loading ? 'LOADING...' : `${activeTabLabel} (${visibleNews.length})`}
            </h2>
            
            <div className="flex items-center gap-4">
              {hiddenSources.size > 0 && (
                <>
                  <button 
                    onClick={() => setShowHiddenArticles(prev => !prev)}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all flex items-center gap-2 ${
                      showHiddenArticles 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <i className={`fas ${showHiddenArticles ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                    {showHiddenArticles ? '表示中' : '非表示ソース'}
                  </button>

                  <button 
                    onClick={resetHiddenSources}
                    className="text-[10px] font-bold text-red-500 dark:text-red-400 hover:text-red-600 flex items-center bg-red-50 dark:bg-red-900/10 px-2 py-1.5 rounded border border-red-100 dark:border-red-900/30"
                  >
                    <i className="fas fa-undo-alt mr-1"></i>
                    リセット
                  </button>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-blue-500">
              <div className="w-10 h-10 border-4 border-blue-100 dark:border-gray-800 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-medium animate-pulse text-gray-500 dark:text-gray-400">ニュースを取得中...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-red-500 text-center">
              <i className="fas fa-exclamation-triangle text-5xl mb-4 opacity-20"></i>
              <p className="font-bold mb-2">{error}</p>
              <button 
                onClick={() => {
                  // 強制リフレッシュのためにキャッシュを削除して再取得
                  delete newsCache.current[activeTabId];
                  fetchNews(activeTabId);
                }} 
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 text-sm"
              >
                再試行する
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleNews.map((article) => (
                  <NewsCard 
                    key={article.id}
                    article={article} 
                    isRead={readIds.has(article.id)} 
                    isHidden={hiddenSources.has(article.source)}
                    onMarkAsRead={() => markAsRead(article.id)}
                    onHideSource={() => hideSource(article.source)}
                    onUnhideSource={() => unhideSource(article.source)}
                  />
                ))}
              </div>
              
              {visibleNews.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white dark:bg-[#222] rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 mt-4">
                  <i className="fas fa-newspaper text-5xl mb-4 opacity-30 text-blue-500"></i>
                  <p className="font-bold text-gray-600 dark:text-gray-300">記事が見つかりません</p>
                  <p className="text-xs mt-2 text-gray-400">キーワードを変更してみてください</p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* FAB: 強制更新ボタン */}
        <div className="fixed bottom-6 right-6 z-40">
          <button 
            onClick={() => {
              // 強制リフレッシュ
              delete newsCache.current[activeTabId];
              fetchNews(activeTabId);
            }} 
            disabled={loading} 
            className={`w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 transition-all active:scale-90 ${loading ? 'opacity-50' : ''}`}
          >
            <i className={`fas fa-sync-alt text-xl ${loading ? 'animate-spin' : ''}`}></i>
          </button>
        </div>

        {/* Settings Modal */}
        <TabSettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          tabs={tabs}
          maxTabs={maxTabs}
          onSave={handleSaveSettings}
        />
      </div>
    </div>
  );
};

export default App;
