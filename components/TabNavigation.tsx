
import React from 'react';
import { TabConfig } from '../types';

interface TabNavigationProps {
  tabs: TabConfig[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ tabs, activeTabId, onTabChange }) => {
  return (
    <nav className="sticky top-[53px] z-40 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar transition-colors duration-300">
      <div className="flex w-full">
        {tabs.map((tab) => {
          const isActive = activeTabId === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 min-w-[120px] flex flex-col items-center py-2 px-1 transition-colors duration-200 border-b-2 ${
                isActive
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <i className={`fas ${tab.icon} text-lg mb-1`}></i>
              <span className="text-xs font-medium whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TabNavigation;
