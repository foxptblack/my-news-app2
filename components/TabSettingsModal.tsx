
import React, { useState, useEffect } from 'react';
import { TabConfig } from '../types';
import { MAX_TABS } from '../constants';

interface TabSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: TabConfig[];
  onSave: (newTabs: TabConfig[]) => void;
}

const TabSettingsModal: React.FC<TabSettingsModalProps> = ({ isOpen, onClose, tabs, onSave }) => {
  // 編集中のタブリストの状態
  const [editingTabs, setEditingTabs] = useState<TabConfig[]>(tabs);
  // ドラッグ中のアイテムのインデックス
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // モーダルが開いた時に、親コンポーネントから渡されたtabsをコピーして編集用stateにセット
  useEffect(() => {
    if (isOpen) {
      // オブジェクトのディープコピーを作成し、編集が保存されるまで元のデータに影響を与えないようにする
      setEditingTabs(JSON.parse(JSON.stringify(tabs))); 
    }
  }, [isOpen, tabs]);

  if (!isOpen) return null;

  // 各入力フィールドの変更ハンドラ
  const handleChange = (index: number, field: keyof TabConfig, value: string) => {
    const newTabs = [...editingTabs];
    newTabs[index] = { ...newTabs[index], [field]: value };
    setEditingTabs(newTabs);
  };

  // 新しいタブを追加する
  const handleAddTab = () => {
    if (editingTabs.length >= MAX_TABS) {
      return;
    }
    const newTab: TabConfig = {
      id: `tab-${Date.now()}`,
      label: '新規タブ',
      icon: 'fa-hashtag',
      keyword: 'ニュース'
    };
    setEditingTabs([...editingTabs, newTab]);
  };

  // タブを削除する
  const handleDeleteTab = (index: number) => {
    if (editingTabs.length <= 1) {
      alert("少なくとも1つのタブが必要です。");
      return;
    }
    const newTabs = editingTabs.filter((_, i) => i !== index);
    setEditingTabs(newTabs);
  };

  // 編集内容を保存してモーダルを閉じる
  const handleSave = () => {
    onSave(editingTabs);
    onClose();
  };

  // ドラッグ開始時の処理
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData('text/plain', index.toString());
    
    // ドラッグ中の見た目を調整
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '0.4';
    }
  };

  // ドラッグ中の処理（リアルタイム並び替え）
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault(); 
    if (draggedIndex === null || draggedIndex === index) return;

    const newTabs = [...editingTabs];
    const draggedItem = newTabs[draggedIndex];
    // 配列内での移動処理
    newTabs.splice(draggedIndex, 1);
    newTabs.splice(index, 0, draggedItem);

    setEditingTabs(newTabs);
    setDraggedIndex(index);
  };

  // ドラッグ終了時の処理
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedIndex(null);
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '1';
    }
  };

  // モバイル用：ボタンによる並び替え
  const moveTab = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === editingTabs.length - 1) return;

    const newTabs = [...editingTabs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // 要素の入れ替え
    [newTabs[index], newTabs[targetIndex]] = [newTabs[targetIndex], newTabs[index]];
    setEditingTabs(newTabs);
  };

  // 入力がURLかどうかを簡易判定（RSSアイコン表示用）
  const isUrl = (str: string) => str.trim().startsWith('http://') || str.trim().startsWith('https://');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
        {/* ヘッダー部分 */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#222]">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <i className="fas fa-sliders-h text-blue-500"></i>
              タブの管理
              {/* タブ数のカウント表示 */}
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                editingTabs.length >= MAX_TABS 
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {editingTabs.length} / {MAX_TABS}
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              ドラッグして並び替え、または内容を編集できます
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        {/* コンテンツ部分（スクロール可能） */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-100 dark:bg-[#121212]">
          {editingTabs.map((tab, index) => {
            const isRss = isUrl(tab.keyword);
            const isDragging = draggedIndex === index;

            return (
              <div 
                key={tab.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`group bg-white dark:bg-[#262626] rounded-xl border shadow-sm transition-all duration-200 overflow-hidden
                  ${isDragging ? 'border-blue-500 shadow-lg ring-2 ring-blue-500/20 z-10 scale-[1.02]' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
                `}
              >
                <div className="flex items-stretch">
                  {/* ドラッグハンドル */}
                  <div className="w-10 bg-gray-50 dark:bg-[#333] border-r border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <i className="fas fa-grip-vertical"></i>
                  </div>

                  {/* 入力エリア */}
                  <div className="flex-1 p-4 grid gap-4">
                    {/* 上段: ラベルと操作ボタン */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                          タブ名
                        </label>
                        <div className="relative">
                          <i className={`fas ${tab.icon} absolute left-3 top-1/2 -translate-y-1/2 text-gray-400`}></i>
                          <input
                            type="text"
                            value={tab.label}
                            onChange={(e) => handleChange(index, 'label', e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-bold text-gray-800 dark:text-gray-200"
                            placeholder="タブの名前"
                          />
                        </div>
                      </div>

                      {/* モバイル用並び替え・削除ボタン */}
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col gap-1 mr-2 sm:hidden">
                           <button 
                             type="button"
                             onClick={() => moveTab(index, 'up')}
                             disabled={index === 0}
                             className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 dark:bg-[#333] text-gray-500 disabled:opacity-30"
                           >
                             <i className="fas fa-chevron-up text-xs"></i>
                           </button>
                           <button 
                             type="button"
                             onClick={() => moveTab(index, 'down')}
                             disabled={index === editingTabs.length - 1}
                             className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 dark:bg-[#333] text-gray-500 disabled:opacity-30"
                           >
                             <i className="fas fa-chevron-down text-xs"></i>
                           </button>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleDeleteTab(index)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                          title="削除"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>

                    {/* 下段: キーワード/URL入力 */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          ソース設定
                        </label>
                        {/* ソースタイプのインジケーター */}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          isRss 
                            ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800' 
                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                        }`}>
                          {isRss ? <><i className="fas fa-rss mr-1"></i>RSS Feed</> : <><i className="fas fa-search mr-1"></i>Search</>}
                        </span>
                      </div>
                      <div className="relative group/input">
                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                          isRss ? 'text-orange-500' : 'text-blue-500'
                        }`}>
                          <i className={`fas ${isRss ? 'fa-rss' : 'fa-search'}`}></i>
                        </div>
                        <input
                          type="text"
                          value={tab.keyword}
                          onChange={(e) => handleChange(index, 'keyword', e.target.value)}
                          className={`w-full pl-10 pr-3 py-2 rounded-lg border focus:ring-2 outline-none transition-all text-sm font-mono
                            ${isRss 
                              ? 'bg-orange-50/30 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/50 focus:ring-orange-500 text-orange-900 dark:text-orange-100' 
                              : 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/50 focus:ring-blue-500 text-blue-900 dark:text-blue-100'
                            }
                          `}
                          placeholder="キーワード または RSS URL (https://...)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 追加ボタン */}
          <button 
            type="button"
            onClick={handleAddTab}
            disabled={editingTabs.length >= MAX_TABS}
            className={`w-full py-4 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 
              ${editingTabs.length >= MAX_TABS 
                ? 'border-gray-200 bg-gray-50 text-gray-300 dark:border-gray-800 dark:bg-[#222] dark:text-gray-600 cursor-not-allowed' 
                : 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-bold hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 bg-gray-50 dark:bg-[#1a1a1a]'
              }`}
          >
            {editingTabs.length >= MAX_TABS ? (
               <>
                 <i className="fas fa-ban"></i>
                 これ以上追加できません（最大{MAX_TABS}個）
               </>
            ) : (
               <>
                 <i className="fas fa-plus-circle"></i>
                 新しいタブを追加
               </>
            )}
          </button>
        </div>

        {/* フッター（アクションボタン） */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#222] flex justify-between items-center gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            キャンセル
          </button>
          <div className="flex gap-3">
            {/* 保存ボタン */}
            <button 
              type="button"
              onClick={handleSave}
              className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2"
            >
              <i className="fas fa-save"></i>
              設定を保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabSettingsModal;
