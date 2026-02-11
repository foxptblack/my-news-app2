
import React from 'react';
import { NewsArticle } from '../types';

interface NewsCardProps {
  article: NewsArticle;
  isRead?: boolean;
  isHidden?: boolean;
  onHideSource?: () => void;
  onUnhideSource?: () => void;
  onMarkAsRead?: () => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ 
  article, 
  isRead = false, 
  isHidden = false,
  onHideSource, 
  onUnhideSource,
  onMarkAsRead 
}) => {
  const now = new Date();
  const pubDate = new Date(article.pubDate);
  const diffTime = Math.abs(now.getTime() - pubDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const isNew = diffDays <= 1;
  const isOld = diffDays >= 7;

  // 記事への遷移と既読マーク
  const handleArticleClick = () => {
    if (isHidden) return; // 非表示状態ならクリック無効
    if (onMarkAsRead) onMarkAsRead();
    window.open(article.link, '_blank', 'noopener,noreferrer');
  };

  return (
    <article 
      className={`bg-white dark:bg-[#262626] rounded-xl overflow-hidden shadow-sm border transition-all duration-300 flex p-3 gap-4 group h-full relative 
        ${isHidden 
          ? 'opacity-40 grayscale border-gray-200 dark:border-gray-800 scale-[0.98]' 
          : 'border-gray-100 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-700 shadow-md shadow-transparent hover:shadow-blue-500/10'
        }
        ${isOld && !isHidden ? 'opacity-80' : ''}
      `}
    >
      {/* 非表示ラベル (オーバーレイ) */}
      {isHidden && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <span className="bg-gray-800/80 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-widest border border-gray-600">
            HIDDEN SOURCE
          </span>
        </div>
      )}

      {/* 画像エリア */}
      <div 
        onClick={handleArticleClick}
        className={`relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 ${!isHidden && 'cursor-pointer'} ${isOld ? 'grayscale-[0.5]' : ''}`}
      >
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        {isRead && !isHidden && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
            <span className="bg-white/90 dark:bg-gray-800/90 text-gray-500 dark:text-gray-400 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase">Read</span>
          </div>
        )}
      </div>

      {/* テキストコンテンツエリア */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-y-1 mb-1.5">
            <div className="flex items-center gap-2">
              <div className="flex items-center overflow-hidden rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 ${isHidden ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'}`}>
                  <i className="fas fa-bullhorn text-[8px]"></i>
                  {article.source}
                </span>
                
                {/* 改善された非表示/表示ボタン */}
                {isHidden ? (
                  <button 
                    title="このソースを表示する"
                    className="bg-green-500 text-white w-7 h-5 flex items-center justify-center transition-colors hover:bg-green-600 active:scale-95"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (onUnhideSource) onUnhideSource();
                    }}
                  >
                    <i className="fas fa-eye text-[10px]"></i>
                  </button>
                ) : (
                  <button 
                    title="このソースを非表示にする"
                    className="bg-red-50 dark:bg-red-900/20 text-red-500 w-7 h-5 flex items-center justify-center transition-colors hover:bg-red-500 hover:text-white active:scale-95 border-l border-gray-200 dark:border-gray-700"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (onHideSource) onHideSource();
                    }}
                  >
                    <i className="fas fa-eye-slash text-[10px]"></i>
                  </button>
                )}
              </div>
            </div>
            <span className={`text-[10px] font-medium flex items-center gap-1 ${isHidden ? 'text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
              <i className="far fa-clock text-[9px]"></i>
              {article.date}
            </span>
          </div>

          <h2 
            onClick={handleArticleClick}
            className={`text-sm sm:text-base font-bold leading-tight mb-1 line-clamp-2 transition-colors ${!isHidden && 'cursor-pointer'} ${
            isRead || isOld || isHidden
              ? 'text-gray-400 dark:text-gray-500' 
              : 'text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'
          }`}>
            {isNew && !isRead && !isHidden && (
              <span className="inline-block bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded mr-1.5 align-middle animate-pulse">
                NEW
              </span>
            )}
            {article.title}
          </h2>

          <p 
            onClick={handleArticleClick}
            className={`text-xs line-clamp-2 sm:line-clamp-3 ${!isHidden && 'cursor-pointer'} ${
            isRead || isOld || isHidden ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {article.summary}
          </p>
        </div>
        
        <div className="flex items-center justify-end mt-1 gap-3">
          <div className="flex items-center gap-2">
            {!isOld && !isRead && !isHidden && (
              <span className="text-[10px] text-blue-500 dark:text-blue-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                READ NOW <i className="fas fa-arrow-right ml-0.5"></i>
              </span>
            )}
            {!isHidden && (
              <button 
                className={`transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${isRead || isOld ? 'text-gray-200 dark:text-gray-800' : 'text-gray-300 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400'}`} 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <i className={`${isRead ? 'fas' : 'far'} fa-bookmark text-sm ${isRead ? 'text-blue-400' : ''}`}></i>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default NewsCard;
