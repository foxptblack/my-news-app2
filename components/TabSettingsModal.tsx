
import React, { useState, useEffect } from 'react';
import { TabConfig } from '../types';

interface TabSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: TabConfig[];
  maxTabs: number;
  onSave: (newTabs: TabConfig[], newMaxTabs: number) => void;
}

const TabSettingsModal: React.FC<TabSettingsModalProps> = ({ isOpen, onClose, tabs, maxTabs, onSave }) => {
  // 編集中のタブリストの状態
  const [editingTabs, setEditingTabs] = useState<TabConfig[]>(tabs);
  // 編集中の最大タブ数設定
  const [editingMaxTabs, setEditingMaxTabs] = useState<number>(maxTabs);
  
  // --- ドラッグ＆ドロップ用の状態 ---
  // 現在ドラッグされているアイテムのインデックス
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  // ドラッグ可能状態の制御フラグ（入力フィールドでのテキスト選択を邪魔しないため）
  const [isDragEnabled, setIsDragEnabled] = useState(false);

  // モーダルが開いた時に、親コンポーネントから渡されたデータを編集用stateにコピー
  useEffect(() => {
    if (isOpen) {
      // オブジェクトのディープコピーを作成し、保存するまで元のデータに影響を与えないようにする
      setEditingTabs(JSON.parse(JSON.stringify(tabs))); 
      setEditingMaxTabs(maxTabs);
    }
  }, [isOpen, tabs, maxTabs]);

  if (!isOpen) return null;

  // 各入力フィールドの変更ハンドラ
  const handleChange = (index: number, field: keyof TabConfig, value: string) => {
    const newTabs = [...editingTabs];
    newTabs[index] = { ...newTabs[index], [field]: value };
    setEditingTabs(newTabs);
  };

  // 新しいタブを追加する処理
  const handleAddTab = () => {
    if (editingTabs.length >= editingMaxTabs) {
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

  // タブを削除する処理
  const handleDeleteTab = (index: number) => {
    if (editingTabs.length <= 1) {
      alert("少なくとも1つのタブが必要です。");
      return;
    }
    const newTabs = editingTabs.filter((_, i) => i !== index);
    setEditingTabs(newTabs);
  };

  // 編集内容を保存してモーダルを閉じる処理
  const handleSave = () => {
    onSave(editingTabs, editingMaxTabs);
    onClose();
  };

  // --- ドラッグ＆ドロップ関連の処理 ---

  // ドラッグ開始時
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Firefox等での互換性のためデータをセット
    e.dataTransfer.setData('text/plain', index.toString());
    
    // ドラッグ中の要素は少し半透明にする
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  // ドラッグ中（他の要素の上に重なった時の入れ替え処理）
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault(); // ドロップを許可するために必須
    
    // 自分自身の上にある場合や、ドラッグ中でない場合は何もしない
    if (draggedIndex === null || draggedIndex === index) return;

    // 配列の順序を入れ替える
    const newTabs = [...editingTabs];
    const draggedItem = newTabs[draggedIndex];
    
    // 元の位置から削除し、新しい位置に挿入
    newTabs.splice(draggedIndex, 1);
    newTabs.splice(index, 0, draggedItem);

    setEditingTabs(newTabs);
    setDraggedIndex(index); // ドラッグ中のインデックスを更新
  };

  // ドラッグ終了時
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedIndex(null);
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '1';
    }
    setIsDragEnabled(false); // ドラッグモードを解除
  };

  // モバイル用：矢印ボタンによる並び替え
  const moveTab = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === editingTabs.length - 1) return;

    const newTabs = [...editingTabs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // 分割代入を使って要素を入れ替え
    [newTabs[index], newTabs[targetIndex]] = [newTabs[targetIndex], newTabs[index]];
    setEditingTabs(newTabs);
  };

  // --- ヘルパー関数 ---

  // 入力がURLかどうかを簡易判定（RSSアイコン表示用）
  const isUrl = (str: string) => {
    const s = str.trim();
    return s.startsWith('http://') || s.startsWith('https://');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
        
        {/* ヘッダーエリア */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#222]">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <i className="fas fa-sliders-h text-blue-500"></i>
              タブの管理
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                editingTabs.length >= editingMaxTabs 
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {editingTabs.length} / {editingMaxTabs}
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

        {/* 設定エリア（最大タブ数） */}
        <div className="px-6 py-3 bg-blue-50/50 dark:bg-blue-900/10 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <label className="text-sm font-bold text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <i className="fas fa-list-ol text-blue-500"></i>
            最大タブ数設定
          </label>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              min="1" 
              max="20"
              value={editingMaxTabs}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 1 && val <= 20) {
                  setEditingMaxTabs(val);
                }
              }}
              className="w-16 px-2 py-1 text-center rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#262626] font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <span className="text-xs text-gray-400">個まで</span>
          </div>
        </div>

        {/* タブリスト編集エリア（スクロール可能） */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-100 dark:bg-[#121212]">
          {editingTabs.map((tab, index) => {
            const isRss = isUrl(tab.keyword);
            const isDragging = draggedIndex === index;

            return (
              <div 
                key={tab.id} 
                // ドラッグ＆ドロップ用の属性設定
                draggable={isDragEnabled}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`group bg-white dark:bg-[#262626] rounded-xl border shadow-sm transition-all duration-200 overflow-hidden relative
                  ${isDragging 
                    ? 'border-blue-500 shadow-xl ring-2 ring-blue-500/20 z-10 scale-[1.02]' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <div className="flex items-stretch">
                  {/* ドラッグハンドル（ここをマウスオーバー/タッチした時だけドラッグ可能にする） */}
                  <div 
                    className="w-12 bg-gray-50 dark:bg-[#333] border-r border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors group-hover:bg-gray-100 dark:group-hover:bg-[#3a3a3a]"
                    onMouseEnter={() => setIsDragEnabled(true)}
                    onMouseLeave={() => setIsDragEnabled(false)}
                    onTouchStart={() => setIsDragEnabled(true)}
                    onTouchEnd={() => setIsDragEnabled(false)}
                    title="ドラッグして並び替え"
                  >
                    <i className="fas fa-grip-vertical text-lg"></i>
                  </div>

                  {/* フォームエリア */}
                  <div className="flex-1 p-4 grid gap-4">
                    {/* 上段: タブ名と操作ボタン */}
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
                            placeholder="例: ガジェット"
                          />
                        </div>
                      </div>

                      {/* ボタン類（モバイル用並び替え・削除） */}
                      <div className="flex items-center gap-1">
                        {/* モバイルでドラッグしにくい場合の矢印ボタン */}
                        <div className="flex flex-col gap-1 mr-2 sm:hidden">
                           <button 
                             type="button"
                             onClick={() => moveTab(index, 'up')}
                             disabled={index === 0}
                             className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 dark:bg-[#333] text-gray-500 disabled:opacity-30 active:bg-gray-200"
                           >
                             <i className="fas fa-chevron-up text-xs"></i>
                           </button>
                           <button 
                             type="button"
                             onClick={() => moveTab(index, 'down')}
                             disabled={index === editingTabs.length - 1}
                             className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 dark:bg-[#333] text-gray-500 disabled:opacity-30 active:bg-gray-200"
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
                        {/* 入力内容に応じてバッジを切り替え（Search / RSS） */}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                          isRss 
                            ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800' 
                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                        }`}>
                          {isRss 
                            ? <><i className="fas fa-rss text-[9px]"></i>RSS Feed</> 
                            : <><i className="fas fa-search text-[9px]"></i>Search</>
                          }
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
                          // モードに応じて背景色やボーダー色を変更
                          className={`w-full pl-10 pr-3 py-2 rounded-lg border focus:ring-2 outline-none transition-all text-sm font-mono
                            ${isRss 
                              ? 'bg-orange-50/30 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/50 focus:ring-orange-500 text-orange-900 dark:text-orange-100 placeholder-orange-300' 
                              : 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/50 focus:ring-blue-500 text-blue-900 dark:text-blue-100 placeholder-blue-300'
                            }
                          `}
                          placeholder={isRss ? "例: https://example.com/feed.xml" : "例: バス 減便"}
                        />
                      </div>
                      
                      {/* ソースタイプの説明テキスト */}
                      <div className="mt-1.5 flex items-start gap-1.5 text-[10px] px-1">
                        {isRss ? (
                          <>
                            <i className="fas fa-info-circle text-orange-400 mt-0.5"></i>
                            <span className="text-orange-600/80 dark:text-orange-400/80 leading-tight">
                              URLが検出されました。RSSフィードから直接ニュースを取得します。
                            </span>
                          </>
                        ) : (
                          <>
                            <i className="fas fa-info-circle text-blue-400 mt-0.5"></i>
                            <span className="text-blue-600/80 dark:text-blue-400/80 leading-tight">
                              キーワードが入力されています。Google Newsで検索して結果を表示します。
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 新規追加ボタン */}
          <button 
            type="button"
            onClick={handleAddTab}
            disabled={editingTabs.length >= editingMaxTabs}
            className={`w-full py-4 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 
              ${editingTabs.length >= editingMaxTabs 
                ? 'border-gray-200 bg-gray-50 text-gray-300 dark:border-gray-800 dark:bg-[#222] dark:text-gray-600 cursor-not-allowed' 
                : 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-bold hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 bg-gray-50 dark:bg-[#1a1a1a]'
              }`}
          >
            {editingTabs.length >= editingMaxTabs ? (
               <>
                 <i className="fas fa-ban"></i>
                 これ以上追加できません（最大{editingMaxTabs}個）
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
