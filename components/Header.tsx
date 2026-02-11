
import React from 'react';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  hiddenCount: number;
  onResetHidden: () => void;
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  isDarkMode, 
  onToggleDarkMode, 
  hiddenCount, 
  onResetHidden,
  onOpenSettings 
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800 shadow-sm px-4 py-3 transition-colors duration-300">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
          <i className="fas fa-newspaper"></i>
          <span className="dark:text-white">News Aggregator</span>
        </h1>
        <div className="flex items-center gap-2">
          {/* 非表示ソースがある場合のインジケーター */}
          {hiddenCount > 0 && (
            <button 
              onClick={onResetHidden}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 text-xs font-black mr-1 hover:bg-red-200 dark:hover:bg-red-900/60 transition-all border border-red-200 dark:border-red-800"
              title="すべての非表示設定をリセット"
            >
              <i className="fas fa-eye-slash"></i>
              <span>{hiddenCount}</span>
            </button>
          )}

          {/* 設定ボタン */}
          <button
            onClick={onOpenSettings}
            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            aria-label="Settings"
          >
            <i className="fas fa-cog text-lg"></i>
          </button>
          
          <button 
            onClick={onToggleDarkMode}
            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            aria-label="Toggle Theme"
          >
            <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-lg`}></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
